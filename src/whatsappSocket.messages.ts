import { type MiscMessageGenerationOptions, generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import { WAProto as proto } from '@fadzzzslebew/baileys';
import { WhatsappSocketBase, type WhatsappSocketBaseProps } from './whatsappSocket.base.ts';
export type { WhatsappSocketBaseProps as WhatsappSocketMessagesProps } from './whatsappSocket.base.ts';

type ButtonURL = { label: string; url: string };
type ButtonCopy = { label: string; copy: string };
type ButtonPhone = { label: string; tel: string };

export class WhatsappSocketMessages extends WhatsappSocketBase {
    static DEFAULT_COUNTRY_CODE: string = '972';

    constructor(props: WhatsappSocketBaseProps) {
        super(props);
    }

    async sendTextMessage(to: string, text: string, replayToMessageId?: string): Promise<any> {
        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketMessages.formatPhoneNumberToWhatsappPattern(to);
        const options: MiscMessageGenerationOptions = {
            ...(replayToMessageId && { quoted: { key: { id: replayToMessageId } } }),
        };

        return this.socket.sendMessage(jid, { text }, options);
    }

    async sendButtonsMessage(
        to: string,
        {
            subtitle,
            title,
            buttons,
        }: {
            title: string;
            subtitle?: string;
            buttons: Array<ButtonURL | ButtonCopy | ButtonPhone>;
        }
    ): Promise<any> {
        if (!title || !buttons.length) {
            throw new Error('sendButtonsMessage: No title or buttons required field found.');
        }

        if (!this.socket) {
            if (this.debug) this.logger?.warn('WHATSAPP', 'Client not connected, attempting to connect...');
            this.socket = await this.startConnection();
        }

        const jid = WhatsappSocketMessages.formatPhoneNumberToWhatsappPattern(to);

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
                            ...(!!buttons?.length && {
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: buttons
                                        .map((btn) => {
                                            const buttonParamsJson = {
                                                display_text: btn.label,
                                                ...((btn as ButtonURL).url && { url: (btn as ButtonURL).url }),
                                                ...((btn as ButtonCopy).copy && {
                                                    copy_code: (btn as ButtonCopy).copy,
                                                }),
                                                ...((btn as ButtonPhone).tel && {
                                                    phone_number: (btn as ButtonPhone).tel,
                                                }),
                                            };

                                            let name: string;
                                            switch (true) {
                                                case !!buttonParamsJson.url:
                                                    name = 'cta_url';
                                                    break;
                                                case !!buttonParamsJson.copy_code:
                                                    name = 'cta_copy';
                                                    break;
                                                case !!buttonParamsJson.phone_number:
                                                    name = 'cta_call';
                                                    break;
                                                default:
                                                    name = '';
                                                    break;
                                            }

                                            return { name, buttonParamsJson: JSON.stringify(buttonParamsJson) };
                                        })
                                        .filter((v) => v.name),
                                }),
                            }),
                        }),
                    },
                },
            },
            { userJid: jid }
        );

        return this.socket.relayMessage(jid, msg.message!, {
            messageId: msg.key.id!,
        });
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
