// @ts-ignore
import { WhatsappSocket, WhatsappSocketBot } from '../../src';
import logger from './logger';
import { sleep, TEST_CONFIG } from './config';
import { TARGET_PHONE } from './dotenv';

const TEST_RECIPIENT = TARGET_PHONE;

let client: WhatsappSocket | null = null;
const bot = new WhatsappSocketBot({
    name: 'Ping_Bot',
    matches: [(str) => str.toLowerCase() === 'ping'],
    description: 'בוט שמגיב pong לping',
    flow: { messages: [{ text: { text: 'pong' } }] },
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
            'Hello! This is a test message from WhatsApp Socket BOT - ping pong 🏓'
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
