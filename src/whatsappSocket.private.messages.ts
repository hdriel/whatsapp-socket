import { generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import { WAProto as proto } from '@fadzzzslebew/baileys';
import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base';
export type { WhatsappSocketBaseProps as WhatsappSocketMessagesProps } from './whatsappSocket.base';
import { getTotalSeconds } from './helpers';
import type {
    ButtonURL,
    ButtonReminder,
    ButtonEmail,
    ButtonCopy,
    ButtonPhone,
    ButtonParamsJson,
    CallToActionButtons,
    CallToActionFullButtons,
} from './decs';

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
        if (!title || !buttons.length) {
            throw new Error('sendButtonsMessage: No title or buttons required field found.');
        }

        await this.ensureSocketConnected();

        const jid = WhatsappSocketPrivateMessages.formatPhoneNumberToWhatsappPattern(to);

        const buttonsValue = (buttons as CallToActionFullButtons)
            ?.map((btn) => {
                const buttonParamsJson: ButtonParamsJson = { display_text: btn.label };

                let name: string;
                switch (true) {
                    case !!(btn as ButtonURL).url:
                        name = 'cta_url';
                        buttonParamsJson.url = (btn as ButtonURL).url;
                        break;
                    case !!(btn as ButtonCopy).copy:
                        name = 'cta_copy';
                        buttonParamsJson.copy_code = (btn as ButtonCopy).copy;
                        break;
                    case !!(btn as ButtonPhone).tel:
                        name = 'cta_call';
                        buttonParamsJson.phone_number = (btn as ButtonPhone).tel;
                        break;
                    case !!(btn as ButtonEmail).email:
                        name = 'cta_email';
                        buttonParamsJson.email = (btn as ButtonEmail).email;
                        break;
                    case !!((btn as ButtonReminder).reminderOn || (btn as ButtonReminder).reminderDate):
                        name = 'cta_reminder';
                        const { reminderOn, reminderDate } = btn as ButtonReminder;
                        buttonParamsJson.reminder_name = (btn as ButtonReminder).reminderName;
                        buttonParamsJson.reminder_timestamp = reminderDate
                            ? Math.floor(+new Date(reminderDate) / 1000)
                            : Math.floor(Date.now() / 1000) + getTotalSeconds(reminderOn ?? '0s');
                        break;
                    default:
                        name = '';
                        break;
                }

                return { name, buttonParamsJson: JSON.stringify(buttonParamsJson) };
            })
            .filter((v) => v.name);

        const msg = generateWAMessageFromContent(
            jid,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            ...(title && {
                                body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                            }),
                            ...(subtitle && {
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: subtitle }),
                            }),
                            ...(!!buttonsValue?.length && {
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: buttonsValue,
                                }),
                            }),
                        }),
                    },
                },
            },
            { userJid: jid }
        );

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send buttons message', {
                jid,
                footer: subtitle,
                body: title,
                buttons: buttonsValue,
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
}
