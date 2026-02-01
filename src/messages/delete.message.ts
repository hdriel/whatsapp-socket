import type { Logger } from 'stack-trace-logger';
import { type WASocket } from '@fadzzzslebew/baileys';

export const sendDeleteMessage = (
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    { messageId }: { messageId: string }
) => {
    if (!messageId) {
        throw new Error('sendDeleteMessage: No title or buttons required field found.');
    }

    if (debug) {
        logger?.debug('WHATSAPP', 'Deleting message', {
            jid,
            messageId,
        });
    }

    return socket?.sendMessage(jid, { delete: { id: messageId, remoteJid: jid, fromMe: true } });
};
