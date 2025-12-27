import fs from 'fs';
import { ReadStream } from 'node:fs';

import { WhatsappSocketStream, type WhatsappSocketStreamProps } from './whatsappSocket.stream';
export { type WhatsappSocketStreamProps as WhatsappSocketFilesProps } from './whatsappSocket.stream';
import { getAudioFileDuration, getFilenameFromStream, getUrlBuffer, streamToBuffer } from './helpers.ts';
import { basename } from 'node:path';

export class WhatsappSocketFiles extends WhatsappSocketStream {
    static DEFAULT_COUNTRY_CODE: string = '972';

    constructor(props: WhatsappSocketStreamProps) {
        super(props);
    }

    async sendImageMessage(
        to: string,
        imageSrc: string | Buffer<any> | ReadStream,
        { caption = '', filename }: { caption?: string; filename?: string } = {}
    ) {
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketFiles.formatPhoneNumberToWhatsappPattern(to);
        const imageData = typeof imageSrc === 'string' ? await getUrlBuffer(imageSrc) : imageSrc;

        return await super.sendImage(jid, imageData, { caption, ...(filename && { filename }) });
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
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketFiles.formatPhoneNumberToWhatsappPattern(to);
        const videoBuffer = typeof videoSrc === 'string' ? await getUrlBuffer(videoSrc) : videoSrc;

        return await super.sendVideo(jid, videoBuffer, { caption, gifPlayback, ...(filename && { filename }) });
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
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketFiles.formatPhoneNumberToWhatsappPattern(to);
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

        return await super.sendDocument(jid, fileBuffer, {
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
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketFiles.formatPhoneNumberToWhatsappPattern(to);
        const audioBuffer = typeof audioSrc === 'string' ? await getUrlBuffer(audioSrc) : audioSrc;
        let durationInSeconds = seconds || (await getAudioFileDuration(audioBuffer, mimetype).catch(() => 0));

        return await super.sendAudio(jid, audioBuffer, {
            ...(filename && { filename }),
            ...(mimetype && { mimetype: mimetype }),
            ...(durationInSeconds && { seconds: durationInSeconds }),
            ...(replyToMessageId && { replyToMessageId: replyToMessageId }),
        });
    }

    async sendStickerMessage() {
        // Example 7: Send sticker
        const stickerBuffer = fs.readFileSync('./sticker.webp');
        await super.sendSticker('972501234567', stickerBuffer);
    }
}
