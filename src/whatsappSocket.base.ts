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
    makeCacheableSignalKeyStore,
    type MessageUpsertType,
    type UserFacingSocketConfig,
    type WAMessage,
    type WASocket,
    useMultiFileAuthState,
    type AuthenticationState,
} from '@fadzzzslebew/baileys';
import { type StringValue } from 'ms';
import type { Logger as MyLogger } from 'stack-trace-logger';
import fs from 'node:fs';
import QRCode from 'qrcode';
import { type Collection, type Document as MongoDocument, MongoClient } from 'mongodb';
import P from 'pino';
import type { Boom } from '@hapi/boom';
import useMongoDBAuthState from './mongoAuthState.ts';
import { sleep } from './helpers.ts';

const pinoLogger: any = P({ level: 'silent' });

export type WhatsappSocketBaseProps = (
    | { mongoURL: string; fileAuthStateDirectoryPath?: string | undefined }
    | { mongoURL?: string | undefined; fileAuthStateDirectoryPath: string }
) & {
    appName?: string;
    logger?: MyLogger;
    mongoCollection?: string;
    onOpen?: () => Promise<void> | void;
    onClose?: () => Promise<void> | void;
    onConnectionStatusChange?: (connectionStatus: 'connecting' | 'close' | 'open') => Promise<void> | void;
    onReceiveMessages?: (messages: WAMessage[], type: MessageUpsertType) => Promise<void> | void;
    onPreConnectionSendMessageFailed?: (error: Error | string) => Promise<void> | void;
    onQR?: (qr: string, code?: string | null) => Promise<void> | void;
    debug?: boolean;
    printQRInTerminal?: boolean;
    pairingPhone?: string;
    customPairingCode?: string;
};

export class WhatsappSocketBase {
    protected socket: null | WASocket | undefined;
    protected readonly fileAuthStateDirectoryPath?: string;
    protected readonly mongoURL?: string;
    protected readonly mongoCollection: string = 'whatsapp-auth';
    protected readonly logger?: MyLogger;
    protected readonly debug?: boolean;
    protected readonly printQRInTerminal?: boolean;
    protected readonly pairingPhone?: string;
    protected readonly customPairingCode?: string;
    protected readonly appName?: string;
    private readonly onPreConnectionSendMessageFailed?: (error: Error | string) => Promise<void> | void;
    private onOpen?: () => Promise<void> | void;
    private onClose?: () => Promise<void> | void;
    private onQR?: (qr: string, code?: string | null) => Promise<void> | void;
    private onConnectionStatusChange?: (connectionStatus: 'open' | 'close' | 'connecting') => Promise<void> | void;
    private readonly onReceiveMessages?: (messages: WAMessage[], type: MessageUpsertType) => Promise<void> | void;
    static DEFAULT_COUNTRY_CODE: string = '972';
    static CONNECTION_TIMEOUT: StringValue = '2s';

    static formatPhoneNumber(phone: string, countryCode: string = WhatsappSocketBase.DEFAULT_COUNTRY_CODE): string {
        if (phone.endsWith('@s.whatsapp.net')) return phone;

        let strNumber = phone.replace(/[^0-9]/g, '');
        if (strNumber.startsWith('05')) strNumber = strNumber.substring(1);
        if (!strNumber.startsWith(countryCode)) strNumber = countryCode + strNumber;

        return strNumber; // formatted Number should look like: '+972 051-333-4444' to: '972513334444'
    }

    static formatPhoneNumberToWhatsappPattern(
        phone: string,
        countryCode: string = WhatsappSocketBase.DEFAULT_COUNTRY_CODE
    ): string {
        if (phone.endsWith('@s.whatsapp.net')) return phone;

        let strNumber = WhatsappSocketBase.formatPhoneNumber(phone, countryCode);
        strNumber = `${strNumber}@s.whatsapp.net`; // formatted Number should look like: '972513334444@s.whatsapp.net'
        return strNumber;
    }

