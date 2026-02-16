import Stream from 'node:stream';
import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base';
export type { WhatsappSocketBaseProps as WhatsappSocketMessagesProps } from './whatsappSocket.base';
import type { CallToActionButtons } from './decs';
import {
    sendButtonsMessage,
    sendMenuMessage,
    sendReplyMessage,
    sendLocationMessage,
    sendSurveyMessage,
    sendTextMessage,
    sendReactionMessage,
    sendAudioMessage,
    sendStickerMessage,
    sendFileMessage,
    sendVideoMessage,
    sendImageMessage,
} from './messages';
import { clearTimeout } from 'node:timers';
import type { Message } from './bot.schema.ts';

type MessageType = 'text' | 'reply' | 'menu' | 'buttons' | 'image' | 'video' | 'audio' | 'location';

export class WhatsappSocketPrivateMessages extends WhatsappSocketBase {
    protected timers: Record<
        string,
        Record<number, { timeoutId: number; date: Date; data: Message; messageType: MessageType }>
    > = {};

    constructor(props: WhatsappSocketBaseProps) {
        super(props);
    }

    protected async sendMessageByType(remoteJid: string | null, messageType: MessageType, message: any) {
        switch (messageType) {
            case 'text':
                await this.sendTextMessage(remoteJid, message);
                break;
            case 'reply':
                await this.sendReplyButtonsMessage(remoteJid, message);
                break;
            case 'menu':
                await this.sendMenuMessage(remoteJid, message);
                break;
            case 'buttons':
                await this.sendButtonsMessage(remoteJid, message);
                break;
            case 'image':
                await this.sendImageMessage(remoteJid, message);
                break;
            case 'video':
                await this.sendVideoMessage(remoteJid, message);
                break;
            case 'audio':
                await this.sendAudioMessage(remoteJid, message);
                break;
            case 'location':
                await this.sendLocationMessage(remoteJid, message);
                break;
        }
    }

    public async setTimer(
        remoteJid: string,
        messageType: MessageType,
        message: any,
        timeout: number,
        autoSelfNotificationFormat: string | null = [
            '✅ ההודעה תישלח ב-{date}',
            'אל המספר: {phone}',
            'מזהה הבקשה: {timerId}',
        ].join('\n')
    ) {
        const timerId = setTimeout(() => this.sendMessageByType(remoteJid, messageType, message), timeout);

        this.timers[remoteJid] ||= {};
        this.timers[remoteJid][+timerId] = {
            timeoutId: timeout,
            date: new Date(new Date().getTime() + timeout),
            data: message,
            messageType,
        };

        if (autoSelfNotificationFormat) {
            await this.sendTextMessage(
                null,
                autoSelfNotificationFormat
                    .replace('{date}', this.timers[remoteJid][+timerId].date.toLocaleString('he-IL'))
                    .replace('{timerId}', `${+timerId}`)
                    .replace('{phone}', remoteJid.split('@')[0])
            );
        }

        return timerId;
    }

    public getTimers(remoteJid: string) {
        return Object.entries(this.timers[remoteJid] ?? {}).map(([key, message]) => {
            return { code: key, message }; // todo: defined the message format to display
        });
    }

    public removeTimerId(remoteJid: string, timerId: number) {
        clearTimeout(timerId);
        delete this.timers[remoteJid][timerId];
    }

    public resetTimers(remoteJid?: string) {
        if (remoteJid) {
            Object.keys(this.timers[remoteJid] ?? {}).forEach(clearTimeout);
            delete this.timers[remoteJid];
            return;
        }

        Object.keys(this.timers).forEach((remoteJid) => Object.keys(this.timers[remoteJid]).forEach(clearTimeout));
        this.timers = {};
    }

    /**
     * Delete a sent message
     * @param messageId - The message ID to delete
     * @param chatJid - The recipient's phone number
     * @returns Promise with the result
     */
    async deleteMessageById(messageId: string, chatJid: string): Promise<any> {
        return this.deleteMessage(messageId, chatJid, true);
    }

    async sendTextMessage(to: string | null, text: string): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendTextMessage(baseProps, jid, { text });
    }

    async sendButtonsMessage(
        to: string | null,
        { subtitle, title, buttons }: { title: string; subtitle?: string; buttons: CallToActionButtons }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendButtonsMessage(baseProps, jid, { subtitle, title, buttons });
    }

    async sendMenuMessage(
        to: string | null,
        {
            title,
            subtitle,
            buttonText,
            sections,
        }: {
            title: string;
            subtitle?: string;
            buttonText: string;
            sections: Array<{
                title: string;
                rows: Array<{ id: string; title: string; description?: string }>;
            }>;
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendMenuMessage(baseProps, jid, { subtitle, title, sections, buttonText });
    }

    async sendReplyButtonsMessage(
        to: string | null,
        {
            title,
            subtitle,
            buttons,
        }: {
            title: string;
            subtitle?: string;
            buttons: Array<string | { id: number | string; label: string }>;
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendReplyMessage(baseProps, jid, { subtitle, title, buttons });
    }

    async sendLocationMessage(
        to: string | null,
        {
            latitude,
            longitude,
            name,
            address,
        }: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendLocationMessage(baseProps, jid, { latitude, longitude, name, address });
    }

    async sendSurveyMessage(
        to: string | null,
        {
            question,
            options,
            allowMultipleAnswers = false,
        }: { question: string; options: string[]; allowMultipleAnswers?: boolean }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendSurveyMessage(baseProps, jid, { options, question, allowMultipleAnswers });
    }

    async sendReactionMessage(to: string | null, messageId: string, emoji: string): Promise<any> {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendReactionMessage(baseProps, jid, { messageId, emoji });
    }

    async sendImageMessage(
        to: string | null,
        imageSrc: string | Buffer<any> | Stream,
        { caption = '', filename }: { caption?: string; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendImageMessage(baseProps, jid, imageSrc, { caption, filename });
    }

    async sendVideoMessage(
        to: string | null,
        videoSrc: string | Buffer<any> | Stream,
        {
            caption = '',
            filename,
            sendAsGifPlayback = false,
        }: { caption?: string; sendAsGifPlayback?: boolean; filename?: string } = {}
    ) {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendVideoMessage(baseProps, jid, videoSrc, { caption, filename, sendAsGifPlayback });
    }

    async sendAudioMessage(
        to: string | null,
        audioSrc: string | Buffer<any> | Stream,
        {
            filename,
            replyToMessageId,
            mimetype,
            seconds,
        }: { filename?: string; replyToMessageId?: string; mimetype?: string; seconds?: number } = {}
    ) {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
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
    async sendStickerMessage(to: string | null, imageSrc: string | Buffer<any> | Stream) {
        await this.ensureSocketConnected();
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendStickerMessage(baseProps, jid, imageSrc);
    }

    async sendFileMessage(
        to: string | null,
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
        const jid = (
            to ? WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to) : this.myJID()
        ) as string;
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
