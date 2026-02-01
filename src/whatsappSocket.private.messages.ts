import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base';
export type { WhatsappSocketBaseProps as WhatsappSocketMessagesProps } from './whatsappSocket.base';
import type { CallToActionButtons } from './decs';
import {
    sendButtonsMessage,
    sendListMessage,
    sendReplyMessage,
    sendLocationMessage,
    sendSurveyMessage,
    sendTextMessage,
} from './messages';

export class WhatsappSocketPrivateMessages extends WhatsappSocketBase {
    constructor(props: WhatsappSocketBaseProps) {
        super(props);
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

    async sendTextMessage(to: string, text: string): Promise<any> {
        await this.ensureSocketConnected();
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendTextMessage(baseProps, jid, { text });
    }

    async sendButtonsMessage(
        to: string,
        { subtitle, title, buttons }: { title: string; subtitle?: string; buttons: CallToActionButtons }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendButtonsMessage(baseProps, jid, { subtitle, title, buttons });
    }

    async sendListMessage(
        to: string,
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
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendListMessage(baseProps, jid, { subtitle, title, sections, buttonText });
    }

    async sendReplyButtonsMessage(
        to: string,
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
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendReplyMessage(baseProps, jid, { subtitle, title, buttons });
    }

    async sendLocationMessage(
        to: string,
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
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendLocationMessage(baseProps, jid, { latitude, longitude, name, address });
    }

    async sendSurveyMessage(
        to: string,
        {
            question,
            options,
            allowMultipleAnswers = false,
        }: { question: string; options: string[]; allowMultipleAnswers?: boolean }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendSurveyMessage(baseProps, jid, { options, question, allowMultipleAnswers });
    }
}
