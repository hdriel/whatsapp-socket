import { WhatsappSocket } from './whatsappSocket.private.client';
import type { BotSchema, Scenario, ScenarioResponse } from './bot.schema';
export type { BotSchema } from './bot.schema';

export class WhatsappSocketBot {
    protected schema: BotSchema;
    protected phone?: string;
    protected client?: WhatsappSocket;
    private schemaRefs: Record<string, any> = {};
    private remoteFlow: Record<string, any> = {};

    constructor(schema: BotSchema, phone?: string) {
        this.phone = phone && WhatsappSocket.formatPhoneNumberToWhatsappPattern(phone);
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

    private async sendMessageList(remoteJid: string, messageList?: any[]) {
        if (!messageList?.length) return;

        for (const message of messageList) {
            const [key, value]: any = Object.entries(message)[0];
            switch (key) {
                case 'text':
                    await this.client?.sendTextMessage(remoteJid, value);
                    break;
                case 'reply':
                    await this.client?.sendReplyButtonsMessage(remoteJid, value);
                    break;
                case 'menu':
                    await this.client?.sendMenuMessage(remoteJid, value);
                    break;
                case 'buttons':
                    await this.client?.sendButtonsMessage(remoteJid, value);
                    break;
                case 'image':
                    await this.client?.sendImageMessage(remoteJid, value);
                    break;
                case 'video':
                    await this.client?.sendVideoMessage(remoteJid, value);
                    break;
                case 'audio':
                    await this.client?.sendAudioMessage(remoteJid, value);
                    break;
                case 'location':
                    await this.client?.sendLocationMessage(remoteJid, value);
                    break;

                default:
                    await this.client?.sendTextMessage(remoteJid, 'Done');
                    return;
            }
        }
    }

    private getFlow(remoteJid: string) {
        return this.remoteFlow[remoteJid];
    }

    private setFlow(remoteJid: string, flow: any) {
        this.remoteFlow[remoteJid] = flow;
    }

    private getResponseId(response: any) {
        const key = Object.keys(response.data)[0];
        switch (key) {
            case 'buttonsResponse':
                return response.data.buttonsResponse.id;
            default:
                return '';
        }
    }

    onMessageReceived() {
        const cb = async (remoteJid: string, messageId: string, options: any) => {
            const flow = this.getFlow(remoteJid);
            const msgText = options?.text ?? (typeof options === 'string' ? options : '');

            if (!flow) {
                if (
                    this.schema.matches?.length &&
                    !this.schema.matches.every((match) =>
                        typeof match === 'string' ? match === msgText : match.test(msgText)
                    )
                ) {
                    return;
                }

                await this.sendMessageList(remoteJid, this.schema.flow?.messages);
                this.setFlow(remoteJid, this.schema.flow?.response);
                return;
            }

            const key = this.getResponseId(options);
            const { next, validationError, validate, onSubmit }: ScenarioResponse = flow[key] || this.schema.flow;

            const text = options?.text ?? (typeof options === 'string' ? options : key);
            if (!validate || validate?.(text)) {
                await onSubmit?.(messageId, options);
            } else {
                const errMsg = typeof validationError === 'function' ? validationError(text) : validationError;
                await this.client?.sendTextMessage(remoteJid, errMsg || 'invalid input!');
            }

            await this.sendMessageList(remoteJid, next?.messages);
            if (next?.response) this.setFlow(remoteJid, next.response);
            else if (!next?.messages) this.setFlow(remoteJid, null);
        };

        if (this.phone) this.client?.onPhoneMessageReceived(this.phone, cb);
        else this.client?.onAnyMessageReceived(cb);
    }
}
