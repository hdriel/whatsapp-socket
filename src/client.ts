// Baileys links
// https://whiskeysockets.github.io/docs/tutorial-basics/sending-messages
// https://github.com/WhiskeySockets/Baileys
// https://github.com/ndalu-id/baileys-api
// https://whiskeysockets.github.io/Baileys/
// alternatives:
// https://www.npmjs.com/package/mudslide
// https://www.npmjs.com/package/whatsapp-web.js
// https://www.npmjs.com/package/wbm
import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    type UserFacingSocketConfig,
    type WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import type { Boom } from '@hapi/boom';
import useMongoDBAuthState from './mongoAuthState.ts';
import { type Collection, type Document as MongoDocument, MongoClient } from 'mongodb';
import P from 'pino';
import type { MiscMessageGenerationOptions } from '@whiskeysockets/baileys/lib/Types/Message';

const pinoLogger = P({ level: 'silent' });

export class WhatsappSocketClient {
    private socket: null | WASocket;
    private mongoURL: string;
    private mongoCollection: string = 'whatsapp-auth';
    private logger?: any;
    private onOpen?: () => Promise<void>;
    private onClose?: () => Promise<void>;
    private onQR?: (qr: string) => Promise<void>;
    static DEFAULT_COUNTRY_CODE: string = '972';

    static formatPhoneNumber(phone: string, countryCode: string = WhatsappSocketClient.DEFAULT_COUNTRY_CODE): string {
        if (phone.endsWith('@s.whatsapp.net')) return phone;

        let strNumber = phone.replace(/[^0-9]/g, '');
        if (strNumber.startsWith('05')) strNumber = strNumber.substring(1);
        if (!strNumber.startsWith(countryCode)) strNumber = countryCode + strNumber;

        return strNumber; // formatted Number should look like: '+972 051-333-4444' to: '972513334444'
    }

    static formatPhoneNumberToWhatsappPattern(
        phone: string,
        countryCode: string = WhatsappSocketClient.DEFAULT_COUNTRY_CODE
    ): string {
        if (phone.endsWith('@s.whatsapp.net')) return phone;

        let strNumber = WhatsappSocketClient.formatPhoneNumber(phone, countryCode);
        strNumber = `${strNumber}@s.whatsapp.net`; // formatted Number should look like: '972513334444@s.whatsapp.net'
        return strNumber;
    }

    static async qrToImage(
        qr: string,
        options: {
            errorCorrectionLevel?: 'H' | 'L' | 'M';
            width?: number;
            margin?: number;
            [key: string]: any;
        }
    ) {
        return QRCode.toDataURL(qr, {
            errorCorrectionLevel: 'H', // Changed to 'H' (High) for better reliability
            width: 400, // Increased size for better scanning
            margin: 2, // Ensure adequate margin
            ...options,
        });
    }

    static async qrToTerminalString(
        qr: string,
        options: {
            small?: boolean;
            [key: string]: any;
        }
    ) {
        return QRCode.toString(qr, { type: 'terminal', small: true, ...options }).catch(() => null);
    }

    constructor({
        mongoURL,
        mongoCollection = 'whatsapp-auth',
        logger,
        onOpen,
        onClose,
        onQR,
    }: {
        logger: any;
        mongoURL: string;
        mongoCollection?: string;
        onOpen?: () => Promise<void>;
        onClose?: () => Promise<void>;
        onQR?: (qr: string) => Promise<void>;
    }) {
        this.mongoURL = mongoURL;
        this.mongoCollection = mongoCollection;
        this.logger = logger;
        this.socket = null;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.onQR = onQR;
    }

    private async getAuthCollection(): Promise<[Collection<MongoDocument>, MongoClient]> {
        const mongoClient = new MongoClient(this.mongoURL);
        await mongoClient.connect();
        const collection = mongoClient.db().collection(this.mongoCollection);

        return [collection, mongoClient];
    }

    private async authenticate() {
        const [collection] = await this.getAuthCollection();

        const { state, saveCreds } = await useMongoDBAuthState(collection);
        const auth = {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys),
        };

