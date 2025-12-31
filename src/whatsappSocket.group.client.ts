import { WhatsappSocketGroupMessages, type WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.messages';

export class WhatsappSocketGroup extends WhatsappSocketGroupMessages {
    /*
    private static instances: Map<string, WhatsappSocketGroup> = new Map();

    static getInstance(props: WhatsappSocketBaseProps): WhatsappSocketGroup {
        const instanceKey = WhatsappSocketGroup.buildSocketKey(props);
        if (!WhatsappSocketGroup.instances.has(instanceKey)) {
            new WhatsappSocketGroup(props);
        }

        return WhatsappSocketGroup.instances.get(instanceKey)!;
    }

    static clearInstance(key?: string): void {
        if (key) {
            WhatsappSocketGroup.instances.delete(key);
        } else {
            WhatsappSocketGroup.instances.clear();
        }
    }

    constructor(props: WhatsappSocketGroupMessagesProps) {
        const instanceKey = WhatsappSocketGroup.buildSocketKey(props);
        if (WhatsappSocketGroup.instances.has(instanceKey)) {
            const instance = WhatsappSocketGroup.instances.get(instanceKey)!;
            // instance.logger?.debug('WHATSAPP', 'RETURN SINGLETON INSTANCE!');
            return instance;
        }

        super(props);

        WhatsappSocketGroup.instances.set(instanceKey, this);
    }
    */

    constructor(props: WhatsappSocketGroupMessagesProps) {
        super(props);
    }
}
