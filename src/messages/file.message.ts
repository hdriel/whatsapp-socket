import Stream from 'node:stream';
import { getFilenameFromStream, getFilenameMimetype, getUrlBuffer, MIME_TO_TYPES, streamToBuffer } from '../helpers.ts';
import { basename } from 'node:path';
import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import { sendAudioMessage } from './audio.message';
import { sendImageMessage } from './image.message';
import { sendVideoMessage } from './video.message';
import { sendStickerMessage } from './sticker.message';
import { sendDocumentMessage } from './document.message';
import type { FileMessageProps } from './messages.decs.ts';

export async function sendFileMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    fileSrc: string | Buffer<any> | Stream,
    { caption = '', mimetype, jpegThumbnailSrc, autoMessageClassification = true, filename, mentions }: FileMessageProps
) {
    let jpegThumbnailBuffer: Buffer<any> | undefined;
    if (typeof jpegThumbnailSrc === 'string') {
        jpegThumbnailBuffer = await getUrlBuffer(jpegThumbnailSrc);
    } else if (jpegThumbnailSrc instanceof Stream) {
        jpegThumbnailBuffer = await streamToBuffer(jpegThumbnailSrc);
    } else {
        jpegThumbnailBuffer = jpegThumbnailSrc;
    }

    const fileBuffer = typeof fileSrc === 'string' ? await getUrlBuffer(fileSrc) : fileSrc;
    if (fileSrc instanceof Stream) {
        const fname = getFilenameFromStream(fileSrc);
        if (fname) filename = fname;
    } else if (typeof fileSrc === 'string') {
        filename = basename(fileSrc);
    }

    filename = filename && decodeURIComponent(filename);
    mimetype ||= getFilenameMimetype(filename);
    mimetype = mimetype?.toLowerCase();

    if (debug) {
        logger?.debug('WHATSAPP', 'send file message', {
            jid,
            caption,
            mimetype,
            filename,
            includeJpegThumbnail: !!jpegThumbnailBuffer,
        });
    }

    let sendSuccess = true;
    let response: any;
    if (autoMessageClassification) {
        switch (MIME_TO_TYPES[mimetype as string]) {
            case 'Image':
                response = await sendImageMessage({ debug, logger, socket }, jid, fileBuffer, {
                    caption,
                    filename,
                    mentions,
                }).catch(() => (sendSuccess = false));
                break;
            case 'Sticker':
                response = await sendStickerMessage({ debug, logger, socket }, jid, fileBuffer, { mentions }).catch(
                    () => (sendSuccess = false)
                );
                break;
            case 'Video':
                response = await sendVideoMessage({ debug, logger, socket }, jid, fileBuffer, {
                    caption,
                    filename,
                    mentions,
                }).catch(() => (sendSuccess = false));
                break;
            case 'Audio':
                response = await sendAudioMessage({ debug, logger, socket }, jid, fileBuffer, {
                    mimetype,
                    filename,
                    mentions,
                }).catch(() => (sendSuccess = false));
                break;
            default:
                return await sendDocumentMessage({ debug, logger, socket }, jid, fileBuffer, {
                    caption,
                    mimetype,
                    filename,
                    jpegThumbnail: jpegThumbnailBuffer,
                    mentions,
                });
        }
    }

    if (response && sendSuccess) return response;
    if (!autoMessageClassification || !sendSuccess) {
        return await sendDocumentMessage({ debug, logger, socket }, jid, fileBuffer, {
            caption,
            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename,
            jpegThumbnail: jpegThumbnailBuffer,
            mentions,
        });
    }
}
