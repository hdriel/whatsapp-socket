import type { Logger } from 'stack-trace-logger';
import { type WASocket } from '@fadzzzslebew/baileys';
import type { TextMessageProps } from './messages.decs.ts';

export const sendTextMessage = (
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    { text, mentions }: TextMessageProps & { mentions?: string[] }
) => {
    if (!text) {
        throw new Error('sendTextMessage: No title or buttons required field found.');
    }

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

    if (debug) {
        logger?.debug('WHATSAPP', 'send text message', { jid, text });
    }

    return socket?.sendMessage(jid, { text, ...(mentions?.length && { mentions }) });
};
