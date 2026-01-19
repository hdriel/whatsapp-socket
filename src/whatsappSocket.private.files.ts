import { WhatsappSocketPrivateStream, type WhatsappSocketStreamProps } from './whatsappSocket.private.stream';
import { getAudioFileDuration, getFilenameFromStream, getUrlBuffer, MIME_TO_TYPES, streamToBuffer } from './helpers';
import { basename } from 'node:path';
import Stream from 'node:stream';
import { ReadStream } from 'node:fs';

export class WhatsappSocketPrivateFiles extends WhatsappSocketPrivateStream {
    constructor(props: WhatsappSocketStreamProps) {
        super(props);
    }

    async sendImageMessage(
        to: string,
        imageSrc: string | Buffer<any> | Stream,
        { caption = '', filename }: { caption?: string; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const imageData = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;
        filename = filename && decodeURIComponent(filename);

        if (this.debug) this.logger?.debug('WHATSAPP', 'send image message', { jid, caption, filename });
        return await this.sendImage(jid, imageData, { caption, ...(filename && { filename }) });
    }

    async sendVideoMessage(
        to: string,
        videoSrc: string | Buffer<any> | Stream,
        {
            caption = '',
            filename,
            sendAsGifPlayback: gifPlayback = false,
        }: { caption?: string; sendAsGifPlayback?: boolean; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const videoBuffer = typeof videoSrc === 'string' ? await getUrlBuffer(videoSrc) : videoSrc;
        filename = filename && decodeURIComponent(filename);

        if (this.debug) this.logger?.debug('WHATSAPP', 'send video message', { jid, caption, filename, gifPlayback });
        return await this.sendVideo(jid, videoBuffer, { caption, gifPlayback, ...(filename && { filename }) });
    }

    async sendAudioMessage(
        to: string,
        audioSrc: string | Buffer<any> | Stream,
        {
            filename,
            replyToMessageId,
            mimetype,
            seconds,
        }: { filename?: string; replyToMessageId?: string; mimetype?: string; seconds?: number } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const audioBuffer = typeof audioSrc === 'string' ? await getUrlBuffer(audioSrc) : audioSrc;
        let durationInSeconds =
            seconds || (await getAudioFileDuration(audioBuffer as ReadStream, mimetype).catch(() => 0));
        filename = filename && decodeURIComponent(filename);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send audio message', {
                jid,
                mimetype,
                filename,
                seconds: durationInSeconds,
                replyToMessageId,
            });
        }

        return await this.sendAudio(jid, audioBuffer, {
            ...(filename && { filename }),
            ...(mimetype && { mimetype: mimetype }),
            ...(durationInSeconds && { seconds: durationInSeconds }),
            ...(replyToMessageId && { replyToMessageId: replyToMessageId }),
        });
    }

    /**
     * requirements:
     * * format .webp
     * * imageSize 512pxx512px
     * * maxSize: 100kb
     * * transparent background
     * @param to
     * @param imageSrc
     */
    async sendStickerMessage(to: string, imageSrc: string | Buffer<any> | Stream) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const stickerBuffer = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;

        if (this.debug) this.logger?.debug('WHATSAPP', 'send sticker message', { jid });
        return await this.sendSticker(jid, stickerBuffer);
    }

    async sendFileMessage(
        to: string,
        fileSrc: string | Buffer<any> | Stream,
        {
            caption = '',
            mimetype,
            replyToMessageId,
            jpegThumbnailSrc,
            autoMessageClassification = true,
            filename,
        }: {
            caption?: string;
            mimetype?: string;
            filename: string;
            autoMessageClassification?: boolean;
            replyToMessageId?: string;
            jpegThumbnailSrc?: string | Buffer<any> | Stream;
        }
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);

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

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send file message', {
                jid,
                caption,
                mimetype,
                filename,
                replyToMessageId,
                includeJpegThumbnail: !!jpegThumbnailBuffer,
            });
        }

        let sendSuccess = true;
        if (autoMessageClassification) {
            switch (MIME_TO_TYPES[mimetype as string]) {
                case 'Images':
                    await this.sendImageMessage(jid, fileBuffer, {
                        caption,
                        filename,
                    }).catch(() => (sendSuccess = false));
                    break;
                case 'Videos':
                    await this.sendVideoMessage(jid, fileBuffer, {
                        caption,
                        filename,
                    }).catch(() => (sendSuccess = false));
                    break;
                case 'Audio':
                    await this.sendAudioMessage(jid, fileBuffer, {
                        mimetype,
                        filename,
                        replyToMessageId,
                    }).catch(() => (sendSuccess = false));
                    break;
                default:
                    return await this.sendDocument(jid, fileBuffer, {
                        caption,
                        mimetype,
                        filename,
                        replyToMessageId,
                        jpegThumbnail: jpegThumbnailBuffer,
                    });
            }
        }

        if (!autoMessageClassification || !sendSuccess) {
            return await this.sendDocument(jid, fileBuffer, {
                caption,
                mimetype: mimetype || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                filename,
                replyToMessageId,
                jpegThumbnail: jpegThumbnailBuffer,
            });
        }
    }
}
