// @ts-ignore
import { WhatsappSocket, WhatsappSocketBot } from '../../src';
import logger from './logger';
import { sleep, TEST_CONFIG } from './config';

let client: WhatsappSocket | null = null;
const bot = new WhatsappSocketBot(
    {
        name: 'Digital_Service_Bot',
        exitCode: '999',
        backCode: '-1',
        matches: ['בוט', 'bot', /^b\d+$/],
        description: 'בוט לדוגמה של פרטים לחנות דיגיטלית',
        idleTimeout: '2m',
        exitMsg: {
            text: {
                text: 'החלטת לצאת מהשיחה ניתן לחזור אלינו שוב בכתיבת ההודעות הבאות: {matches}'.replace(
                    '{matches}',
                    '\n* ' + ['בוט', 'bot', /b\d+/].join('\n* ')
                ),
            },
        },
        timeoutMsg: {
            text: {
                text: 'הזמן שהוקצה לשיחה ללא תגובה היינו 2 דקות והם עברו\nמוזמן ליצור איתנו קשר שוב כאן\nבהצלחה',
            },
        },
        fields: {
            name: {
                validate: (name: string) => name.split(' ').length > 1,
                parseFieldData: (name) => name.trim(),
                validationError: 'שם מלא חייב להיות לפחות 2 מילים',
            },
            phone: {
                validate: (phone: string) => phone.startsWith('05'),
                parseFieldData: (phone) => phone.replace(/\D/g, ''),
                validationError: (input?: string) =>
                    'מספר הטלפון: "{phone}" לא חוקי, חייב להתחיל ב05X-XXX-XXXX'.replace('{phone}', input || ''),
            },
            message: {},
        },
        flow: {
            messages: [
                {
                    reply: {
                        title: "שלום! 👋 ברוכים הבאים ל-'שירות בוט דיגטלי'.",
                        subtitle: 'איך נוכל לעזור לכם היום?',
                        buttons: [
                            { id: 'collect_details', label: '📝 השארת פרטים' },
                            { id: 'send_location', label: '📍 מיקום החברה' },
                            { id: 'send_website', label: '🌐 אתר האינטרנט שלנו' },
                            { id: 'human_agent', label: '👤 לדבר עם נציג' },
                        ],
                    },
                },
                {
                    text: {
                        text: [
                            'בכל שלב ניתן לסיים את השיחה בכתיבת הודעה: {exitCode}'.replace('{exitCode}', '999'),
                            'או לחזור לתפריט קודם בהודעה: {backCode}'.replace('{backCode}', '-1'),
                        ].join('\n'),
                    },
                },
            ],
            response: {
                collect_details: {
                    next: {
                        field: 'name',
                        messages: [{ text: { text: 'נשמח להכיר! מה השם המלא שלך?' } }],
                        response: {
                            '': {
                                next: {
                                    messages: [{ text: { text: 'מעולה, מה מספר הטלפון לחזרה?' } }],
                                    response: {
                                        '': {
                                            next: {
                                                messages: [
                                                    {
                                                        menu: {
                                                            title: 'באיזה נושא תרצה שחזור אליך?',
                                                            buttonText: 'בחר מהאפשרויות הבאות',
                                                            sections: [
                                                                {
                                                                    title: 'בחר נושא',
                                                                    rows: [
                                                                        { id: 'sales', title: 'מכירות' },
                                                                        { id: 'services', title: 'שירות' },
                                                                        { id: 'other', title: 'אחר' },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    },
                                                ],
                                                response: {
                                                    other: {
                                                        next: {
                                                            field: 'message',
                                                            messages: [
                                                                {
                                                                    text: {
                                                                        text: 'תודה רבה! הפרטים נקלטו, בינתיים ציין את מהות הפנייה שלך ונחזור אליך בהקדם',
                                                                    },
                                                                },
                                                            ],
                                                            response: {
                                                                '': {
                                                                    onSubmit: (data) => {
                                                                        logger.info(null, 'SUBMIT DATA', data);
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    '': {
                                                        next: {
                                                            messages: [
                                                                {
                                                                    text: {
                                                                        text: 'תודה רבה! הפרטים נקלטו, נציג שלנו יחזור אליך בהקדם. 🚀',
                                                                    },
                                                                },
                                                            ],
                                                            response: {
                                                                '': {
                                                                    onSubmit: (data) => {
                                                                        logger.info(null, 'SUBMIT DATA', data);
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
                        },
                    },
                },
                send_location: {
                    next: {
                        messages: [
                            {
                                location: {
                                    latitude: 32.053,
                                    longitude: 34.787,
                                    name: 'שירותי דיגיטלי לעסקים',
                                    address: 'ברחוב החרש 10, תל אביב',
                                },
                            },
                        ],
                        response: undefined,
                    },
                },
                send_website: {
                    next: {
                        messages: [
                            {
                                buttons: {
                                    title: 'כל המידע, המוצרים והשירותים שלנו נמצאים כאן: 👇',
                                    buttons: [{ label: 'קישור לאתר', url: 'https://www.example.co.il' }],
                                },
                            },
                        ],
                        response: undefined,
                    },
                },
                human_agent: {
                    next: {
                        messages: [
                            { text: { text: 'מעביר אותך לנציג אנושי... בינתיים אפשר לכתוב כאן את השאלה שלך. ⏳' } },
                        ],
                        response: undefined,
                    },
                },
            },
        },
    },
    '0502350009'
);

async function runWhatsAppTests() {
    logger.info(null, '🚀 Starting WhatsApp Socket Bot Tests...\n');

    try {
        // ============================================
        // TEST 1: Connection & Authentication
        // ============================================
        logger.info(null, '📱 TEST 1: Connecting to WhatsApp...');

        // @ts-ignore
        client = new WhatsappSocket({
            ...TEST_CONFIG,
            logger: logger as any,
            printQRInTerminal: true,
            onOpen: async () => {
                logger.info(null, '✅ Connection opened successfully!');
            },
            onClose: async () => {
                logger.info(null, '❌ Connection closed');
            },
            onQR: async (_qr: string, code: string | null | undefined) => {
                logger.info(null, '📸 QR Code received');
                if (code) {
                    logger.info(null, `🔑 Pairing Code: ${code}`);
                }
            },
            onConnectionStatusChange: async (status) => {
                logger.info(null, `📊 Connection status: ${status}`);
            },
        });
        bot.socket = client;

        await client.startConnection({ connectionAttempts: 3 });

        // Wait for connection to be fully established
        await sleep(3000);

        if (!client.isConnected()) {
            throw new Error('Failed to connect to WhatsApp');
        }

        logger.info(null, '✅ Successfully connected to WhatsApp\n');
        logger.info(null, 'Waiting for messages\n');
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        throw error;
    } finally {
        // Cleanup
        if (client) {
            logger.info(null, '\n🧹 Cleaning up...');
            await sleep(2000);
            await client.closeConnection();
            logger.info(null, '✅ Connection closed');
        }
    }
}

runWhatsAppTests()
    .then(() => {
        logger.info(null, '\n✨ Test suite completed successfully');
    })
    .catch((error) => {
        logger.error(null, '\n💥 Test suite failed:', error);
        process.exit(1);
    });
