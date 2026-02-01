import type Stream from 'node:stream';
import { Readable } from 'stream';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { getFileMessageProps, getFilenameMimetype, streamToBuffer } from '../helpers.ts';

export async function sendFileFromStream(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    stream: Stream | Buffer,
    {
        mentions,
        ...options
    }: {
        filename: string;
        mimetype?: string;
        caption?: string;
        replyToMessageId?: string;
        // File type specific options
        ptt?: boolean; // Push to talk (voice note)
        seconds?: number; // Duration for audio/video
        gifPlayback?: boolean; // For GIF videos
        // Additional options
        jpegThumbnail?: Buffer | string; // Thumbnail for videos/documents
        mentions?: string[];
    }
): Promise<any> {
    // Convert stream to buffer if needed
    const buffer = stream instanceof Buffer ? stream : await streamToBuffer(stream as Readable);

    // Auto-detect mimetype if not provided
    const mimetype = options.mimetype || getFilenameMimetype(options.filename);

    // Determine message type based on mimetype
    const messageContent = getFileMessageProps(buffer, mimetype, options);

    const messageOptions: any = {
        ...(options.replyToMessageId && { quoted: { key: { id: options.replyToMessageId } } }),
        ...(mentions?.length && { mentions }),
    };

    if (debug) {
        logger?.debug('WHATSAPP', 'sendFileFromStream', {
            jid,
            mimetype,
            caption: (messageContent as any)?.caption,
            fileName: (messageContent as any)?.fileName,
        });
    }

    return socket?.sendMessage(jid, messageContent, messageOptions);
}
