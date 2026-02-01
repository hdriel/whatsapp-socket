import Stream from 'node:stream';
import { getUrlBuffer } from '../helpers.ts';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { sendFileFromStream } from './file-stream.message';

export async function sendDocumentMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    documentSrc: string | Buffer<any> | Stream,
    {
        filename = 'audio-message.mp3',
        caption = '',
        mimetype,
        mentions,
        jpegThumbnail,
    }: {
        filename?: string;
        caption?: string;
        mimetype?: string;
        mentions?: string[];
        jpegThumbnail?: Buffer | string;
    } = {}
) {
    if (!jid || !documentSrc) {
        throw new Error('sendDocumentMessage: jid and document source are required.');
    }

    filename = filename && decodeURIComponent(filename);
    const documentBuffer = typeof documentSrc === 'string' ? await getUrlBuffer(documentSrc) : documentSrc;

    if (debug) {
        logger?.debug('WHATSAPP', 'send document message', {
            jid,
            mimetype,
            filename,
            caption,
        });
    }

    return sendFileFromStream({ debug, logger, socket }, jid, documentBuffer, {
        filename,
        ...(caption && { caption }),
        ...(mimetype && { mimetype }),
        ...(jpegThumbnail && { jpegThumbnail }),
        ...(mentions?.length && { mentions }),
    });
}
