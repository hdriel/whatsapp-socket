import { ReadStream } from 'node:fs';

import { WhatsappSocketPrivateStream, type WhatsappSocketStreamProps } from './whatsappSocket.private.stream';
import { getAudioFileDuration, getFilenameFromStream, getUrlBuffer, streamToBuffer } from './helpers';
import { basename } from 'node:path';

export class WhatsappSocketPrivateFiles extends WhatsappSocketPrivateStream {
    constructor(props: WhatsappSocketStreamProps) {
        super(props);
    }

    async sendImageMessage(
        to: string,
        imageSrc: string | Buffer<any> | ReadStream,
        { caption = '', filename }: { caption?: string; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const imageData = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;

        if (this.debug) this.logger?.debug('WHATSAPP', 'send image message', { jid, caption, filename });
        return await this.sendImage(jid, imageData, { caption, ...(filename && { filename }) });
    }

    async sendVideoMessage(
        to: string,
        videoSrc: string | Buffer<any> | ReadStream,
        {
            caption = '',
            filename,
            sendAsGifPlayback: gifPlayback = false,
        }: { caption?: string; sendAsGifPlayback?: boolean; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const videoBuffer = typeof videoSrc === 'string' ? await getUrlBuffer(videoSrc) : videoSrc;

        if (this.debug) this.logger?.debug('WHATSAPP', 'send video message', { jid, caption, filename, gifPlayback });
        return await this.sendVideo(jid, videoBuffer, { caption, gifPlayback, ...(filename && { filename }) });
    }

    async sendFileMessage(
        to: string,
        fileSrc: string | Buffer<any> | ReadStream,
        {
            caption = '',
            mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            replyToMessageId,
            jpegThumbnailSrc,
            filename: _filename,
        }: {
            caption?: string;
            mimetype?: string;
            filename?: string;
            replyToMessageId?: string;
            jpegThumbnailSrc?: string | Buffer<any> | ReadStream;
        } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const fileBuffer = typeof fileSrc === 'string' ? await getUrlBuffer(fileSrc) : fileSrc;

        let jpegThumbnailBuffer: Buffer<any> | undefined;
        if (typeof jpegThumbnailSrc === 'string') {
            jpegThumbnailBuffer = await getUrlBuffer(jpegThumbnailSrc);
        } else if (jpegThumbnailSrc instanceof ReadStream) {
            jpegThumbnailBuffer = await streamToBuffer(jpegThumbnailSrc);
        } else {
            jpegThumbnailBuffer = jpegThumbnailSrc;
        }

        let filename = 'mu-document';
        if (fileSrc instanceof ReadStream) {
            const fname = getFilenameFromStream(fileSrc);
            if (fname) filename = fname;
        } else if (typeof fileSrc === 'string') {
            filename = basename(fileSrc);
        }

        if (this.debug)
            this.logger?.debug('WHATSAPP', 'send file message', {
                jid,
                caption,
                mimetype,
                filename,
                replyToMessageId,
                includeJpegThumbnail: !!jpegThumbnailBuffer,
            });
        return await this.sendDocument(jid, fileBuffer, {
            caption,
            mimetype,
            filename,
            replyToMessageId,
            jpegThumbnail: jpegThumbnailBuffer,
        });
    }

    async sendAudioMessage(
        to: string,
        audioSrc: string | Buffer<any> | ReadStream,
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
        let durationInSeconds = seconds || (await getAudioFileDuration(audioBuffer, mimetype).catch(() => 0));

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
     * @param replyToMessageId
     */
    async sendStickerMessage(
        to: string,
        imageSrc: string | Buffer<any> | ReadStream,
        { replyToMessageId }: { replyToMessageId?: string } = {}
    ) {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const stickerBuffer = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;

        if (this.debug) this.logger?.debug('WHATSAPP', 'send sticker message', { jid, replyToMessageId });
        await this.sendSticker(jid, stickerBuffer, { replyToMessageId });
    }
}
