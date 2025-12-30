import { WhatsappSocketPrivateFiles, type WhatsappSocketFilesProps } from './whatsappSocket.private.files.ts';

export class WhatsappSocket extends WhatsappSocketPrivateFiles {
    constructor(props: WhatsappSocketFilesProps) {
        super(props);
    }
}
