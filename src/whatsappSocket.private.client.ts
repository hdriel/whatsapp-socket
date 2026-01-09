import { WhatsappSocketPrivateFiles } from './whatsappSocket.private.files';
import type { WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.messages';

export type WhatsappSocketProps = WhatsappSocketGroupMessagesProps;

export class WhatsappSocket extends WhatsappSocketPrivateFiles {
    constructor(props: WhatsappSocketProps) {
        super(props);
    }
}
