// Baileys links
// https://whiskeysockets.github.io/docs/tutorial-basics/sending-messages
// https://github.com/WhiskeySockets/Baileys
// https://github.com/ndalu-id/baileys-api
// https://whiskeysockets.github.io/Baileys/
// alternatives:
// https://www.npmjs.com/package/mudslide
// https://www.npmjs.com/package/whatsapp-web.js
// https://www.npmjs.com/package/wbm
import {
    default as makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    type MessageUpsertType,
    type MiscMessageGenerationOptions,
    type UserFacingSocketConfig,
    type WAMessage,
    type WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { type Collection, type Document as MongoDocument, MongoClient } from 'mongodb';
import P from 'pino';
import type { Boom } from '@hapi/boom';
import useMongoDBAuthState from './mongoAuthState.ts';

const pinoLogger = P({ level: 'silent' });

export class WhatsappSocketClient {
    private socket: null | WASocket;
    private readonly mongoURL: string;
    private readonly mongoCollection: string = 'whatsapp-auth';
    private readonly logger?: any;
    private readonly debug?: boolean;
    private readonly printQRInTerminal?: boolean;
    private onOpen?: () => Promise<void>;
    private onClose?: () => Promise<void>;
    private onQR?: (qr: string) => Promise<void>;
    private onReceiveMessages?: (messages: WAMessage[], type: MessageUpsertType) => Promise<void>;
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

    static getWhatsappPhoneLink({
        phone,
        message,
        countryCode = this.DEFAULT_COUNTRY_CODE,
    }: {
        phone: string;
        countryCode?: string;
        message?: string;
    }) {
        const formattedPhone = this.formatPhoneNumber(phone, countryCode);
        const query = { ...(message && { text: encodeURI(message) }) };
        return `https://wa.me/${formattedPhone}?${query}`;
    }

    static async qrToImage(
        qr: string,
        options: {
            errorCorrectionLevel?: 'H' | 'L' | 'M';
            width?: number;
            margin?: number;
            [key: string]: any;
        } = {}
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
        } = {}
    ) {
        return QRCode.toString(qr, { type: 'terminal', small: true, ...options });
    }

    constructor({
        mongoURL,
        mongoCollection = 'whatsapp-auth',
        logger,
        onOpen,
        onClose,
        onQR,
        onReceiveMessages,
        debug,
        printQRInTerminal,
    }: {
        logger?: any;
        mongoURL: string;
        mongoCollection?: string;
        onOpen?: () => Promise<void>;
        onClose?: () => Promise<void>;
        onReceiveMessages?: (messages: WAMessage[], type: MessageUpsertType) => Promise<void>;
        onQR?: (qr: string) => Promise<void>;
        debug?: boolean;
        printQRInTerminal?: boolean;
    }) {
        this.mongoURL = mongoURL;
        this.mongoCollection = mongoCollection;
        this.logger = logger;
        this.debug = debug;
        this.printQRInTerminal = printQRInTerminal;
        this.socket = null;
        this.onReceiveMessages = onReceiveMessages;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.onQR = onQR;
    }

    private async getAuthCollection(): Promise<[] | [Collection<MongoDocument>, MongoClient]> {
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
        debug: _debug,
    }: {
        options?: UserFacingSocketConfig;
        debug?: boolean;
        connectionAttempts?: number;
        onOpen?: () => Promise<void>;
        onClose?: () => Promise<void>;
        onQR?: (qr: string) => Promise<void>;
    } = {}): Promise<WASocket> {
        const { saveCreds, auth } = await this.authenticate();
        const debug = _debug === undefined ? this.debug : _debug;

        // Fetch latest Baileys version for better compatibility
        const { version, isLatest } = await fetchLatestBaileysVersion();
        if (!isLatest) {
            if (debug) this.logger?.warn('WHATSAPP', 'current baileys service is not the latest version!');
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
                ...{ auth },
            });

            // CRITICAL: Handle connection updates properly
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    if (debug) this.logger?.info('WHATSAPP', 'QR Code received', { qr });
                    if (this.printQRInTerminal) {
                        const qrcode = await WhatsappSocketClient.qrToTerminalString(qr, { small: true }).catch(
                            () => null
                        );
                        console.log(qrcode);
                    }

                    await onQR?.(qr);
                }

                switch (connection) {
                    case 'connecting': {
                        if (debug) this.logger?.debug('WHATSAPP', 'Connecting...');
                        break;
                    }

                    case 'open': {
                        if (debug) this.logger?.info('WHATSAPP', 'Connection opened successfully!');
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

                        if (debug) {
                            this.logger?.info('WHATSAPP', 'Connection closed', {
                                statusCode,
                                errorMessage,
                                shouldReconnect,
                            });
                        }

                        // IMPORTANT: Error code 515 (Stream Errored) after QR scan is NORMAL
                        // The connection must restart after pairing - this is expected behavior
                        if (shouldReconnect && connectionAttempts) {
                            if (debug) this.logger?.info('WHATSAPP', 'Reconnecting...');
                            setTimeout(connect, 1000);
                        } else {
                            if (debug) this.logger?.warn('WHATSAPP', 'Logged out, clearing auth state');
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
            if (this.onReceiveMessages && typeof this.onReceiveMessages === 'function') {
                sock.ev.on('messages.upsert', async ({ messages, type }) => {
                    this.logger?.info('WHATSAPP', 'Received messages', { type, totalMessages: messages.length });
                    this.onReceiveMessages?.(messages, type);
                });
            }

            return sock;
        };

        return connect();
    }

    async closeConnection() {
        if (this.socket) {
            if (this.debug) this.logger?.info('WHATSAPP', 'Closing connection');
            this.socket.end(undefined);
            this.socket = null;
        }
    }

    async clearAuthState() {
        const [collection, mongoClient] = await this.getAuthCollection();

        if (this.debug) this.logger?.info('WHATSAPP', 'Deleting auth state, required to scanning QR again');
        await collection?.deleteMany({});
        await mongoClient?.close();
    }

    async sendTextMessage(to: string, text: string, replayToMessageId?: string): Promise<any> {
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
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
