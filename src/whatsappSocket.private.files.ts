import { WhatsappSocketPrivateStream, type WhatsappSocketStreamProps } from './whatsappSocket.private.stream';
import Stream from 'node:stream';
import { sendAudioMessage, sendFileMessage, sendImageMessage, sendStickerMessage, sendVideoMessage } from './messages';

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
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendImageMessage(baseProps, jid, imageSrc, { caption, filename });
    }

    async sendVideoMessage(
        to: string,
        videoSrc: string | Buffer<any> | Stream,
        {
            caption = '',
            filename,
            sendAsGifPlayback = false,
        }: { caption?: string; sendAsGifPlayback?: boolean; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();
        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendVideoMessage(baseProps, jid, videoSrc, { caption, filename, sendAsGifPlayback });
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
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendAudioMessage(baseProps, jid, audioSrc, { filename, replyToMessageId, mimetype, seconds });
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
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendStickerMessage(baseProps, jid, imageSrc);
    }

    async sendFileMessage(
        to: string,
        fileSrc: string | Buffer<any> | Stream,
        {
            caption = '',
            mimetype,
            jpegThumbnailSrc,
            autoMessageClassification = true,
            filename,
        }: {
            caption?: string;
            mimetype?: string;
            filename: string;
            autoMessageClassification?: boolean;
            jpegThumbnailSrc?: string | Buffer<any> | Stream;
        }
    ) {
        await this.ensureSocketConnected();
        const jid = WhatsappSocketPrivateFiles.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendFileMessage(baseProps, jid, fileSrc, {
            autoMessageClassification,
            jpegThumbnailSrc,
            mimetype,
            filename,
            caption,
        });
    }
}