        return { auth, saveCreds };
    }

    async startConnection({
        options,
        connectionAttempts = 3,
        onOpen = this.onOpen,
        onClose = this.onClose,
        onQR = this.onQR,
        debug,
    }: {
        options?: UserFacingSocketConfig;
        debug?: boolean;
        connectionAttempts?: number;
        onOpen?: () => Promise<void>;
        onClose?: () => Promise<void>;
        onQR?: (qr: string) => Promise<void>;
    } = {}): Promise<WASocket> {
        const { saveCreds, auth } = await this.authenticate();

        // Fetch latest Baileys version for better compatibility
        const { version, isLatest } = await fetchLatestBaileysVersion();
        if (!isLatest) {
            this.logger?.warn('WHATSAPP', 'baileys is not the latest version!');
        }

        const connect = () => {
            const sock = makeWASocket({
                version,
                logger: pinoLogger,
                browser: ['Ubuntu', 'Chrome', '20.0.04'],
                syncFullHistory: false, // Don't sync full history on first connect
                shouldSyncHistoryMessage: () => false,
                shouldIgnoreJid: (jid) => jid.includes('@newsletter'), // Ignore newsletter
                ...options,
                auth,
            });

            // CRITICAL: Handle connection updates properly
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.logger?.info('WHATSAPP', 'QR Code received', { qr });
                    await onQR?.(qr);
                }

                switch (connection) {
                    case 'connecting': {
                        debug && this.logger?.debug('WHATSAPP', 'Connecting...');
                        break;
                    }
                    case 'open': {
                        debug && this.logger?.info('WHATSAPP', 'Connection opened successfully!');
                        this.socket = sock;
                        await onOpen?.();
                        break;
                    }

                    case 'close': {
                        const shouldReconnect =
                            connectionAttempts-- > 0 &&
                            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

                        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                        const errorMessage = lastDisconnect?.error?.message;

                        debug &&
                            this.logger?.info('WHATSAPP', 'Connection closed', {
                                statusCode,
                                errorMessage,
                                shouldReconnect,
                            });

                        // IMPORTANT: Error code 515 (Stream Errored) after QR scan is NORMAL
                        // The connection must restart after pairing - this is expected behavior
                        if (shouldReconnect && connectionAttempts) {
                            debug && this.logger?.info('WHATSAPP', 'Reconnecting...');
                            setTimeout(connect, 1000);
                        } else {
                            debug && this.logger?.warn('WHATSAPP', 'Logged out, clearing auth state');
                            await onClose?.();
                            this.socket = null;
                        }
                        break;
                    }
                }
            });

            // Save credentials when they update
            sock.ev.on('creds.update', saveCreds);

            // Handle messages
            // sock.ev.on('messages.upsert', async ({ messages, type }) => {
            //     this.logger?.info('WHATSAPP', 'Received messages', { type, count: messages.length });
            //  // Handle your messages here
            // });

            return sock;
        };

        return connect();
    }

    async closeConnection() {
        if (this.socket) {
            this.logger?.info('WHATSAPP', 'Closing connection');
            this.socket.end(undefined);
            this.socket = null;
        }
    }

    async clearAuthState() {
        const [collection, mongoClient] = await this.getAuthCollection();

        this.logger?.info('WHATSAPP', 'Deleting auth state');
        await collection.deleteMany({});
        await mongoClient.close();
    }

    async sendTextMessage(to: string, text: string, replayToMessageId?: string): Promise<any> {
        if (!this.socket) {
            this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketClient.formatPhoneNumberToWhatsappPattern(to);
        const options: MiscMessageGenerationOptions = {
            ...(replayToMessageId && { quoted: { key: { id: replayToMessageId } } }),
        };

        return this.socket?.sendMessage(jid, { text }, options);
    }

    async resetConnection() {
        await this.closeConnection();
        await this.clearAuthState();
        // Wait a bit before reconnecting
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.startConnection();
    }
}

// https://www.npmjs.com/package/@adiwajshing/baileys/v/2.1.0
// import { MessageType, MessageOptions, Mimetype } from '@adiwajshing/baileys'
// const id = 'abcd@s.whatsapp.net' // the WhatsApp ID
// // send a simple text!
// client.sendMessage (id, 'oh hello there', MessageType.text)
// // send a location!
// client.sendMessage(id, {degreeslatitude: 24.121231, degreesLongitude: 55.1121221}, MessageType.location)
// // send a contact!
// const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
//     + 'VERSION:3.0\n'
//     + 'FN:Jeff Singh\n' // full name
//     + 'ORG:Ashoka Uni;\n' // the organization of the contact
//     + 'TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\n' // WhatsApp ID + phone number
//     + 'END:VCARD'
// client.sendMessage(id, {displayname: "Jeff", vcard: vcard}, MessageType.contact)
// // send a gif
// const buffer = fs.readFileSync("Media/ma_gif.mp4") // load some gif
// const options: MessageOptions = {mimetype: Mimetype.gif, caption: "hello!"} // some metadata & caption
// client.sendMessage(id, buffer, MessageType.video, options)
