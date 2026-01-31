import { generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import type { Logger } from 'stack-trace-logger';
import { WAProto as proto, type WASocket } from '@fadzzzslebew/baileys';
import type {
    ButtonCopy,
    ButtonEmail,
    ButtonParamsJson,
    ButtonPhone,
    ButtonReminder,
    ButtonURL,
    CallToActionButtons,
    CallToActionFullButtons,
} from '../decs.ts';
import { getTotalSeconds } from '../helpers.ts';

export const sendButtonsMessage = (
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    {
        subtitle,
        title,
        buttons,
    }: {
        title: string;
        subtitle?: string;
        buttons: CallToActionButtons;
    }
) => {
    if (!title || !buttons.length) {
        throw new Error('sendButtonsMessage: No title or buttons required field found.');
    }

    const buttonsValue = (buttons as CallToActionFullButtons)
        ?.map((btn) => {
            const buttonParamsJson: ButtonParamsJson = { display_text: btn.label };

            let name: string;
            switch (true) {
                case !!(btn as ButtonURL).url:
                    name = 'cta_url';
                    buttonParamsJson.url = (btn as ButtonURL).url;
                    buttonParamsJson.url = buttonParamsJson.url.startsWith('http')
                        ? buttonParamsJson.url
                        : `https://${buttonParamsJson.url}`;
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

    if (debug) {
        logger?.debug('WHATSAPP', 'send buttons message', {
            jid,
            footer: subtitle,
            body: title,
            buttons: buttonsValue,
        });
    }

    return socket?.relayMessage(jid, msg.message!, { messageId: msg.key.id! });
};
