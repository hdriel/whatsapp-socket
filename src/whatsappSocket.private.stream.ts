import { type AnyMessageContent } from '@fadzzzslebew/baileys';
import { Readable } from 'stream';
import { WhatsappSocketPrivateMessages, type WhatsappSocketMessagesProps } from './whatsappSocket.private.messages.ts';
import { MIME_TYPES } from './helpers.ts';
export { type WhatsappSocketMessagesProps as WhatsappSocketStreamProps } from './whatsappSocket.private.messages.ts';

export class WhatsappSocketPrivateStream extends WhatsappSocketPrivateMessages {
    constructor(props: WhatsappSocketMessagesProps) {
        super(props);
    }

    protected async sendFileFromStream(
        to: string,
        stream: Readable | Buffer,
        options: {
            filename: string;
            mimetype?: string;
            caption?: string;
            replyToMessageId?: string;
            // File type specific options
            ptt?: boolean; // Push to talk (voice note)
            seconds?: number; // Duration for audio/video
            gifPlayback?: boolean; // For GIF videos
            // Additional options
            jpegThumbnail?: Buffer | string; // Thumbnail for videos/documents
        }
    ): Promise<any> {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateStream.formatPhoneNumberToWhatsappPattern(to);

        // Convert stream to buffer if needed
        const buffer = stream instanceof Buffer ? stream : await this.streamToBuffer(stream as Readable);

        // Auto-detect mimetype if not provided
        const mimetype = options.mimetype || this.getMimetypeFromFilename(options.filename);

        // Determine message type based on mimetype
        const messageContent = await this.createFileMessage(buffer, mimetype, options);

        const messageOptions: any = {
            ...(options.replyToMessageId && {
                quoted: { key: { id: options.replyToMessageId } },
            }),
        };

        return this.socket?.sendMessage(jid, messageContent, messageOptions);
    }

    private async streamToBuffer(stream: Readable): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    private getMimetypeFromFilename(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        return MIME_TYPES[ext || ''] || 'application/octet-stream';
    }

    private async createFileMessage(
        buffer: Buffer,
        mimetype: string,
        options: {
            filename: string;
            caption?: string;
            ptt?: boolean;
            seconds?: number;
            gifPlayback?: boolean;
            jpegThumbnail?: Buffer | string;
        }
    ): Promise<AnyMessageContent> {
        const [type] = mimetype.split('/');

        switch (type) {
            case 'image':
                return {
                    image: buffer,
                    caption: options.caption,
                    mimetype,
                    fileName: options.filename,
                };

            case 'video':
                return {
                    video: buffer,
                    caption: options.caption,
                    mimetype,
                    fileName: options.filename,
                    gifPlayback: options.gifPlayback || false,
                    jpegThumbnail: options.jpegThumbnail as string,
                    ...(options.seconds && { seconds: options.seconds }),
                };

            case 'audio':
                if (options.ptt) {
                    // Voice note
                    return {
                        audio: buffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true,
                        ...(options.seconds && { seconds: options.seconds }),
                    };
                }

                return {
                    audio: buffer,
                    mimetype,
                    fileName: options.filename,
                    ...(options.seconds && { seconds: options.seconds }),
                };

            default:
                // Document (PDF, DOC, etc.)
                return {
                    document: buffer,
                    mimetype,
                    fileName: options.filename,
                    caption: options.caption,
                    jpegThumbnail: options.jpegThumbnail as string,
                };
        }
    }

    // Helper method to send specific file types
    protected async sendImage(
        to: string,
        imageBuffer: Buffer | Readable,
        options: {
            caption?: string;
            filename?: string;
            replyToMessageId?: string;
        } = {}
    ): Promise<any> {
        return this.sendFileFromStream(to, imageBuffer, {
            filename: options.filename || 'image.jpg',
            caption: options.caption,
            replyToMessageId: options.replyToMessageId,
        });
    }

    protected async sendVideo(
        to: string,
        videoBuffer: Buffer | Readable,
        options: {
            caption?: string;
            filename?: string;
            gifPlayback?: boolean;
            replyToMessageId?: string;
            jpegThumbnail?: Buffer;
        } = {}
    ): Promise<any> {
        return this.sendFileFromStream(to, videoBuffer, {
            filename: options.filename || 'video.mp4',
            caption: options.caption,
            gifPlayback: options.gifPlayback,
            replyToMessageId: options.replyToMessageId,
            jpegThumbnail: options.jpegThumbnail,
        });
    }

    protected async sendAudio(
        to: string,
        audioBuffer: Buffer | Readable,
        options: {
            filename?: string;
            ptt?: boolean; // Voice note
            seconds?: number;
            replyToMessageId?: string;
        } = {}
    ): Promise<any> {
        return this.sendFileFromStream(to, audioBuffer, {
            filename: options.filename || 'audio.mp3',
            mimetype: options.ptt ? 'audio/ogg; codecs=opus' : '',
            ptt: options.ptt,
            seconds: options.seconds,
            replyToMessageId: options.replyToMessageId,
        });
    }

    protected async sendDocument(
        to: string,
        documentBuffer: Buffer | Readable,
        options: {
            filename: string;
            caption?: string;
            mimetype?: string;
            replyToMessageId?: string;
            jpegThumbnail?: Buffer;
        }
    ): Promise<any> {
        return this.sendFileFromStream(to, documentBuffer, {
            filename: options.filename,
            mimetype: options.mimetype,
            caption: options.caption,
            replyToMessageId: options.replyToMessageId,
            jpegThumbnail: options.jpegThumbnail,
        });
    }

    protected async sendVoiceNote(
        to: string,
        audioBuffer: Buffer | Readable,
        options: {
            seconds?: number;
            replyToMessageId?: string;
        } = {}
    ): Promise<any> {
        return this.sendAudio(to, audioBuffer, {
            ptt: true,
            seconds: options.seconds,
            replyToMessageId: options.replyToMessageId,
        });
    }

    protected async sendSticker(
        to: string,
        stickerBuffer: Buffer | Readable,
        options: {
            replyToMessageId?: string;
        } = {}
    ): Promise<any> {
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateStream.formatPhoneNumberToWhatsappPattern(to);
        const buffer =
            stickerBuffer instanceof Buffer ? stickerBuffer : await this.streamToBuffer(stickerBuffer as Readable);

        const messageOptions: any = {
            ...(options.replyToMessageId && {
                quoted: { key: { id: options.replyToMessageId } },
            }),
        };

        return this.socket?.sendMessage(jid, { sticker: buffer }, messageOptions);
    }
}
