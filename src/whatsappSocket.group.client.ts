import { WhatsappSocketGroupMessages, type WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.messages';

export type WhatsappSocketGroupProps = WhatsappSocketGroupMessagesProps;

export class WhatsappSocketGroup extends WhatsappSocketGroupMessages {
    constructor(props: WhatsappSocketGroupProps) {
        super(props);
    }
}
