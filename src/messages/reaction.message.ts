import type { Logger } from 'stack-trace-logger';
import { type WASocket } from '@fadzzzslebew/baileys';

export const sendReactionMessage = (
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    { messageId, emoji }: { messageId: string; emoji: string }
) => {
    if (!jid || !messageId || !emoji) {
        throw new Error('sendReactionMessage: message ID, and emoji are required.');
    }

    if (debug) {
        logger?.debug('WHATSAPP', 'Sending reaction to group message', {
            jid,
            messageId,
            emoji,
        });
    }

    return socket?.sendMessage(jid, {
        react: {
            text: emoji,
            key: { id: messageId, remoteJid: jid },
        },
    });
};
