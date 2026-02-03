import { WhatsappSocket } from './whatsappSocket.private.client';
import type { BotSchema } from './bot.schema';

export class WhatsappSocketBot {
    protected schema: BotSchema;
    protected phone: string;
    protected client?: WhatsappSocket;
    // @ts-ignore
    private ids: Record<string, () => void> = {};

    constructor(phone: string, schema: BotSchema) {
        this.phone = phone;
        this.schema = schema;
    }

    set socket(socket: WhatsappSocket) {
        this.client = socket;
    }
}

// const bot = new WhatsappSocketBot('0502350009', { name: '' });
// const was = new WhatsappSocket({});
// bot.socket = was;
