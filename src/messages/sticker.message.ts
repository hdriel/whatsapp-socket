import Stream from 'node:stream';
import { getUrlBuffer } from '../helpers.ts';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { sendFileFromStream } from './file-stream.message';

export async function sendStickerMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    imageSrc: string | Buffer<any> | Stream,
    { mentions }: { mentions?: string[] } = {}
) {
    if (!jid || !imageSrc) {
        throw new Error('sendStickerMessage: jid and sticker image source are required.');
    }

    const imageBuffer = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;

    if (debug) {
        logger?.debug('WHATSAPP', 'send sticker message', { jid });
    }

    return sendFileFromStream({ debug, logger, socket }, jid, imageBuffer, {
        mimetype: 'sticker',
        filename: 'sticker.webp',
        ...(mentions?.length && { mentions }),
    });
}
