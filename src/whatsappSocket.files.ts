import { WhatsappSocketStream, type WhatsappSocketStreamProps } from './whatsappSocket.stream';
export { type WhatsappSocketStreamProps as WhatsappSocketFilesProps } from './whatsappSocket.stream';
import fs from 'fs';
import { ReadStream } from 'node:fs';
import { getImageBuffer } from './helpers.ts';

export class WhatsappSocketFiles extends WhatsappSocketStream {
    static DEFAULT_COUNTRY_CODE: string = '972';

    constructor(props: WhatsappSocketStreamProps) {
        super(props);
    }

    async sendImageMessage(to: string, imageSrc: string | Buffer | ReadStream, caption: string, filename?: string) {
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketFiles.formatPhoneNumberToWhatsappPattern(to);
        const imageData = typeof imageSrc === 'string' ? await getImageBuffer(imageSrc) : imageSrc;

        return await super.sendImage(jid, imageData, { caption, ...(filename && { filename }) });
    }

    async sendFileMessage() {
        // Example 3: Send PDF document
        const pdfStream = fs.createReadStream('./report.pdf');
        await super.sendDocument('972501234567', pdfStream, {
            filename: 'monthly-report.pdf',
            caption: 'Here is the monthly report',
        });

        // Example 6: Send generic file from stream
        const fileStream = fs.createReadStream('./document.docx');
        await super.sendFileFromStream('972501234567', fileStream, {
            filename: 'document.docx',
            caption: 'Important document',
            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
    }

    async sendAudioMessage() {
        // Example 4: Send voice note
        const audioStream = fs.createReadStream('./voice.ogg');
        await super.sendVoiceNote('972501234567', audioStream, {
            seconds: 15, // duration in seconds
        });
    }

    async sendVideoMessage() {
        // Example 5: Send video with GIF playback
        const videoBuffer = fs.readFileSync('./animation.mp4');
        await super.sendVideo('972501234567', videoBuffer, {
            gifPlayback: true,
            caption: 'Cool animation!',
        });
    }

    async sendStickerMessage() {
        // Example 7: Send sticker
        const stickerBuffer = fs.readFileSync('./sticker.webp');
        await super.sendSticker('972501234567', stickerBuffer);
    }
}
