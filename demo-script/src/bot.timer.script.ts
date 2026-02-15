// @ts-ignore
import { WhatsappSocket, WhatsappSocketBot } from '../../src';
import logger from './logger';
import { sleep, TEST_CONFIG } from './config';
import { TARGET_PHONE } from './dotenv';

const TEST_RECIPIENT = TARGET_PHONE;

let client: WhatsappSocket | null = null;

const bot = new WhatsappSocketBot({
    name: 'Timer_Bot',
    matches: [(_remoteJid: string, textMsg: string, fromMe?: boolean) => !!(fromMe && textMsg === 'הודעה מתוזמנת')],
    description: 'בוט שליחת הודעות מתוזמנות',
    exitCode: '0000',
    exitMsg: { text: { text: 'סיום סשן' } },
    flow: {
        messages: [
            {
                reply: {
                    title: 'למי לשלוח את ההודעה',
                    buttons: [
                        { id: 'phone', label: 'מספר טלפון' },
                        { id: 'contact', label: 'לאיש קשר' },
                    ],
                },
            },
        ],
        response: {
            phone: {
                field: 'phone',
                validate: (phone) => /05\d-?\d\d\d-?\d\d\d\d/.test(phone),
                validationError: ['הזן מספר בפורמט  הבא', '05X-XXX-XXXX', 'או בפורמט', '05XXXXXXXX'].join('\n'),
                next: { messages: [] },
            },
            contact: {
                field: 'username',
                validate: (name) => name.trim().length > 0,
                validationError: 'הזן שם מלא או חלקי עבור איש הקשר',
                next: {
                    messages: [
                        async (_remoteJid: string, dataFlow: any) => {
                            const contacts = await client?.getContacts();
                            if (!contacts?.length) {
                                return {
                                    forceExit: true,
                                    text: { text: 'לא נמצא אף משתמש עם שם מתאים לזה.' },
                                };
                            }

                            return {
                                menu: {
                                    title: 'נמצאו {n} התאמות לתוצאות החיפוש שלך'.replace(
                                        '{n}',
                                        `${contacts?.length ?? 0}`
                                    ),
                                    buttonText: 'בחר איש קשר',
                                    sections: [
                                        {
                                            title: '',
                                            rows: contacts.map((contact) => ({
                                                id: contact.id,
                                                title: contact.name ?? 'ללא שם',
                                            })),
                                        },
                                    ],
                                },
                            };
                        },
                    ],
                    response: {
                        '': {
                            field: 'contact',
                            next: {
                                messages: [
                                    {
                                        text: {
                                            text: [
                                                'בחר תאריך לשליחה בפורמט dd.mm.yyyy',
                                                'יכול גם לכתוב היום, או תאריך ללא שנה dd.mm',
                                            ].join('\n'),
                                        },
                                    },
                                ],
                                response: {
                                    '': {
                                        field: 'date',
                                        validate: (str) => str === 'היום' || /\d\d.\d\d(.yyyy)?/.test(str), // todo: check that after now
                                        validationError: 'פורמט לא תקין, נסה שוב',
                                        next: {
                                            messages: [{ text: { text: 'בחר שעה בפורמט hh:mm' } }],
                                            response: {
                                                '': {
                                                    field: 'time',
                                                    validate: (str) => /\d\d:\d\d/.test(str), // todo: check that after now
                                                    validationError: 'פורמט לא תקין, נסה שוב',
                                                    next: {
                                                        messages: [{ text: { text: 'כתוב את ההודעה שלך' } }],
                                                        response: {
                                                            '': {
                                                                field: 'message',
                                                                validate: (str) => str.trim().length > 0,
                                                                validationError: 'חובה לכלול הודעה כלשהי',
                                                                onSubmit: ({ remoteJid, data }) => {
                                                                    const timeout = 1000 * 5;
                                                                    bot.setTimer(
                                                                        remoteJid,
                                                                        data.phone ?? data.contact?.id,
                                                                        { text: { text: data.message } },
                                                                        timeout
                                                                    );
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
        },
    },
});

async function runWhatsAppTests() {
    logger.info(null, '🚀 Starting WhatsApp Socket Ping-Pong Bot Tests...\n');

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

        await client.startConnection({ connectionAttempts: 3 });

        // Wait for connection to be fully established
        await sleep(3000);

        if (!client.isConnected()) {
            throw new Error('Failed to connect to WhatsApp');
        }

        bot.socket = client;

        await client.sendTextMessage(
            TEST_RECIPIENT,
            'Hello! This is a test message from WhatsApp Socket BOT - timer messages ⏱️'
        );

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
