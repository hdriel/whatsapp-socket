import { WhatsappSocket } from './whatsappSocket.private.client';
import type { BotSchema, Message, MessageCB, MessageItem, Scenario, ScenarioResponse } from './bot.schema';
import { getMS } from './helpers.ts';
import { clearTimeout, setTimeout } from 'node:timers';
export type { BotSchema } from './bot.schema';

export class WhatsappSocketBot {
    protected schema: BotSchema;
    protected phone?: string;
    protected client?: WhatsappSocket;
    private schemaRefs: Record<string, any> = {};
    private remoteFlow: Record<string, any> = {};
    private dataFlow: Record<string, any> = {};
    private timeoutFlow: Record<string, string> = {};
    private timers: Record<string, Record<number, { timeoutId: number; date: Date; data: Message }>> = {};

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

    private async sendMessageList(remoteJid: string, messages?: MessageItem | MessageItem[] | undefined) {
        const messageList: Message[] = ([] as Message[]).concat(messages as Message).filter((v) => v);
        if (!messageList?.length) return;

        for (let message of messageList) {
            if (typeof message === 'function') {
                message = await (<MessageCB>message)(remoteJid, this.dataFlow[remoteJid]);
            }
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

    private resetFlow(remoteJid: string) {
        delete this.remoteFlow[remoteJid];
    }

    private getDataFlow(remoteJid: string) {
        return this.dataFlow[remoteJid];
    }

    private setDataFlow(remoteJid: string, field: string, data: any) {
        this.dataFlow[remoteJid] ||= { ...this.dataFlow[remoteJid], [field]: data };
    }

    private resetDataFlow(remoteJid: string) {
        delete this.dataFlow[remoteJid];
    }

    public setTimer(remoteJid: string, to: string, message: Message, timeout: number) {
        const timerId = setTimeout(() => this.sendMessageList(to, message), timeout);

        this.timers[remoteJid][+timerId] = {
            timeoutId: timeout,
            date: new Date(new Date().getTime() + timeout),
            data: message,
        };
    }

    public getTimers(remoteJid: string) {
        return Object.entries(this.timers[remoteJid] ?? {}).map(([key, message]) => {
            return { code: key, message }; // todo: defined the message format to display
        });
    }

    public removeTimerId(remoteJid: string, timerId: number) {
        clearTimeout(timerId);
        delete this.timers[remoteJid][timerId];
    }

    private setTimeoutFlow(remoteJid: string, timeoutId: any) {
        const oldTimeoutId = this.timeoutFlow[remoteJid];
        if (oldTimeoutId) clearTimeout(oldTimeoutId);
        this.timeoutFlow[remoteJid] = timeoutId;
    }

    private resetTimeoutFlow(remoteJid: string) {
        const oldTimeoutId = this.timeoutFlow[remoteJid];
        if (oldTimeoutId) clearTimeout(oldTimeoutId);
        delete this.timeoutFlow[remoteJid];
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

    private async onMessageReceivedCB(remoteJid: string, messageId: string, options: any) {
        const cleanupRemoteJid = async (sendExitMsg = true) => {
            sendExitMsg && (await this.sendMessageList(remoteJid, this.schema.exitMsg));
            this.resetDataFlow(remoteJid);
            this.resetFlow(remoteJid);
            this.resetTimeoutFlow(remoteJid);
        };

        const restartIdleTimeout = () => {
            const idleTimeoutMS = this.schema.idleTimeout && getMS(this.schema.idleTimeout);
            if (idleTimeoutMS && this.schema.idleTimeout) {
                const timeoutId = setTimeout(async () => {
                    await this.sendMessageList(remoteJid, this.schema.timeoutMsg);
                    await cleanupRemoteJid();
                }, idleTimeoutMS);

                this.setTimeoutFlow(remoteJid, timeoutId);
            }
        };

        // get current flow
        const flow = this.getFlow(remoteJid);

        // get current text message
        const msgText = options?.data?.text ?? (typeof options === 'string' ? options : '');

        // if not exists flow, start over from schema matching flow
        if (!flow) {
            // check if msgText as match to matching current schema if not ignore message, unless start session
            const shouldMatchingForStart = this.schema.matches?.length;
            const matchingFound = this.schema.matches?.find((match) =>
                typeof match === 'string' ? match === msgText : match.test(msgText)
            );
            if (shouldMatchingForStart && !matchingFound) return;

            // start schema flow session send intro messages
            await this.sendMessageList(remoteJid, this.schema.flow?.messages);

            // save schema flow session to current remoteJid
            this.setFlow(remoteJid, this.schema.flow?.response);

            // reset schema flow data session to current remoteJid
            this.resetDataFlow(remoteJid);

            // start idle timeout for unreached contact session
            restartIdleTimeout();

            return;
        }

        // extend idle timeout from the (current) last response
        restartIdleTimeout();

        // if user decide to quit by typing the exit code then reset session
        if (this.schema.exitCode === msgText) {
            await cleanupRemoteJid();
            return;
        }

        // extract user data (id) options
        const key = this.getResponseId(options);

        // get user schema by current response flow ids if not exists start again from scratch
        const { field, next, validationError, validate, onSubmit }: ScenarioResponse = flow[key] || this.schema.flow;

        // store user response data flow
        if (field) this.setDataFlow(remoteJid, field, key);

        // validate user response
        const text = msgText || key;
        if (!validate || validate?.(text)) {
            // apply to submit handler of this current step if exists handler
            await onSubmit?.({
                remoteJid,
                messageId,
                options,
                data: this.getDataFlow(remoteJid),
            });
        } else {
            // send to user warning about invalid input
            const errMsg = typeof validationError === 'function' ? validationError(text) : validationError;
            await this.client?.sendTextMessage(remoteJid, errMsg || 'invalid input!');
        }

        // send next session messages
        if (next?.messages?.length) {
            await this.sendMessageList(remoteJid, next?.messages);
            // save next response flow
            if (next?.response) this.setFlow(remoteJid, next.response);
        } else {
            // reset session if not exists any continue session
            await cleanupRemoteJid();
        }
    }

    onMessageReceived() {
        if (this.phone) this.client?.onPhoneMessageReceived(this.phone, this.onMessageReceivedCB);
        else this.client?.onAnyMessageReceived(this.onMessageReceivedCB);
    }
}
