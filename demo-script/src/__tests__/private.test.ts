import logger from '../logger';
import { TEST_RECIPIENT, TEST_CONFIG } from './config';
import { WhatsappSocket } from '@hdriel/whatsapp-socket';
import { MY_PHONE } from '../dotenv';
import { readFileSync, createReadStream } from 'node:fs';
import path from 'pathe';

const TIMEOUT = 30000; // 30 seconds timeout for each test

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('WhatsApp Socket Tests', () => {
    let client: WhatsappSocket | null = null;

    beforeAll(async () => {
        // Setup: Connect to WhatsApp before all tests
        logger.info(null, '🚀 Setting up WhatsApp connection...');

        client = new WhatsappSocket({
            ...TEST_CONFIG,
            onOpen: async () => {
                logger.info(null, '✅ Connection opened');
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
        await sleep(3000); // Wait for connection to stabilize

        if (!client.isConnected()) {
            throw new Error('Failed to connect to WhatsApp');
        }

        logger.info(null, '✅ WhatsApp connected successfully');
    }, TIMEOUT);

    afterAll(async () => {
        // Cleanup: Close connection after all tests
        if (client) {
            logger.info(null, '🧹 Closing WhatsApp connection...');
            await client.closeConnection();
            logger.info(null, '✅ Connection closed');
        }
    }, TIMEOUT);

    describe('Connection Tests', () => {
        test('should be connected to WhatsApp', () => {
            expect(client).not.toBeNull();
            expect(client?.isConnected()).toBe(true);
        });
    });

    describe('Text Message Tests', () => {
        test(
            'should send simple text message',
            async () => {
                const result = await client?.sendTextMessage(TEST_RECIPIENT, 'Hello! This is a test message 🚀');

                expect(result).toBeDefined();
                expect(result?.fromMe).toBeTruthy();
                expect(result?.key?.id).toBeDefined();

                await sleep(1000);
            },
            TIMEOUT
        );

        test(
            'should send text message and reply to it',
            async () => {
                const originalMsg = await client?.sendTextMessage(TEST_RECIPIENT, 'This is the original message');

                expect(originalMsg?.key?.id).toBeDefined();

                await sleep(1000);

                const replyMsg = await client?.sendTextMessage(
                    TEST_RECIPIENT,
                    'This is a reply to the original message',
                    originalMsg?.key?.id
                );

                expect(replyMsg).toBeDefined();
                expect(replyMsg?.key?.id).toBeDefined();

                await sleep(1000);
            },
            TIMEOUT
        );

        test(
            'should send multiple text messages sequentially',
            async () => {
                const messages = ['First message', 'Second message', 'Third message'];

                for (const msg of messages) {
                    const result = await client?.sendTextMessage(TEST_RECIPIENT, msg);
                    expect(result).toBeDefined();
                    await sleep(500);
                }
            },
            TIMEOUT
        );
    });

    describe('Button Message Tests', () => {
        test(
            'should send CTA button message with multiple actions',
            async () => {
                const result = await client?.sendButtonsMessage(TEST_RECIPIENT, {
                    title: 'Choose an action:',
                    subtitle: 'Test CTA buttons',
                    buttons: [
                        {
                            label: 'Visit GitHub',
                            url: 'https://github.com/hdriel/whatsapp-socket',
                        },
                        {
                            label: 'Copy Code',
                            copy: 'npm install @hdriel/whatsapp-socket',
                        },
                        {
                            label: 'Call Support',
                            tel: MY_PHONE,
                        },
                    ],
                });

                expect(result).toBeDefined();
                await sleep(1000);
            },
            TIMEOUT
        );

        test(
            'should send reply button message',
            async () => {
                const result = await client?.sendReplyButtonsMessage(TEST_RECIPIENT, {
                    title: 'Select an option:',
                    subtitle: 'Quick reply test',
                    buttons: ['Option 1', 'Option 2', { id: 'custom-id-3', label: 'Option 3' }],
                });

                expect(result).toBeDefined();
                await sleep(1000);
            },
            TIMEOUT
        );

        test(
            'should send button message with single button',
            async () => {
                const result = await client?.sendReplyButtonsMessage(TEST_RECIPIENT, {
                    title: 'Confirm action',
                    buttons: ['Confirm'],
                });

                expect(result).toBeDefined();
                await sleep(1000);
            },
            TIMEOUT
        );
    });

    describe('Image Message Tests', () => {
        test(
            'should send image from URL',
            async () => {
                const result = await client?.sendImageMessage(TEST_RECIPIENT, 'https://picsum.photos/800/600', {
                    caption: 'Random image from URL',
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );

        test(
            'should send image from buffer',
            async () => {
                const imageBuffer = readFileSync(path.join(__dirname, 'test-assets/test-image.jpg'));

                const result = await client?.sendImageMessage(TEST_RECIPIENT, imageBuffer, {
                    caption: 'Image from buffer',
                    filename: 'test-image.jpg',
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );

        test(
            'should send image from stream',
            async () => {
                const imageStream = createReadStream(path.join(__dirname, 'test-assets/test-image.jpg'));

                const result = await client?.sendImageMessage(TEST_RECIPIENT, imageStream, {
                    caption: 'Image from stream',
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );

        test(
            'should send image without caption',
            async () => {
                const result = await client?.sendImageMessage(TEST_RECIPIENT, 'https://picsum.photos/400/400');

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );
    });

    describe('Video Message Tests', () => {
        test(
            'should send video from URL',
            async () => {
                const result = await client?.sendVideoMessage(
                    TEST_RECIPIENT,
                    'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
                    { caption: 'Video from URL' }
                );

                expect(result).toBeDefined();
                await sleep(3000);
            },
            TIMEOUT
        );

        test(
            'should send video as GIF from buffer',
            async () => {
                const videoBuffer = readFileSync(path.join(__dirname, 'test-assets/test-video.mp4'));

                const result = await client?.sendVideoMessage(TEST_RECIPIENT, videoBuffer, {
                    caption: 'Video as GIF playback',
                    sendAsGifPlayback: true,
                    filename: 'test-video.mp4',
                });

                expect(result).toBeDefined();
                await sleep(3000);
            },
            TIMEOUT
        );

        test(
            'should send regular video from buffer',
            async () => {
                const videoBuffer = readFileSync(path.join(__dirname, 'test-assets/test-video.mp4'));

                const result = await client?.sendVideoMessage(TEST_RECIPIENT, videoBuffer, {
                    caption: 'Regular video playback',
                    filename: 'test-video.mp4',
                });

                expect(result).toBeDefined();
                await sleep(3000);
            },
            TIMEOUT
        );
    });

    describe('Audio Message Tests', () => {
        test(
            'should send audio file',
            async () => {
                const audioBuffer = readFileSync(path.join(__dirname, 'test-assets/test-audio.mp3'));

                const result = await client?.sendAudioMessage(TEST_RECIPIENT, audioBuffer, {
                    filename: 'test-audio.mp3',
                    mimetype: 'audio/mpeg',
                    seconds: 10,
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );

        test(
            'should send voice note (PTT)',
            async () => {
                const voiceBuffer = readFileSync(path.join(__dirname, 'test-assets/test-voice.ogg'));

                const result = await client?.sendAudioMessage(TEST_RECIPIENT, voiceBuffer, {
                    mimetype: 'audio/ogg; codecs=opus',
                    seconds: 5,
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );
    });

    describe('Document Message Tests', () => {
        test(
            'should send PDF from URL',
            async () => {
                const result = await client?.sendFileMessage(
                    TEST_RECIPIENT,
                    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    {
                        caption: 'PDF Document',
                        mimetype: 'application/pdf',
                    }
                );

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );

        test(
            'should send DOCX from buffer',
            async () => {
                const docBuffer = readFileSync(path.join(__dirname, 'test-assets/test-document.docx'));

                const result = await client?.sendFileMessage(TEST_RECIPIENT, docBuffer, {
                    caption: 'Word Document',
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    filename: 'test-document.docx',
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );

        test(
            'should send Excel with thumbnail',
            async () => {
                const excelBuffer = readFileSync(path.join(__dirname, 'test-assets/test-spreadsheet.xlsx'));
                const thumbnailBuffer = readFileSync(path.join(__dirname, 'test-assets/excel-thumbnail.jpg'));

                const result = await client?.sendFileMessage(TEST_RECIPIENT, excelBuffer, {
                    caption: 'Excel Spreadsheet with Thumbnail',
                    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    filename: 'test-spreadsheet.xlsx',
                    jpegThumbnailSrc: thumbnailBuffer,
                });

                expect(result).toBeDefined();
                await sleep(2000);
            },
            TIMEOUT
        );
    });

    describe('Sticker Message Tests', () => {
        test(
            'should send sticker from URL',
            async () => {
                const result = await client?.sendStickerMessage(TEST_RECIPIENT, 'https://example.com/sticker.webp');

                expect(result).toBeDefined();
                await sleep(1000);
            },
            TIMEOUT
        );

        test(
            'should send sticker from buffer',
            async () => {
                const stickerBuffer = readFileSync(path.join(__dirname, 'test-assets/test-sticker.webp'));

                const result = await client?.sendStickerMessage(TEST_RECIPIENT, stickerBuffer);

                expect(result).toBeDefined();
                await sleep(1000);
            },
            TIMEOUT
        );
    });

    describe('Message Receiving Tests', () => {
        test(
            'should receive messages callback',
            (done) => {
                const testClient = new WhatsappSocket({
                    ...TEST_CONFIG,
                    onReceiveMessages: async (messages, type) => {
                        logger.info(null, `📨 Received ${messages?.length} messages (${type})`);

                        expect(messages).toBeDefined();
                        expect(Array.isArray(messages)).toBe(true);
                        expect(type).toBeDefined();

                        done();
                    },
                });

                // Send a message to ourselves to trigger the callback
                testClient.sendTextMessage(TEST_RECIPIENT, 'Test message for callback');
            },
            TIMEOUT
        );
    });

    describe('Error Handling Tests', () => {
        test(
            'should handle invalid recipient gracefully',
            async () => {
                await expect(client?.sendTextMessage('invalid-number', 'Test message')).rejects.toThrow();
            },
            TIMEOUT
        );

        test(
            'should handle missing file gracefully',
            async () => {
                await expect(
                    client?.sendImageMessage(TEST_RECIPIENT, readFileSync('non-existent-file.jpg'))
                ).rejects.toThrow();
            },
            TIMEOUT
        );
    });

    describe('Connection Status Tests', () => {
        test('should report connected status', () => {
            expect(client?.isConnected()).toBe(true);
        });

        test(
            'should handle connection status changes',
            (done) => {
                let statusChanged = false;

                const testClient = new WhatsappSocket({
                    ...TEST_CONFIG,
                    onConnectionStatusChange: async (status) => {
                        logger.info(null, `Connection status changed to: ${status}`);
                        statusChanged = true;

                        if (statusChanged) {
                            done();
                        }
                    },
                });

                testClient.startConnection({ connectionAttempts: 1 });
            },
            TIMEOUT
        );
    });
});
