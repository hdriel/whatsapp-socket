// @ts-ignore
import { WhatsappSocket, WhatsappSocketBot } from '../../src';
import logger from './logger';
import { sleep, TEST_CONFIG } from './config';

const bot = new WhatsappSocketBot('0502350009', {
    name: 'Digital_Service_Bot',
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
        ],
        response: {
            collect_details: {
                next: {
                    messages: [{ text: { text: 'נשמח להכיר! מה השם המלא שלך?' } }],
                    response: {
                        '': {
                            validation: (name) => name.split(' ').length > 1,
                            next: {
                                messages: [{ text: { text: 'מעולה, מה מספר הטלפון לחזרה?' } }],
                                response: {
                                    '': {
                                        validation: (phone) => phone.startsWith('05'),
                                        next: {
                                            messages: [
                                                {
                                                    reply: {
                                                        title: 'באיזה נושא תרצה שחזור אליך?',
                                                        buttons: [
                                                            { id: 'sales', label: 'מכירות' },
                                                            { id: 'services', label: 'שירות' },
                                                            { id: 'other', label: 'אחר' },
                                                        ],
                                                    },
                                                },
                                            ],
                                            response: {
                                                '': {
                                                    next: {
                                                        messages: [
                                                            {
                                                                text: {
                                                                    text: 'תודה רבה! הפרטים נקלטו, נציג שלנו יחזור אליך בהקדם. 🚀',
                                                                },
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
                    messages: [{ text: { text: 'מעביר אותך לנציג אנושי... בינתיים אפשר לכתוב כאן את השאלה שלך. ⏳' } }],
                    response: undefined,
                },
            },
        },
    },
});

async function runWhatsAppTests() {
    logger.info(null, '🚀 Starting WhatsApp Socket Tests...\n');

    let client: WhatsappSocket | null = null;

    try {
        // ============================================
        // TEST 1: Connection & Authentication
        // ============================================
        logger.info(null, '📱 TEST 1: Connecting to WhatsApp...');

        // @ts-ignore
        client = new WhatsappSocket({
            ...TEST_CONFIG,
            logger: logger as any,
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
        process.exit(0);
    })
    .catch((error) => {
        logger.error(null, '\n💥 Test suite failed:', error);
        process.exit(1);
    });
