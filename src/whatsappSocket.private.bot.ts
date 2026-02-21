import { WhatsappSocket } from './whatsappSocket.private.client';
import type { BotSchema, Message, MessageCB, MessageItem, Scenario } from './bot.schema';
import { awaitIfNeeded, getMS } from './helpers.ts';
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
    private lastMessages: Record<string, string[]> = {};

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

    get socket() {
        return this.client as WhatsappSocket;
    }

    private async sendMessageList(remoteJid: string, messages?: MessageItem | MessageItem[] | undefined) {
        const messageList: Message[] = ([] as Message[]).concat(messages as Message).filter((v) => v);
        if (!messageList?.length) return false;

        const messageIds: string[] = [];

        for (let message of messageList) {
            if (typeof message === 'function') {
                message = await (<MessageCB>message)(remoteJid, this.dataFlow[remoteJid]);
            }

            const [key, { forceExit, timeout, ...value }]: any = Object.entries(message)[0];
            const timeoutValue = timeout ? getMS(timeout) : 0;
            if (timeoutValue) {
                this.client?.setTimer(remoteJid, key, value, timeoutValue);
                return forceExit;
            }

            let messageResponse: any;
            switch (key) {
                case 'text':
                    messageResponse = await this.client?.sendTextMessage(remoteJid, value);
                    break;
                case 'reply':
                    messageResponse = await this.client?.sendReplyButtonsMessage(remoteJid, value);
                    break;
                case 'menu':
                    messageResponse = await this.client?.sendMenuMessage(remoteJid, value);
                    break;
                case 'buttons':
                    messageResponse = await this.client?.sendButtonsMessage(remoteJid, value);
                    break;
                case 'image':
                    messageResponse = await this.client?.sendImageMessage(remoteJid, value);
                    break;
                case 'video':
                    messageResponse = await this.client?.sendVideoMessage(remoteJid, value);
                    break;
                case 'audio':
                    messageResponse = await this.client?.sendAudioMessage(remoteJid, value);
                    break;
                case 'location':
                    messageResponse = await this.client?.sendLocationMessage(remoteJid, value);
                    break;
                default:
                    messageResponse = await this.client?.sendTextMessage(remoteJid, 'Done');
                    break;
            }

            messageIds.push(messageResponse.key.id as string);
            if (forceExit) return true;
        }

        this.lastMessages[remoteJid] ||= [];
        this.lastMessages[remoteJid].unshift(...messageIds);
        this.lastMessages[remoteJid] = this.lastMessages[remoteJid].slice(0, 10);
        return false;
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
        if (response.data?.buttonsResponse) {
            return response.data.buttonsResponse.id;
        }

        if (response.data?.menuResponse) {
            return response.data.menuResponse.id;
        }

        return '';
    }

    private async onMessageReceivedCB(remoteJid: string, messageId: string, options: any) {
        if (this.lastMessages[remoteJid]?.includes(messageId)) return;

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

        const checkForMatches = async (matches) => {
            if (!matches?.length) {
                return null;
            }

            for (const match of matches) {
                if (match === undefined || match === null) continue;

                let isMatched = false;

                if (typeof match === 'string') {
                    isMatched = match === msgText;
                } else if (typeof match === 'function') {
                    isMatched = await awaitIfNeeded<boolean>((<any>match)(remoteJid, msgText, !!options.fromMe));
                } else {
                    isMatched = match.test(msgText);
                }

                if (isMatched) return match;
            }

            return null;
        };

        // get current flow
        const currentFlow = this.getFlow(remoteJid);

        // get current text message
        const msgText = options?.data?.text ?? (typeof options === 'string' ? options : '');

        // if not exists flow, start over from schema matching flow
        if (!currentFlow) {
            if (this.schema.exitCode && this.schema.exitCode === msgText) {
                await cleanupRemoteJid(false);
                return;
            }

            // check if msgText as match to matching current schema if not ignore message, unless start session
            const shouldMatchingForStart = !!this.schema.matches?.length;
            const matchedItem = await checkForMatches(this.schema.matches);
            const notRelevant = shouldMatchingForStart && !matchedItem;
            if (notRelevant) return;

            // start schema flow session send intro messages
            const forceExit = await this.sendMessageList(remoteJid, this.schema.flow?.messages);
            if (forceExit) {
                await cleanupRemoteJid();
                return;
            }

            // save schema flow session to current remoteJid
            this.setFlow(remoteJid, this.schema.flow);

            // reset schema flow data session to current remoteJid
            this.resetDataFlow(remoteJid);

            // start idle timeout for unreached contact session
            restartIdleTimeout();

            return;
        }

        // extend idle timeout from the (current) last response
        restartIdleTimeout();

        // if user decide to quit by typing the exit code then reset session
        if (this.schema.exitCode && this.schema.exitCode === msgText) {
            await cleanupRemoteJid();
            return;
        }

        // extract user data (id) options
        const key = this.getResponseId(options);

        if (!currentFlow[key]) {
            if (options.data) await this.sendMessageList(remoteJid, this.schema.unknownInputMsg);
            return;
        }

        const text = msgText || key;
        const field = currentFlow.field;
        const stepMessages = currentFlow?.messages;
        const { parseFieldData, validationError, validate } = this.schema.fields[field as string] ?? {};

        const forceExit = await this.sendMessageList(remoteJid, stepMessages);
        if (forceExit) {
            await cleanupRemoteJid();
            return;
        }

        if (field) {
            if (!validate || validate(text)) {
                // validate user response
                // store user response data flow
                if (field) {
                    const data = parseFieldData?.(msgText) ?? msgText;
                    this.setDataFlow(remoteJid, field, data);
                }
            } else {
                // send to user warning about invalid input
                const errMsg = typeof validationError === 'function' ? validationError(text) : validationError;
                await this.client?.sendTextMessage(remoteJid, errMsg || 'invalid input!');
                await this.sendMessageList(remoteJid, currentFlow?.messages);

                return;
            }
        }

        // apply to submit handler of this current step if exists handler
        await currentFlow.response[key]?.onSubmit?.({
            remoteJid,
            messageId,
            options,
            data: this.getDataFlow(remoteJid),
        });

        const nextFlow = currentFlow[key]?.next;
        const nextMessages = nextFlow?.messages;

        // send next session messages
        if (nextMessages?.length) {
            const forceExit = await this.sendMessageList(remoteJid, nextMessages);
            if (forceExit) {
                await cleanupRemoteJid();
                return;
            }

            this.setFlow(remoteJid, nextFlow);
        } else {
            // reset session if not exists any continue session
            await cleanupRemoteJid();
        }
    }

    onMessageReceived() {
        const cb = this.onMessageReceivedCB.bind(this);
        if (this.phone) this.client?.onPhoneMessageReceived(this.phone, cb);
        else this.client?.onAnyMessageReceived(cb);
    }
}
