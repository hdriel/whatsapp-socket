import { generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import { WAProto as proto } from '@fadzzzslebew/baileys';
import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base';
export type { WhatsappSocketBaseProps as WhatsappSocketMessagesProps } from './whatsappSocket.base';
import type { CallToActionButtons } from './decs';
import { sendButtonsMessage } from './messages';

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
        // let options: MiscMessageGenerationOptions = {};
        // if (replyToMessageId) {
        //     // @ts-ignore
        //     const message = await this.loadRecentMessages(jid, replyToMessageId);
        //     // We need the full message object to quote it properly
        //     // Option 1: If you have the message stored, use it directly
        //     // Option 2: Create a minimal quoted message structure
        //     options.quoted = {
        //         key: { remoteJid: jid, id: replyToMessageId },
        //         message: { conversation: "" }, // Placeholder - ideally you'd have the actual message
        //     } as any;
        // }

        return this.socket?.sendMessage(jid, { text });
    }

    async sendButtonsMessage(
        to: string,
        { subtitle, title, buttons }: { title: string; subtitle?: string; buttons: CallToActionButtons }
    ): Promise<any> {
        if (!to || !title || !buttons.length) {
            throw new Error('sendButtonsMessage: Phone, title, and buttons are required.');
        }

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
                rows: Array<{
                    id: string;
                    title: string;
                    description?: string;
                }>;
            }>;
        }
    ): Promise<any> {
        if (!title || !buttonText || !sections || sections.length === 0) {
            throw new Error('sendListMessage: title, buttonText, and sections are required.');
        }

        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);

        const msg = generateWAMessageFromContent(
            jid,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                            ...(subtitle && {
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: subtitle }),
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: buttonText,
                                hasMediaAttachment: false,
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: 'single_select',
                                        buttonParamsJson: JSON.stringify({
                                            title: buttonText,
                                            sections: sections.map((section) => ({
                                                title: section.title,
                                                rows: section.rows.map((row) => ({
                                                    header: row.title,
                                                    title: row.title,
                                                    description: row.description || '',
                                                    id: row.id,
                                                })),
                                            })),
                                        }),
                                    },
                                ],
                            }),
                        }),
                    },
                },
            },
            { userJid: jid }
        );

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send list message', {
                jid,
                title,
                buttonText,
                sectionsCount: sections.length,
                totalRows: sections.reduce((acc, s) => acc + s.rows.length, 0),
            });
        }

        return this.socket?.relayMessage(jid, msg.message!, { messageId: msg.key.id! });
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
        if (!title || !buttons.length) {
            throw new Error('sendReplyButtonsMessage: No title or buttons required field found.');
        }
        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);

        const buttonsValue = buttons
            .filter((v) => v)
            .map((btn, index) =>
                typeof btn === 'string'
                    ? { buttonId: `id-${index}`, buttonText: { displayText: btn }, type: 1 }
                    : { buttonId: `${btn.id}`, buttonText: { displayText: btn.label }, type: 1 }
            );

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send reply buttons message', {
                jid,
                text: title,
                footer: subtitle,
                buttons: buttonsValue,
            });
        }

        return this.socket?.sendMessage(jid, {
            text: title,
            ...(subtitle && { footer: subtitle }),
            buttons: buttonsValue /* type: UNKNOWN = 0, RESPONSE = 1, NATIVE_FLOW = 2 */,
        });
    }

    async sendLocation(
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
        if (latitude === undefined || longitude === undefined) {
            throw new Error('sendLocation: latitude and longitude are required fields.');
        }

        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90) {
            throw new Error('sendLocation: latitude must be between -90 and 90.');
        }
        if (longitude < -180 || longitude > 180) {
            throw new Error('sendLocation: longitude must be between -180 and 180.');
        }

        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send location message', {
                jid,
                latitude,
                longitude,
                name,
                address,
            });
        }

        return this.socket?.sendMessage(jid, {
            location: {
                degreesLatitude: latitude,
                degreesLongitude: longitude,
                ...(name && { name }),
                ...(address && { address }),
            },
        });
    }

    async sendLocationMessage(
        to: string,
        position: { latitude: number; longitude: number },
        name?: string,
        address?: string
    ): Promise<any> {
        const { longitude, latitude } = position;
        if (!to || latitude === undefined || longitude === undefined) {
            throw new Error('sendLocation: phoneTo, latitude, and longitude are required.');
        }

        await this.ensureSocketConnected();
        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending location', { jid, ...position });
        }

        return this.socket?.sendMessage(jid, {
            location: {
                degreesLatitude: latitude,
                degreesLongitude: longitude,
                ...(name && { name }),
                ...(address && { address }),
            },
        });
    }

    async sendSurveyMessage(
        to: string,
        question: string,
        options: string[],
        allowMultipleAnswers = false
    ): Promise<any> {
        if (!question || !options || options.length < 2) {
            throw new Error('sendSurveyMessage: question and at least 2 options are required.');
        }

        if (options.length > 12) {
            throw new Error('sendSurveyMessage: maximum 12 options allowed.');
        }

        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);
        const pollOptions = options;

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send survey message', {
                jid,
                question,
                options: pollOptions,
                allowMultipleAnswers,
            });
        }

        return this.socket?.sendMessage(jid, {
            poll: {
                name: question,
                values: pollOptions,
                selectableCount: allowMultipleAnswers ? options.length : 1,
            },
        });
    }
}
