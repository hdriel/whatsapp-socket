import { WhatsappSocketGroupMessages, type WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.messages';
import type { MessageReceivedCB } from './decs.ts';

export type WhatsappSocketGroupProps = WhatsappSocketGroupMessagesProps;

export class WhatsappSocketGroup extends WhatsappSocketGroupMessages {
    constructor(props: WhatsappSocketGroupProps) {
        super(props);
    }

    onAnyGroupMessageReceived(cb: MessageReceivedCB) {
        this.messageReceivedCBs.from_any_groups ||= [];
        this.messageReceivedCBs.from_any_groups.push(cb);
    }

    offAnyGroupMessageReceived(cb: MessageReceivedCB) {
        this.messageReceivedCBs.from_any_groups = (this.messageReceivedCBs.from_any_groups ?? []).filter(
            (c) => c !== cb
        );
    }

    onGroupMessageReceived(groupId: string, cb: MessageReceivedCB) {
        const jid = WhatsappSocketGroup.formatGroupId(groupId);
        this.messageReceivedCBs[jid] ||= [];
        this.messageReceivedCBs[jid].push(cb);
    }

    offGroupMessageReceived(groupId: string, cb: MessageReceivedCB) {
        const jid = WhatsappSocketGroup.formatGroupId(groupId);
        this.messageReceivedCBs[jid] = this.messageReceivedCBs[jid].filter((c) => c !== cb);
    }
}
