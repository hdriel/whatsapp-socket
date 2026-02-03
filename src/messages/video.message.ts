import Stream from 'node:stream';
import { getUrlBuffer } from '../helpers.ts';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { sendFileFromStream } from './file-stream.message';
import type { VideoMessageProps } from './messages.decs.ts';

export async function sendVideoMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    videoSrc: string | Buffer<any> | Stream,
    { caption = '', filename = 'video.mp4', sendAsGifPlayback: gifPlayback = false, mentions }: VideoMessageProps = {}
) {
    if (!jid || !videoSrc) {
        throw new Error('sendVideoMessage: jid and video source are required.');
    }

    filename = filename && decodeURIComponent(filename);
    const videoBuffer = typeof videoSrc === 'string' ? await getUrlBuffer(videoSrc) : videoSrc;

    if (debug) {
        logger?.debug('WHATSAPP', 'send video message', {
            jid,
            filename,
            gifPlayback,
            mentions,
            caption,
        });
    }

    return sendFileFromStream({ debug, logger, socket }, jid, videoBuffer, {
        filename,
        ...(caption && { caption }),
        ...(gifPlayback && { gifPlayback }),
        ...(mentions?.length && { mentions }),
    });
}
