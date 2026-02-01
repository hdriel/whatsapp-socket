import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';

export async function sendReplyMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    {
        title,
        subtitle,
        buttons,
        mentions: formattedMentionsPhones,
    }: {
        title: string;
        subtitle?: string;
        buttons: Array<string | { id: number | string; label: string }>;
        mentions?: string[];
    }
): Promise<any> {
    if (!title || !buttons.length) {
        throw new Error('sendReplyButtonsMessage: No title or buttons required field found.');
    }

    const buttonsValue = buttons
        .filter((v) => v)
        .map((btn, index) =>
            typeof btn === 'string'
                ? { buttonId: `id-${index}`, buttonText: { displayText: btn }, type: 1 }
                : { buttonId: `${btn.id}`, buttonText: { displayText: btn.label }, type: 1 }
        );

    const messageOptions: any = {
        text: title,
        buttons: buttonsValue /* type: UNKNOWN = 0, RESPONSE = 1, NATIVE_FLOW = 2 */,
        ...(subtitle && { footer: subtitle }),
    };

    if (formattedMentionsPhones?.length) {
        messageOptions.mentions = formattedMentionsPhones;
    }

    if (debug) {
        logger?.debug('WHATSAPP', 'send reply buttons message', {
            jid,
            text: title,
            footer: subtitle,
            buttons: buttonsValue,
        });
    }

    return socket?.sendMessage(jid, messageOptions);
}
