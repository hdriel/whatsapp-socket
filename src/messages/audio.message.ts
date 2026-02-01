import Stream from 'node:stream';
import { getAudioFileDuration, getUrlBuffer } from '../helpers.ts';
import { ReadStream } from 'node:fs';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { sendFileFromStream } from './file-stream.message';

export async function sendAudioMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    audioSrc: string | Buffer<any> | Stream,
    {
        filename = 'audio-message.mp3',
        replyToMessageId,
        mimetype,
        seconds,
        ptt,
        mentions,
    }: {
        filename?: string;
        replyToMessageId?: string;
        mimetype?: string;
        seconds?: number;
        ptt?: boolean;
        mentions?: string[];
    } = {}
) {
    if (!jid || !audioSrc) {
        throw new Error('sendAudioMessage: jid and audio source are required.');
    }

    filename = filename && decodeURIComponent(filename);
    const audioBuffer = typeof audioSrc === 'string' ? await getUrlBuffer(audioSrc) : audioSrc;
    let durationInSeconds = seconds || (await getAudioFileDuration(audioBuffer as ReadStream, mimetype).catch(() => 0));

    if (debug) {
        logger?.debug('WHATSAPP', 'send audio message', {
            jid,
            mimetype,
            filename,
            seconds: durationInSeconds,
            replyToMessageId,
        });
    }

    return sendFileFromStream({ debug, logger, socket }, jid, audioBuffer, {
        filename,
        ...(ptt !== undefined && { ptt }), // PTT = Push To Talk (voice message)
        ...(mimetype && { mimetype: mimetype }),
        ...(durationInSeconds && { seconds: durationInSeconds }),
        ...(replyToMessageId && { replyToMessageId: replyToMessageId }),
        ...(mentions?.length && { mentions }),
    });
}
