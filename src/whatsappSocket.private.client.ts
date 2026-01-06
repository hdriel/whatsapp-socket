import { WhatsappSocketPrivateFiles } from './whatsappSocket.private.files';
import type { WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.messages';

export class WhatsappSocket extends WhatsappSocketPrivateFiles {
    constructor(props: WhatsappSocketGroupMessagesProps) {
        super(props);
    }
}
