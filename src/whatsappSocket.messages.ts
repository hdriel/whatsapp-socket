import { type MiscMessageGenerationOptions, generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import { WAProto as proto } from '@fadzzzslebew/baileys';
import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base.ts';
export type { WhatsappSocketBaseProps as WhatsappSocketMessagesProps } from './whatsappSocket.base.ts';
import { type StringValue } from 'ms';
import { getTotalSeconds } from './helpers.ts';

type ButtonURL = { label: string; url: string };
type ButtonCopy = { label: string; copy: string };
type ButtonPhone = { label: string; tel: string };
type ButtonEmail = { label: string; email: string };
type ButtonReminder = { label: string; reminderName: string } & (
    | { reminderOn?: StringValue; reminderDate: number }
    | { reminderOn: StringValue; reminderDate?: number | Date | string }
);

type ButtonParamsJson = {
    display_text: string;
    url?: string;
    copy_code?: string;
    phone_number?: string;
    email?: string;
    reminder_name?: string;
    reminder_timestamp?: number;
};

type CallToActionButtons = Array<
    ButtonURL | ButtonCopy | ButtonPhone
    // ButtonEmail | ButtonReminder // not supported
>;

type CallToActionFullButtons = Array<ButtonURL | ButtonCopy | ButtonPhone | ButtonEmail | ButtonReminder>;

export class WhatsappSocketMessages extends WhatsappSocketBase {
    static DEFAULT_COUNTRY_CODE: string = '972';

    constructor(props: WhatsappSocketBaseProps) {
        super(props);
    }

    async sendTextMessage(to: string, text: string, replyToMessageId?: string): Promise<any> {
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketMessages.formatPhoneNumberToWhatsappPattern(to);
        const options: MiscMessageGenerationOptions = {
            ...(replyToMessageId && { quoted: { key: { id: replyToMessageId } } }),
        };

        return this.socket.sendMessage(jid, { text }, options);
    }

    async sendButtonsMessage(
        to: string,
        { subtitle, title, buttons }: { title: string; subtitle?: string; buttons: CallToActionButtons }
    ): Promise<any> {
        if (!title || !buttons.length) {
            throw new Error('sendButtonsMessage: No title or buttons required field found.');
        }

        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketMessages.formatPhoneNumberToWhatsappPattern(to);

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

        return this.socket.relayMessage(jid, msg.message!, { messageId: msg.key.id! });
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
            buttons: string[];
        }
    ): Promise<any> {
        if (!title || !buttons.length) {
            throw new Error('sendReplyButtonsMessage: No title or buttons required field found.');
        }

        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketMessages.formatPhoneNumberToWhatsappPattern(to);

        return this.socket.sendMessage(jid, {
            text: title,
            ...(subtitle && { footer: subtitle }),
            buttons: buttons
                .filter((v) => v)
                .map((displayText, index) => ({ buttonId: `id${index}`, buttonText: { displayText }, type: 1 })),
            /* type: UNKNOWN = 0, RESPONSE = 1, NATIVE_FLOW = 2 */
        });
    }
}
