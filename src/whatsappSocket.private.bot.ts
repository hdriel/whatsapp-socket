import { WhatsappSocket } from './whatsappSocket.private.client';
import type { BotSchema, Scenario } from './bot.schema';
export type { BotSchema } from './bot.schema';

export class WhatsappSocketBot {
    protected schema: BotSchema;
    protected phone: string;
    protected client?: WhatsappSocket;
    private schemaRefs: Record<string, any> = {};
    private remoteFlow: Record<string, any> = {};

    constructor(phone: string, schema: BotSchema) {
        this.phone = phone;
        this.schema = schema;
        this.updateSchemaRefs(this.schema.flow);
    }

    updateSchemaRefs(flow: undefined | Scenario) {
        if (!flow) return;

        Object.keys(flow.response ?? {}).forEach((id: string) => {
            this.schemaRefs[id] = flow.response?.[id];
        });
    }

    set socket(socket: WhatsappSocket) {
        this.client = socket;
        this.onMessageReceived();
    }

    onMessageReceived() {
        this.client?.onPhoneMessageReceived(this.phone, async (remoteJid, messageId, options) => {
            const flow = this.remoteFlow[remoteJid];
            // @ts-ignore
            const _fields = this.remoteFlow[remoteJid];
            if (!flow) return;

            const { next, validate, onSubmit } = flow;
            if (!validate || validate?.(messageId, options)) {
                await onSubmit?.(messageId, options);
            }

            for (const message of next) {
                const [key, value]: any = Object.entries(message)[0];
                switch (key) {
                    case 'text':
                        this.client?.sendTextMessage(remoteJid, value);
                        break;
                    case 'reply':
                        this.client?.sendReplyButtonsMessage(remoteJid, value);
                        break;
                    case 'menu':
                        this.client?.sendMenuMessage(remoteJid, value);
                        break;
                    case 'buttons':
                        this.client?.sendButtonsMessage(remoteJid, value);
                        break;
                    case 'image':
                        this.client?.sendImageMessage(remoteJid, value);
                        break;
                    case 'video':
                        this.client?.sendVideoMessage(remoteJid, value);
                        break;
                    case 'audio':
                        this.client?.sendAudioMessage(remoteJid, value);
                        break;

                    default:
                        this.client?.sendTextMessage(remoteJid, 'Done');
                        return;
                }
            }
        });
    }
}
