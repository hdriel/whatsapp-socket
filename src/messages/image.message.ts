import Stream from 'node:stream';
import { getUrlBuffer } from '../helpers.ts';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { sendFileFromStream } from './file-stream.message';
import type { ImageMessageProps } from './messages.decs.ts';

export async function sendImageMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    imageSrc: string | Buffer<any> | Stream,
    { caption = '', filename = 'image.jpg', mentions }: ImageMessageProps = {}
) {
    if (!jid || !imageSrc) {
        throw new Error('sendImageMessage: jid and image source are required.');
    }

    filename = filename && decodeURIComponent(filename);
    const imageBuffer = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;

    if (debug) {
        logger?.debug('WHATSAPP', 'send image message', { jid, caption, filename });
    }

    return sendFileFromStream({ debug, logger, socket }, jid, imageBuffer, {
        filename,
        ...(mentions?.length && { mentions }),
    });
}
