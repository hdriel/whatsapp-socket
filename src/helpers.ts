import { ReadStream } from 'node:fs';
import ms, { type StringValue } from 'ms';
import type Stream from 'node:stream';
import { type AnyMessageContent, downloadMediaMessage, type WAMessage } from '@fadzzzslebew/baileys';
// NOTE: Hidden for Dynamic Import for ESM-only Packages
// import { parseBuffer, parseStream } from 'music-metadata';

export const getTotalSeconds = (msValue: StringValue) => {
    const value = ms(msValue);
    return value / 1000;
};

export const getMS = (msValue: number | StringValue) => {
    return typeof msValue === 'number' ? msValue : ms(msValue);
};

export const awaitIfNeeded = async <T>(value: T | Promise<T>): Promise<T> => {
    return Promise.resolve(value);
};

export async function getUrlBuffer(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
}

async function getDurationFromStream(stream: ReadStream, mimeType?: string): Promise<number> {
    try {
        const { parseStream } = await import('music-metadata');
        const metadata = await parseStream(stream, { mimeType: mimeType || 'audio/mpeg' });
        return Math.floor(metadata.format.duration || 0);
    } catch (error) {
        console.error('Error parsing stream:', error);
        throw error;
    } finally {
        if (!stream.destroyed) {
            stream.destroy();
        }
    }
}

async function getDurationFromBuffer(buffer: Buffer, mimeType?: string): Promise<number> {
    try {
        const { parseBuffer } = await import('music-metadata');
        const metadata = await parseBuffer(buffer, mimeType || 'audio/mpeg').catch(() => null);
        return metadata ? Math.floor(metadata.format.duration || 0) : 0;
    } catch (error) {
        console.error('Error parsing buffer:', error);
        throw error;
    }
}

export async function getAudioFileDuration(audioFile: ReadStream | Buffer, mimeType?: string): Promise<number> {
    if (audioFile instanceof ReadStream) {
        return getDurationFromStream(audioFile, mimeType);
    } else {
        return getDurationFromBuffer(audioFile, mimeType);
    }
}

export async function streamToBuffer(stream: Stream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

export function getFilenameMimetype(filename: string): string {
    const ext = filename?.split('.')?.pop()?.toLowerCase();
    return MIME_TYPES[ext || ''] || 'application/octet-stream';
}

export function getFilenameFromStream(_stream: Stream): string | undefined {
    // if (stream.path) {
    //     const pathStr = stream.path.toString();
    //     return basename(pathStr);
    // }
    return undefined;
}

export const sleep = (timeout: StringValue | number) => {
    return new Promise((resolve) => setTimeout(resolve, typeof timeout === 'number' ? timeout : ms(timeout)));
};

export const MIME_TYPES: { [key: string]: string } = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',

    // Videos
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    aac: 'audio/aac',
    m4a: 'audio/mp4',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
};

export const MIME_TO_TYPES: { [key: string]: 'Image' | 'Video' | 'Audio' | 'Document' | 'Sticker' } = {
    jpg: 'Image',
    jpeg: 'Image',
    'image/jpeg': 'Image',
    png: 'Image',
    'image/png': 'Image',
    ico: 'Image',
    'image/ico': 'Image',
    svg: 'Document',
    'image/svg+xml': 'Document',
    // bmp: 'Image',
    // 'image/bmp': 'Image',

    // Sticker
    webp: 'Sticker',
    'image/webp': 'Sticker',

    // Videos
    gif: 'Image',
    'image/gif': 'Image',
    mp4: 'Video',
    'video/mp4': 'Video',
    avi: 'Video',
    'video/x-msvideo': 'Video',
    mov: 'Video',
    'video/quicktime': 'Video',
    mkv: 'Video',
    'video/x-matroska': 'Video',
    webm: 'Video',
    'video/webm': 'Video',

    // Audio
    mp3: 'Audio',
    'audio/mpeg': 'Audio',
    wav: 'Audio',
    'audio/wav': 'Audio',
    ogg: 'Audio',
    'audio/ogg': 'Audio',
    opus: 'Audio',
    'audio/opus': 'Audio',
    aac: 'Audio',
    'audio/aac': 'Audio',
    m4a: 'Audio',
    'audio/mp4': 'Audio',

    // Documents
    pdf: 'Document',
    'application/pdf': 'Document',
    doc: 'Document',
    'application/msword': 'Document',
    docx: 'Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document',
    xls: 'Document',
    'application/vnd.ms-excel': 'Document',
    xlsx: 'Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Document',
    ppt: 'Document',
    'application/vnd.ms-powerpoint': 'Document',
    pptx: 'Document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Document',
    txt: 'Document',
    'text/plain': 'Document',
    zip: 'Document',
    'application/zip': 'Document',
    rar: 'Document',
    'application/x-rar-compressed': 'Document',
    '7z': 'Document',
    'application/x-7z-compressed': 'Document',
};

