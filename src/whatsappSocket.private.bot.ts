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

export const bot = new WhatsappSocketBot('0502350009', {
    name: 'Digital_Service_Bot',
    scenario: {
        messages: [
            {
                type: 'reply',
                title: "שלום! 👋 ברוכים הבאים ל-'שירות בוט דיגטלי'.",
                subtitle: 'איך נוכל לעזור לכם היום?',
                buttons: [
                    { id: 'collect_details', label: '📝 השארת פרטים' },
                    { id: 'send_location', label: '📍 מיקום החברה' },
                    { id: 'send_website', label: '🌐 אתר האינטרנט שלנו' },
                    { id: 'human_agent', label: '👤 לדבר עם נציג' },
                ],
            },
        ],
        response: {
            collect_details: {
                next: {
                    messages: [{ type: 'text', text: 'נשמח להכיר! מה השם המלא שלך?' }],
                    response: {
                        '': {
                            validation: (name) => name.split(' ').length > 1,
                            next: {
                                messages: [{ type: 'text', text: 'מעולה, מה מספר הטלפון לחזרה?' }],
                                response: {
                                    '': {
                                        validation: (phone) => phone.startsWith('05'),
                                        next: {
                                            messages: [
                                                {
                                                    type: 'reply',
                                                    title: 'באיזה נושא תרצה שחזור אליך?',
                                                    buttons: [
                                                        { id: 'sales', label: 'מכירות' },
                                                        { id: 'services', label: 'שירות' },
                                                        { id: 'other', label: 'אחר' },
                                                    ],
                                                },
                                            ],
                                            response: {
                                                '': {
                                                    next: {
                                                        messages: [
                                                            {
                                                                type: 'text',
                                                                text: 'תודה רבה! הפרטים נקלטו, נציג שלנו יחזור אליך בהקדם. 🚀',
                                                            },
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            send_location: {
                next: {
                    messages: [
                        {
                            type: 'location',
                            latitude: 32.053,
                            longitude: 34.787,
                            name: 'שירותי דיגיטלי לעסקים',
                            address: 'ברחוב החרש 10, תל אביב',
                        },
                    ],
                    response: undefined,
                },
            },
            send_website: {
                next: {
                    messages: [
                        {
                            type: 'buttons',
                            title: 'כל המידע, המוצרים והשירותים שלנו נמצאים כאן: 👇',
                            buttons: [{ label: 'קישור לאתר', url: 'https://www.example.co.il' }],
                        },
                    ],
                    response: undefined,
                },
            },
            human_agent: {
                next: {
                    messages: [
                        { type: 'text', text: 'מעביר אותך לנציג אנושי... בינתיים אפשר לכתוב כאן את השאלה שלך. ⏳' },
                    ],
                    response: undefined,
                },
            },
        },
    },
});
// const was = new WhatsappSocket({});
// bot.socket = was;
