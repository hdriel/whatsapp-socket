import { WhatsappSocketPrivateMessages, type WhatsappSocketMessagesProps } from './whatsappSocket.private.messages';
import type { MessageReceivedCB } from './decs.ts';

export type WhatsappSocketProps = WhatsappSocketMessagesProps;

export class WhatsappSocket extends WhatsappSocketPrivateMessages {
    constructor(props: WhatsappSocketProps) {
        super(props);
    }

    onAnyMessageReceived(cb: MessageReceivedCB) {
        this.messageReceivedCBs.from_any_phones ||= [];
        this.messageReceivedCBs.from_any_phones.push(cb);
    }

    offAnyMessageReceived(cb: MessageReceivedCB) {
        this.messageReceivedCBs.from_any_phones = (this.messageReceivedCBs.from_any_phones ?? []).filter(
            (c) => c !== cb
        );
    }

    onPhoneMessageReceived(phone: string, cb: MessageReceivedCB) {
        const jid = WhatsappSocket.formatPhoneNumberToWhatsappPattern(phone);
        this.messageReceivedCBs[jid] ||= [];
        this.messageReceivedCBs[jid].push(cb);
    }

    offPhoneMessageReceived(phone: string, cb?: MessageReceivedCB) {
        const jid = WhatsappSocket.formatPhoneNumberToWhatsappPattern(phone);
        this.messageReceivedCBs[jid] = cb ? (this.messageReceivedCBs[jid] ?? []).filter((c) => c !== cb) : [];
    }
}