    static getWhatsappPhoneLink({
        phone,
        message,
        countryCode = WhatsappSocketBase.DEFAULT_COUNTRY_CODE,
    }: {
        phone: string;
        countryCode?: string;
        message?: string;
    }) {
        const formattedPhone = this.formatPhoneNumber(phone, countryCode);
        const messageQuery = message ? `?text=${encodeURI(message)}` : '';
        return `https://wa.me/${formattedPhone}${messageQuery}`;
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

    static async qrToTerminalString(qr: string, options: { small?: boolean; [key: string]: any } = {}) {
        return QRCode.toString(qr, { type: 'terminal', small: true, ...options });
    }

    // only 8 alphanumeric (no more or less), patterns [a-z0-8] | aaaa[0-8] xxzzvvcc [zaq0-8]
    static randomPairingCode(pattern: string, length = 8) {
        // no randomness needed
        if (!pattern.includes('[') && pattern.length === length) {
            return pattern;
        }

        let result = '';
        let pool: string[] = [];

        const buildPool = (block: string) => {
            const chars: string[] = [];

            for (let i = 0; i < block.length; i++) {
                if (block[i + 1] === '-' && block[i + 2]) {
                    const start = block.charCodeAt(i);
                    const end = block.charCodeAt(i + 2);

                    for (let c = start; c <= end; c++) {
                        chars.push(String.fromCharCode(c));
                    }

                    i += 2;
                } else {
                    chars.push(block[i]);
                }
            }

            return chars;
        };

        for (let i = 0; i < pattern.length && result.length < length; i++) {
            const char = pattern[i];

            if (char === '[') {
                const end = pattern.indexOf(']', i);
                const block = pattern.slice(i + 1, end);

                pool = buildPool(block);
                i = end;
            } else {
                result += char;
            }
        }

        // fill remaining from pool
        while (result.length < length && pool.length) {
            result += pool[Math.floor(Math.random() * pool.length)];
        }

        const upperCaseResult = result.toUpperCase();
        return upperCaseResult.padEnd(length, upperCaseResult);
    }

    private static instances: Map<string, WhatsappSocketBase> = new Map();

    static getInstance(props: WhatsappSocketBaseProps): WhatsappSocketBase {
        const instanceKey =
            props.appName ||
            props.pairingPhone ||
            props.mongoCollection ||
            props.fileAuthStateDirectoryPath ||
            'default';

        if (!WhatsappSocketBase.instances.has(instanceKey)) {
            new WhatsappSocketBase(props);
        }

        return WhatsappSocketBase.instances.get(instanceKey)!;
    }

    static clearInstance(key?: string): void {
        if (key) {
            WhatsappSocketBase.instances.delete(key);
        } else {
            WhatsappSocketBase.instances.clear();
        }
    }

    constructor({
        fileAuthStateDirectoryPath,
        mongoURL,
        mongoCollection = 'whatsapp-auth',
        logger,
        onOpen,
        onClose,
        onQR,
        onReceiveMessages,
        onConnectionStatusChange,
        debug,
        printQRInTerminal,
        pairingPhone,
        customPairingCode,
        onPreConnectionSendMessageFailed,
        appName,
    }: WhatsappSocketBaseProps) {
        const instanceKey = appName || pairingPhone || mongoCollection || fileAuthStateDirectoryPath || 'default';
        if (WhatsappSocketBase.instances.has(instanceKey)) {
            const instance = WhatsappSocketBase.instances.get(instanceKey)!;
            // instance.logger?.debug('WHATSAPP', 'RETURN SINGLETON INSTANCE!');
            return instance;
        }

        this.appName = appName;
        this.mongoURL = mongoURL;
        this.fileAuthStateDirectoryPath = fileAuthStateDirectoryPath;
        this.mongoCollection = mongoCollection;
        this.logger = logger;
        this.debug = debug;
        this.printQRInTerminal = printQRInTerminal;
        this.pairingPhone = pairingPhone;
        this.customPairingCode = customPairingCode;
        this.socket = null;
        this.onPreConnectionSendMessageFailed = onPreConnectionSendMessageFailed;
        this.onConnectionStatusChange = onConnectionStatusChange;
        this.onReceiveMessages = onReceiveMessages;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.onQR = onQR;

        WhatsappSocketBase.instances.set(instanceKey, this);
    }

    private async getLatestWhatsAppVersion(): Promise<[number, number, number]> {
        try {
            // Try multiple sources
            const sources = [
                'https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json',
                'https://raw.githubusercontent.com/whiskeysockets/baileys/master/src/Defaults/baileys-version.json',
            ];

            for (const url of sources) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        return data.version as [number, number, number];
                    }
                } catch (err) {
                    continue;
                }
            }