export function getFileMessageProps(
    buffer: Buffer,
    mimetype: string,
    options: {
        filename: string;
        caption?: string;
        ptt?: boolean;
        seconds?: number;
        gifPlayback?: boolean;
        jpegThumbnail?: Buffer | string;
    }
): AnyMessageContent {
    const [type] = mimetype.split('/');

    switch (type) {
        case 'sticker':
            return {
                sticker: buffer,
            };

        case 'image':
            return {
                image: buffer,
                caption: options.caption,
                mimetype,
                fileName: options.filename,
            };

        case 'video':
            return {
                video: buffer,
                caption: options.caption,
                mimetype,
                fileName: options.filename,
                gifPlayback: options.gifPlayback || false,
                jpegThumbnail: options.jpegThumbnail as string,
                ...(options.seconds && { seconds: options.seconds }),
            };

        case 'audio':
            if (options.ptt) {
                // Voice note
                return {
                    audio: buffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    ...(options.seconds && { seconds: options.seconds }),
                };
            }

            return {
                audio: buffer,
                mimetype,
                fileName: options.filename,
                ...(options.seconds && { seconds: options.seconds }),
            };

        default:
            // Document (PDF, DOC, etc.)
            return {
                document: buffer,
                mimetype,
                fileName: options.filename,
                caption: options.caption,
                jpegThumbnail: options.jpegThumbnail as string,
            };
    }
}

