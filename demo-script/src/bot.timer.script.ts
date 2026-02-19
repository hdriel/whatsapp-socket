// @ts-ignore
import { WhatsappSocket, WhatsappSocketBot } from '../../src';
import logger from './logger';
import { sleep, TEST_CONFIG } from './config';
import { TARGET_PHONE } from './dotenv';
import type { Scenario } from '../../src/bot.schema';

const TEST_RECIPIENT = TARGET_PHONE;

let client: WhatsappSocket | null = null;
const dateTimeSchema: Scenario = {
    messages: [
        {
            text: {
                text: ['בחר תאריך לשליחה בפורמט dd.mm.yyyy', 'יכול גם לכתוב היום, או תאריך ללא שנה dd.mm'].join('\n'),
            },
        },
    ],
    response: {
        '': {
            field: 'date',
            next: {
                messages: [{ text: { text: 'בחר שעה בפורמט hh:mm' } }],
                response: {
                    '': {
                        field: 'time',
                        next: {
                            messages: [{ text: { text: 'כתוב את ההודעה שלך' } }],
                            response: {
                                '': {
                                    field: 'message',
                                    validate: (str) => str.trim().length > 0,
                                    validationError: 'חובה לכלול הודעה כלשהי',
                                    onSubmit: async ({ remoteJid, data }) => {
                                        if (!data.date) {
                                            logger.warn('bot', 'missing date', data);
                                            return;
                                        }
                                        if (!data.time) {
                                            logger.warn('bot', 'missing time', data);
                                            return;
                                        }
                                        if (!(data.phone ?? data.contact?.id)) {
                                            logger.warn('bot', 'missing phone or contact id', data);
                                            return;
                                        }
                                        if (!data.message) {
                                            logger.warn('bot', 'missing message', data);
                                            return;
                                        }

                                        const now = new Date();
                                        let targetDate: Date;

                                        if (data.date === 'היום') {
                                            targetDate = new Date();
                                        } else {
                                            const dateParts = data.date?.split('.');
                                            const day = parseInt(dateParts[0]);
                                            const month = parseInt(dateParts[1]) - 1; // חודשים מתחילים מ-0
                                            const year = dateParts[2] ? parseInt(dateParts[2]) : now.getFullYear();

                                            targetDate = new Date(year, month, day);
                                        }

                                        // הוספת השעה
                                        const [hours, minutes] = data.time.split(':').map(Number);
                                        targetDate.setHours(hours, minutes, 0, 0);

                                        // חישוב ההפרש בזמן
                                        const timeout = targetDate.getTime() - now.getTime();

                                        if (timeout <= 0) {
                                            client?.sendTextMessage(remoteJid, '⚠️ התאריך והשעה שהזנת כבר עברו!');
                                            return;
                                        }

                                        await client?.setTimer(
                                            remoteJid,
                                            data.phone ?? data.contact?.id,
                                            { text: { text: data.message } },
                                            timeout
                                        );

                                        client?.sendTextMessage(
                                            null,
                                            `✅ ההודעה תישלח ב-${targetDate.toLocaleString('he-IL')}`
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
};

const bot = new WhatsappSocketBot({
    name: 'Timer_Bot',
    // matches: [(_remoteJid: string, textMsg: string, fromMe?: boolean) => !!(fromMe && textMsg === 'הודעה מתוזמנת')],
    description: 'בוט שליחת הודעות מתוזמנות',
    exitCode: '0000',
    exitMsg: { text: { text: 'סיום סשן' } },
    unknownInputMsg: { text: { text: 'קלט לא תקין נסה שוב או סיים את הסשן בהקלדה של "0000"' } },
    flow: {
        messages: [
            {
                reply: {
                    title: 'למי לשלוח את ההודעה',
                    buttons: [
                        { id: 'phone', label: 'מספר טלפון' },
                        // { id: 'contact', label: 'לאיש קשר' },
                        { id: 'exit', label: 'ביטול פעולה' },
                    ],
                },
            },
        ],
        response: {
            exit: {},
            phone: {
                next: {
                    messages: [
                        {
                            text: {
                                text: ['הזן מספר בפורמט  הבא', '05X-XXX-XXXX', 'או בפורמט', '05XXXXXXXX'].join('\n'),
                            },
                        },
                    ],
                    response: {
                        '': {
                            field: 'phone',
                            next: dateTimeSchema,
                        },
                    },
                },
            },
            contact: {
                field: 'username',
                next: {
                    messages: [
                        async (_remoteJid: string, _dataFlow: any) => {
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
                            next: dateTimeSchema,
                        },
                    },
                },
            },
        },
    },
    fields: {
        phone: {
            validate: (phone: string) => /^05\d-?\d\d\d-?\d\d\d\d$/.test(phone.replace(/\s/g, '')),
            parseFieldData: (phone: string) => phone.replace(/[-\s]/g, ''),
            validationError: 'מספר פלאפון לא חוקי, הזן שוב',
        },
        username: {
            validate: (name: string) => name.trim().length > 0,
            validationError: 'הזן שם מלא או חלקי עבור איש הקשר',
        },
        date: {
            validate: (date: string) => date === 'היום' || /\d\d?\.\d\d?(\.\d\d\d\d)?/.test(date), // todo: check that after now
            validationError: 'פורמט לא תקין, נסה שוב',
        },
        time: {
            validate: (time: string) => {
                const match = /^\d\d?:\d\d?$/.test(time);
                if (!match) return false;

                const [hours, minutes] = time.split(':').map(Number);
                return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
            },
            validationError: 'פורמט לא תקין, נסה שוב',
        },
        message: {
            validate: (message: string) => message.trim().length > 0,
            validationError: 'חובה לכלול הודעה כלשהי',
        },
    },
});

async function runWhatsAppTests() {
    logger.info(null, '🚀 Starting WhatsApp Socket Timers Bot Tests...\n');

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