            // Fallback to a known working version
            console.log('Could not fetch version, using fallback');
            return [2, 3000, 1015901307]; // Recent version as of late 2024
        } catch (error) {
            console.error('Error fetching version:', error);
            return [2, 3000, 1015901307]; // Fallback
        }
    }

    private async getAuthCollection(): Promise<[] | [Collection<MongoDocument>, MongoClient]> {
        if (!this.mongoURL) return [];

        const mongoClient = new MongoClient(this.mongoURL);
        await mongoClient.connect();
        const collection = mongoClient.db().collection(this.mongoCollection);

        return [collection, mongoClient];
    }

    private async authenticate(): Promise<{ auth: AuthenticationState; saveCreds: any }> {
        if (!this.mongoURL && !this.fileAuthStateDirectoryPath) {
            throw new Error('fileAuthStateDirectoryPath/MongoURL is missing');
        }
        if (!this.mongoURL) {
            const { saveCreds, state } = await useMultiFileAuthState(this.fileAuthStateDirectoryPath as string);
            return { auth: state, saveCreds };
        }

        const [collection] = await this.getAuthCollection();

        const { state, saveCreds } = await useMongoDBAuthState(collection);
        const auth = {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pinoLogger as any),
        } as AuthenticationState;

        return { auth, saveCreds };
    }

    async startConnection({
        options,
        connectionAttempts = 3,
        onOpen = this.onOpen,
        onClose = this.onClose,
        onQR = this.onQR,
        onConnectionStatusChange = this.onConnectionStatusChange,
        pairingPhone: _pairingPhone,
        debug: _debug,
    }: {
        options?: UserFacingSocketConfig;
        debug?: boolean;
        pairingPhone?: string;
        connectionAttempts?: number;
        onOpen?: () => Promise<void> | void;
        onClose?: () => Promise<void> | void;
        onQR?: (qr: string, code?: string | null) => Promise<void> | void;
        onConnectionStatusChange?: (status: 'open' | 'close' | 'connecting') => Promise<void> | void;
    } = {}): Promise<WASocket | null> {
        const pairingPhone = _pairingPhone ?? this.pairingPhone;
        const { saveCreds, auth } = await this.authenticate();
        const debug = _debug === undefined ? this.debug : _debug;

        // Fetch latest Baileys version for better compatibility
        const version = await this.getLatestWhatsAppVersion();

        const connect = async (): Promise<WASocket | null> => {
            return new Promise((resolve) => {
                const sock = makeWASocket({
                    version: version,
                    logger: pinoLogger,
                    browser: [this.appName || 'baileys', '1.0.0', ''], // ['Ubuntu', 'Chrome', '20.0.04'],
                    syncFullHistory: false, // Don't sync full history on first connect
                    shouldSyncHistoryMessage: () => false,
                    shouldIgnoreJid: (jid) => jid.includes('@newsletter'), // Ignore newsletter
                    ...options,
                    printQRInTerminal: false,
                    ...{ auth },
                });

                // CRITICAL: Handle connection updates properly
                sock.ev.on('connection.update', async (update) => {
                    const { connection, lastDisconnect, qr } = update;

                    if (qr) {
                        if (debug) this.logger?.info('WHATSAPP', 'QR Code received', { qr });
                        if (this.printQRInTerminal) {
                            const qrcode = await WhatsappSocketBase.qrToTerminalString(qr, { small: true }).catch(
                                () => null
                            );
                            console.log(qrcode);
                        }

                        // @ts-ignore
                        const pair = this.customPairingCode
                            ? WhatsappSocketBase.randomPairingCode(this.customPairingCode)
                            : undefined;

                        const pairing = pairingPhone ? WhatsappSocketBase.formatPhoneNumber(pairingPhone) : null;
                        const code = pairing ? await sock.requestPairingCode(pairing) : null;

                        if (debug && this.printQRInTerminal) {
                            this.logger?.info('WHATSAPP', 'QR Pairing Code', { code, pairingPhone: pairing });
                        }
                        await onQR?.(qr, code);
                    }

                    switch (connection) {
                        case 'connecting': {
                            if (debug) this.logger?.debug('WHATSAPP', 'Connecting...');
                            onConnectionStatusChange?.('connecting');
                            break;
                        }

                        case 'open': {
                            if (debug) this.logger?.info('WHATSAPP', 'Connection opened successfully!');
                            this.socket = sock;
                            await onOpen?.();
                            onConnectionStatusChange?.('open');
                            resolve(this.socket);
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
                                await sleep(WhatsappSocketBase.CONNECTION_TIMEOUT);
                                resolve(connect());
                            } else {
                                if (debug) this.logger?.warn('WHATSAPP', 'Logged out, clearing auth state');
                                await onClose?.();
                                this.socket = null;
                                resolve(this.socket);
                            }

                            onConnectionStatusChange?.('close');
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

                        // const msg = messages[0]
                        // if (!msg.key.fromMe && msg.message?.conversation) {
                        //     const sender = msg.key.remoteJid
                        //     const text = msg.message.conversation.toLowerCase()
                        //
                        //     console.log(`📩 Message from ${sender}: ${text}`)
                        //
                        //     if (text === 'hi') {
                        //         await sock.sendMessage(sender, { text: 'Hello! How can I help you today?' })
                        //     }
                        // }
                    });
                }
            });
        };

        const socket = await connect();
        await sleep(WhatsappSocketBase.CONNECTION_TIMEOUT);

        return socket;
    }

    async ensureSocketConnected(): Promise<WASocket | null> {
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection().catch((error: Error) => {
                this.onPreConnectionSendMessageFailed?.(error);
                return null;
            });
        }

        return this.socket;
    }

    async closeConnection() {
        if (this.socket) {
            if (this.debug) this.logger?.info('WHATSAPP', 'Closing connection');
            this.socket.end(undefined);
            this.socket = null;
        }
    }

    async clearAuthState() {
        await this.closeConnection();

        if (this.mongoURL) {
            const [collection, mongoClient] = await this.getAuthCollection();

            if (this.debug) this.logger?.info('WHATSAPP', 'Deleting auth state, required to scanning QR again');
            await collection?.deleteMany({});
            await mongoClient?.close();
        } else if (this.fileAuthStateDirectoryPath) {
            fs.rmSync(this.fileAuthStateDirectoryPath, { recursive: true, force: true });
        }
    }

    async resetConnection({ pairingPhone, autoConnect = true }: { pairingPhone?: string; autoConnect?: boolean } = {}) {
        await this.clearAuthState();
        if (!autoConnect) return;

        await sleep(WhatsappSocketBase.CONNECTION_TIMEOUT); // Wait a bit before reconnecting
        await this.startConnection({ pairingPhone });
    }

    isConnected() {
        return !!this.socket?.user;
    }
}