export function getBufferDataUri(buffer: Buffer, mimetype: string = 'image/jpeg'): string {
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${base64}`;
    return dataUri;
}

function formatFileSize(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

type MessageData = {
    messageId: string;
    fromMe: boolean;
    sender: string;
    username: string;
    timestamp: number;
    text?: string;
    reaction?: { messageId: string; emoji: string; timestamp: number };
    image?: {
        jpegThumbnail: Buffer;
        buffer: Buffer;
        mimetype: string;
        fileLength: number;
        fileSize: string;
        height: number;
        width: number;
        caption?: string;
    };
    video?: {
        jpegThumbnail: Buffer;
        buffer: Buffer;
        mimetype: string;
        fileLength: number;
        fileSize: string;
        caption?: string;
    };
    audio?: { buffer: Buffer; mimetype: string; fileLength: number; fileSize: string; seconds: number };
    location?: { latitude: number; longitude: number; name: string; address: string };
    file?: {
        buffer: Buffer;
        mimetype: string;
        fileLength: number;
        fileSize: string;
        fileName: string;
        caption?: string;
    };
    sticker?: { buffer: Buffer; mimetype: string; fileLength: number; fileSize: string };
    menuOption?: { participant: string; text: string; description?: string; id: string };
    buttonsResponse?: { participant: string; description?: string; text: string; id: string };
};

export async function extractMessageData(message: WAMessage): Promise<MessageData> {
    const data: MessageData = {} as MessageData;

    data.messageId = message.key.id;
    data.fromMe = message.key.fromMe;
    data.username = message.pushName ?? '';
    data.timestamp = message.messageTimestamp * 1000;

    const participantButtonsResponse = message.message?.buttonsResponseMessage?.contextInfo?.participant;
    data.sender = participantButtonsResponse ?? message.key.participant ?? message.key.remoteJid;
    if (data.sender.endsWith('@lid')) data.sender = '';

    data.text = message.message.conversation ?? message.message.extendedTextMessage?.text ?? undefined;

    data.reaction = message.message.reactionMessage
        ? {
              messageId: message.message.reactionMessage?.key.id,
              emoji: message.message.reactionMessage?.text ?? '',
              timestamp: +message.message.reactionMessage?.senderTimestampMs,
          }
        : undefined;

    if (message.message?.imageMessage) {
        const mimetype = message.message.imageMessage.mimetype;
        const jpegThumbnail = Buffer.from(message.message.imageMessage.jpegThumbnail, 'base64');
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        const fileLength = message.message.imageMessage.fileLength.low;

        data.image = {
            mimetype,
            buffer,
            jpegThumbnail,
            fileLength,
            fileSize: formatFileSize(fileLength),
            height: message.message.imageMessage.height,
            width: message.message.imageMessage.width,
            caption: message.message.imageMessage.caption,
        };
    }

    if (message.message?.videoMessage) {
        const mimetype = message.message.videoMessage.mimetype;
        const jpegThumbnail = Buffer.from(message.message.videoMessage.jpegThumbnail, 'base64');
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        const fileLength = message.message.videoMessage.fileLength.low;

        data.video = {
            buffer,
            jpegThumbnail,
            mimetype,
            fileLength,
            fileSize: formatFileSize(fileLength),
            caption: message.message.videoMessage.caption,
        };
    }

    if (message.message?.audioMessage) {
        const mimetype = message.message.audioMessage.mimetype;
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        const fileLength = message.message.audioMessage.fileLength.low;

        data.audio = {
            buffer,
            mimetype,
            fileLength,
            fileSize: formatFileSize(fileLength),
            seconds: message.message.audioMessage.seconds,
        };
    }

    if (message.message?.documentMessage) {
        const mimetype = message.message.documentMessage.mimetype;
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        const fileLength = message.message.documentMessage.fileLength.low;

        data.file = {
            buffer,
            mimetype,
            fileLength,
            fileSize: formatFileSize(fileLength),
            fileName: message.message.documentMessage.fileName,
            caption: message.message.documentMessage.caption,
        };
    }

    if (message.message?.stickerMessage) {
        const mimetype = message.message.stickerMessage.mimetype;
        const buffer = await downloadMediaMessage(message, 'buffer', {});
        const fileLength = message.message.stickerMessage.fileLength.low;

        // @ts-ignore
        // const dataUri = getBufferDataUri(buffer, mimetype);

        data.sticker = {
            buffer,
            mimetype,
            fileLength,
            fileSize: formatFileSize(fileLength),
        };
    }

    data.location = message.message?.locationMessage
        ? {
              latitude: message.message.locationMessage.degreesLatitude,
              longitude: message.message.locationMessage.degreesLongitude,
              name: message.message.locationMessage.name,
              address: message.message.locationMessage.address,
          }
        : undefined;

    const isMenuMessage =
        message.message.interactiveResponseMessage?.nativeFlowResponseMessage?.name === 'menu_options';

    const listMessageParamJson =
        isMenuMessage && JSON.parse(message.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);

    data.menuOption = isMenuMessage
        ? {
              participant: message.message?.interactiveResponseMessage.contextInfo.participant,
              text: message.message?.interactiveResponseMessage.body.text,
              description: listMessageParamJson.description,
              id: listMessageParamJson.id,
          }
        : undefined;

    data.buttonsResponse = message.message?.buttonsResponseMessage
        ? {
              participant: message.message?.buttonsResponseMessage.contextInfo.participant,
              description: message.message?.buttonsResponseMessage.description,
              text: message.message?.buttonsResponseMessage.selectedDisplayText,
              id: message.message?.buttonsResponseMessage.selectedButtonId,
          }
        : undefined;

    return JSON.parse(JSON.stringify(data));
}
