import { WhatsappSocketPrivateFiles } from './whatsappSocket.private.files.ts';
import type { WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.messages.ts';

export class WhatsappSocket extends WhatsappSocketPrivateFiles {
    /*
    private static instances: Map<string, WhatsappSocket> = new Map();

    static getInstance(props: WhatsappSocketBaseProps): WhatsappSocket {
        const instanceKey =
            props.appName ||
            props.pairingPhone ||
            props.mongoCollection ||
            props.fileAuthStateDirectoryPath ||
            'default';

        if (!WhatsappSocket.instances.has(instanceKey)) {
            new WhatsappSocket(props);
        }

        return WhatsappSocket.instances.get(instanceKey)!;
    }

    static clearInstance(key?: string): void {
        if (key) {
            WhatsappSocket.instances.delete(key);
        } else {
            WhatsappSocket.instances.clear();
        }
    }

    constructor(props: WhatsappSocketFilesProps) {
        const instanceKey =
            props.appName ||
            props.pairingPhone ||
            props.mongoCollection ||
            props.fileAuthStateDirectoryPath ||
            'default';

        if (WhatsappSocket.instances.has(instanceKey)) {
            const instance = WhatsappSocket.instances.get(instanceKey)!;
            // instance.logger?.debug('WHATSAPP', 'RETURN SINGLETON INSTANCE!');
            return instance;
        }

        super(props);

        WhatsappSocket.instances.set(instanceKey, this);
    }
     */

    constructor(props: WhatsappSocketGroupMessagesProps) {
        super(props);
    }
}
