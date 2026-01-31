import { MY_PHONE, MONGODB_URI, USE_MONGODB_STORAGE, TARGET_PHONE } from './dotenv';
import logger from './logger';
import { WhatsappSocket } from '../../src';
// import { WhatsappSocket } from '@hdriel/whatsapp-socket';
import { readFileSync, createReadStream } from 'node:fs';
import {
    DOCUMENT_ASSET_PATH,
    FILE_AUTH_PATH,
    IMAGE_ASSET_PATH,
    MP3_ASSET_PATH,
    OGG_ASSET_PATH,
    STICKER_ASSET_PATH,
    THUMBNAIL_ASSET_PATH,
    VIDEO_ASSET_PATH,
    XLSX_ASSET_PATH,
} from './paths';

const TEST_RECIPIENT = TARGET_PHONE;
const TEST_CONFIG = {
    mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
    fileAuthStateDirectoryPath: FILE_AUTH_PATH,
    // mongoCollection: 'whatsapp-test-auth',
    appName: 'whatsapp-socket-demo',
    debug: true,
    logger,
    printQRInTerminal: true,
    pairingPhone: MY_PHONE,
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const runTests: Record<string, boolean> = {
    sendMessage: false,
    sendButtons: false,
    sendList: true,
    sendReply: false,
    sendImage: false,
    sendVideo: false,
    sendAudio: false,
    sendFile: false,
    sendSticker: false,
};

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
            onReceiveMessages: async (messages, type) => {
                logger.info(null, `📨 Received ${messages?.length} messages (${type})`);
            },
        });

        await client.startConnection({ connectionAttempts: 3 });

        // Wait for connection to be fully established
        await sleep(3000);

        if (!client.isConnected()) {
            throw new Error('Failed to connect to WhatsApp');
        }

        logger.info(null, '✅ TEST 1 PASSED: Successfully connected to WhatsApp\n');

        if (runTests.sendMessage) {
            // ============================================
            // TEST 2: Text Messages
            // ============================================
            logger.info(null, '💬 TEST 2: Testing text messages...');

            await client.sendTextMessage(TEST_RECIPIENT, 'Hello! This is a test message from WhatsApp Socket 🚀');
            logger.info(null, '✅ Simple text message sent');

            await sleep(1000);

            // Text with reply
            const sentMsg = await client.sendTextMessage(TEST_RECIPIENT, 'This is a message to reply to');
            await sleep(1000);

            if (sentMsg?.key?.id) {
                await client.sendTextMessage(TEST_RECIPIENT, 'This is a reply!');
                logger.info(null, '✅ Reply message sent');
            }

            logger.info(null, '✅ TEST 2 PASSED: Text messages sent successfully\n');
        }

        if (runTests.sendButtons) {
            // ============================================
            // TEST 3: Button Messages
            // ============================================
            logger.info(null, '🔘 TEST 3: Testing button messages...');

            // CTA Buttons (URL, Copy, Call, Email, Reminder)
            await client.sendButtonsMessage(TEST_RECIPIENT, {
                title: 'Choose an action:',
                subtitle: 'Test buttons',
                buttons: [
                    {
                        label: 'Visit Website',
                        url: 'https://github.com/hdriel/whatsapp-socket',
                    },
                    {
                        label: 'Copy Code',
                        copy: 'npm install @hdriel/whatsapp-socket',
                    },
                    {
                        label: 'Call Us',
                        tel: '+972501234567',
                    },
                    /*
                    {
                        label: 'Send Email',
                        email: 'test@example.com',
                    },
                    {
                        label: 'Set Reminder',
                        reminderName: 'Test Reminder',
                        reminderOn: '1h',
                    },
                     */
                ],
            });
            logger.info(null, '✅ CTA buttons sent');

            await sleep(1000);
        }

        if (runTests.sendReply) {
            // Reply Buttons
            await client.sendReplyButtonsMessage(TEST_RECIPIENT, {
                title: 'Select an option:',
                subtitle: 'Quick reply buttons',
                buttons: ['Option 1', 'Option 2', { id: 'custom-id', label: 'Option 3' }],
            });
            logger.info(null, '✅ Reply buttons sent');

            logger.info(null, '✅ TEST 3 PASSED: Button messages sent successfully\n');
        }

        if (runTests.sendList) {
            // ============================================
            // TEST 3: List Messages
            // ============================================
            logger.info(null, '📋 TEST 3: Testing list messages...');

            // Single section list
            await client.sendListMessage(TEST_RECIPIENT, {
                title: 'Welcome! Please choose a service:',
                subtitle: 'Select from our menu',
                buttonText: 'View Options',
                sections: [
                    {
                        title: 'Main Services',
                        rows: [
                            {
                                id: 'service_support',
                                title: '🎧 Customer Support',
                                description: 'Get help from our support team',
                            },
                            {
                                id: 'service_sales',
                                title: '💼 Sales Inquiry',
                                description: 'Contact our sales department',
                            },
                            {
                                id: 'service_technical',
                                title: '🔧 Technical Support',
                                description: 'Technical assistance and troubleshooting',
                            },
                        ],
                    },
                ],
            });
            logger.info(null, '✅ Single section list sent');

            await sleep(2000);

            // Multiple sections list
            await client.sendListMessage(TEST_RECIPIENT, {
                title: 'Select a product category:',
                subtitle: 'Browse our catalog',
                buttonText: 'Show Categories',
                sections: [
                    {
                        title: 'Electronics',
                        rows: [
                            {
                                id: 'prod_phone',
                                title: '📱 Smartphones',
                                description: 'Latest mobile devices',
                            },
                            {
                                id: 'prod_laptop',
                                title: '💻 Laptops',
                                description: 'Computers and notebooks',
                            },
                            {
                                id: 'prod_tablet',
                                title: '📲 Tablets',
                                description: 'iPad and Android tablets',
                            },
                        ],
                    },
                    {
                        title: 'Accessories',
                        rows: [
                            {
                                id: 'acc_case',
                                title: '🛡️ Cases & Covers',
                                description: 'Protective accessories',
                            },
                            {
                                id: 'acc_charger',
                                title: '🔌 Chargers',
                                description: 'Power adapters and cables',
                            },
                            {
                                id: 'acc_headphone',
                                title: '🎧 Headphones',
                                description: 'Audio accessories',
                            },
                        ],
                    },
                    {
                        title: 'Services',
                        rows: [
                            {
                                id: 'srv_warranty',
                                title: '🛡️ Extended Warranty',
                            },
                            {
                                id: 'srv_repair',
                                title: '🔧 Repair Service',
                            },
                        ],
                    },
                ],
            });
            logger.info(null, '✅ Multiple sections list sent');

            await sleep(2000);

            // Simple list without descriptions
            await client.sendListMessage(TEST_RECIPIENT, {
                title: 'Quick Actions',
                buttonText: 'Select Action',
                sections: [
                    {
                        title: 'Available Actions',
                        rows: [
                            {
                                id: 'action_1',
                                title: 'Check Balance',
                            },
                            {
                                id: 'action_2',
                                title: 'View History',
                            },
                            {
                                id: 'action_3',
                                title: 'Update Profile',
                            },
                            {
                                id: 'action_4',
                                title: 'Settings',
                            },
                        ],
                    },
                ],
            });
            logger.info(null, '✅ Simple list (no descriptions) sent');

            logger.info(null, '✅ TEST 3 PASSED: List messages sent successfully\n');
        }

        if (runTests.sendImage) {
            // ============================================
            // TEST 4: Image Messages
            // ============================================
            logger.info(null, '🖼️ TEST 4: Testing image messages...');

            // From URL
            await client.sendImageMessage(TEST_RECIPIENT, 'https://picsum.photos/800/600', {
                caption: 'Image from URL',
            });
            logger.info(null, '✅ Image from URL sent');

            await sleep(1000);

            // From Buffer
            const imageBuffer = readFileSync(IMAGE_ASSET_PATH);
            await client.sendImageMessage(TEST_RECIPIENT, imageBuffer, {
                caption: 'Image from buffer',
                filename: 'test-image.jpg',
            });
            logger.info(null, '✅ Image from buffer sent');

            await sleep(1000);

            // From Stream
            const imageStream = createReadStream(IMAGE_ASSET_PATH);
            await client.sendImageMessage(TEST_RECIPIENT, imageStream, { caption: 'Image from stream' });
            logger.info(null, '✅ Image from stream sent');

            logger.info(null, '✅ TEST 4 PASSED: Image messages sent successfully\n');
        }

        if (runTests.sendVideo) {
            // ============================================
            // TEST 5: Video Messages
            // ============================================
            logger.info(null, '🎥 TEST 5: Testing video messages...');

            // From URL
            await client.sendVideoMessage(
                TEST_RECIPIENT,
                'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                { caption: 'Video from URL' }
            );
            logger.info(null, '✅ Video from URL sent');

            await sleep(1000);

            // From Buffer as GIF
            const videoBuffer = readFileSync(VIDEO_ASSET_PATH);
            await client.sendVideoMessage(TEST_RECIPIENT, videoBuffer, {
                caption: 'Video as GIF playback',
                sendAsGifPlayback: true,
                filename: 'test-video.mp4',
            });
            logger.info(null, '✅ Video as GIF sent');

            logger.info(null, '✅ TEST 5 PASSED: Video messages sent successfully\n');

            // ============================================
            // TEST 6: Audio Messages
            // ============================================
            logger.info(null, '🎵 TEST 6: Testing audio messages...');

            // Audio file
            const audioBuffer = readFileSync(MP3_ASSET_PATH);
            await client.sendAudioMessage(TEST_RECIPIENT, audioBuffer, {
                filename: 'test-audio.mp3',
                mimetype: 'audio/mpeg',
                seconds: 10,
            });
            logger.info(null, '✅ Audio message sent');

            await sleep(1000);
        }

        if (runTests.sendAudio) {
            // Voice note (PTT - Push to Talk)
            const voiceBuffer = readFileSync(OGG_ASSET_PATH);
            await client.sendAudioMessage(TEST_RECIPIENT, voiceBuffer, {
                mimetype: 'audio/ogg; codecs=opus',
                seconds: 5,
            });
            logger.info(null, '✅ Voice note sent');

            logger.info(null, '✅ TEST 6 PASSED: Audio messages sent successfully\n');

            // ============================================
            // TEST 7: Document Messages
            // ============================================
            logger.info(null, '📄 TEST 7: Testing document messages...');
        }

        if (runTests.sendFile) {
            // PDF from URL
            await client.sendFileMessage(
                TEST_RECIPIENT,
                'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                {
                    caption: 'PDF Document',
                    mimetype: 'application/pdf',
                    filename: 'my-document.pdf',
                }
            );
            logger.info(null, '✅ PDF from URL sent');

            await sleep(1000);

            // DOCX from Buffer
            const docBuffer = readFileSync(DOCUMENT_ASSET_PATH);
            await client.sendFileMessage(TEST_RECIPIENT, docBuffer, {
                caption: 'Word Document',
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                filename: 'test-document.docx',
            });
            logger.info(null, '✅ DOCX from buffer sent');

            await sleep(1000);

            // Excel with thumbnail
            const excelBuffer = readFileSync(XLSX_ASSET_PATH);
            const thumbnailBuffer = readFileSync(THUMBNAIL_ASSET_PATH);
            await client.sendFileMessage(TEST_RECIPIENT, excelBuffer, {
                caption: 'Excel Spreadsheet',
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filename: 'test-spreadsheet.xlsx',
                jpegThumbnailSrc: thumbnailBuffer,
            });
            logger.info(null, '✅ Excel with thumbnail sent');

            logger.info(null, '✅ TEST 7 PASSED: Document messages sent successfully\n');
        }

        if (runTests.sendSticker) {
            // ============================================
            // TEST 8: Sticker Messages
            // ============================================
            logger.info(null, '😄 TEST 8: Testing sticker messages...');

            // Sticker from URL (must be .webp, 512x512, <100kb)
            await client.sendStickerMessage(TEST_RECIPIENT, 'https://www.gstatic.com/webp/gallery/4.sm.webp');
            logger.info(null, '✅ Sticker from URL sent');

            await sleep(1000);

            // Sticker from buffer
            const stickerBuffer = readFileSync(STICKER_ASSET_PATH);
            await client.sendStickerMessage(TEST_RECIPIENT, stickerBuffer);
            logger.info(null, '✅ Sticker from buffer sent');

            logger.info(null, '✅ TEST 8 PASSED: Sticker messages sent successfully\n');
        }

        // ============================================
        // Summary
        // ============================================
        logger.info(null, '\n' + '='.repeat(50));
        logger.info(null, '🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
        logger.info(null, '='.repeat(50));
        logger.info(null, '\nTest Summary:');
        logger.info(null, '✅ Connection & Authentication');
        runTests.sendMessage && logger.info(null, '✅ Text Messages (simple + reply)');
        runTests.sendButtons && logger.info(null, '✅ Button Actions Messages (CTA + Reply)');
        runTests.sendReply && logger.info(null, '✅ Button Reply Messages (CTA + Reply)');
        runTests.sendImage && logger.info(null, '✅ Image Messages (URL + Buffer + Stream)');
        runTests.sendVideo && logger.info(null, '✅ Video Messages (URL + Buffer + GIF)');
        runTests.sendAudio && logger.info(null, '✅ Audio Messages (file + voice note)');
        runTests.sendFile && logger.info(null, '✅ Document Messages (PDF + DOCX + Excel)');
        runTests.sendSticker && logger.info(null, '✅ Sticker Messages (URL + Buffer)');
        const tests = Object.values(runTests);
        const total = tests.filter((v) => v).length;
        const totalStr = `${total + 1}/${tests.length + 1}`;
        logger.info(null, `📊 Total: ${totalStr} tests passed`);
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
