import { WhatsappSocketStream, type WhatsappSocketStreamProps } from './whatsappSocket.stream';
export { type WhatsappSocketStreamProps as WhatsappSocketFilesProps } from './whatsappSocket.stream';
import fs from 'fs';

export class WhatsappSocketFiles extends WhatsappSocketStream {
    static DEFAULT_COUNTRY_CODE: string = '972';

    constructor(props: WhatsappSocketStreamProps) {
        super(props);
    }

    async sendImageMessage() {
        // Example 1: Send image from file stream
        const imageStream = fs.createReadStream('./photo.jpg');
        await super.sendImage('972501234567', imageStream, {
            caption: 'Check out this photo!',
            filename: 'vacation.jpg',
        });

        // Example 2: Send image from buffer
        const imageBuffer = fs.readFileSync('./photo.jpg');
        await super.sendImage('972501234567', imageBuffer, {
            caption: 'Another photo',
        });
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
