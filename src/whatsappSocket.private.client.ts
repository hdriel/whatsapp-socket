import { WhatsappSocketPrivateMessages, type WhatsappSocketMessagesProps } from './whatsappSocket.private.messages';

export type WhatsappSocketProps = WhatsappSocketMessagesProps;

export class WhatsappSocket extends WhatsappSocketPrivateMessages {
    constructor(props: WhatsappSocketProps) {
        super(props);
    }
}
