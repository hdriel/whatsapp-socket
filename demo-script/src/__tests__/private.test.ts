import logger from '../logger';
import { TEST_RECIPIENT, TEST_CONFIG } from './config';
import { WhatsappSocket } from '@hdriel/whatsapp-socket';
import { MY_PHONE } from '../dotenv';

describe('private messages tests', () => {
    test('send message', (done) => {
        const myMsg = 'Hello send message test!';
        const client = new WhatsappSocket({
            ...TEST_CONFIG,
            onQR: async (_qr: string) => {
                logger.info(null, '📸 QR Code received');
                expect(true).toBe('Authentication failed QR Code received');
            },
            onReceiveMessages: async (messages, type) => {
                logger.info(null, `📨 Received ${messages?.length} messages (${type})`, messages);
                const fromMe = messages[0].key.fromMe;
                expect(fromMe).toBeTruthy();
                const textMsg = messages[0].message.extendedTextMessage?.text;
                expect(textMsg).toBe(myMsg);
                // todo: cleanup message
                done();
            },
        });

        client.sendTextMessage(TEST_RECIPIENT, myMsg);
    });

    test('send Buttons message', (done) => {
        const myMsg = {
            title: 'Hello send message button test!',
            subtitle: 'button subtitle',
            buttons: [
                { label: 'copy code', copy: '123456' },
                { label: 'call to', tel: MY_PHONE },
                { label: 'open url', url: 'https://localhost:3000' },
            ],
        };

        const client = new WhatsappSocket({
            ...TEST_CONFIG,
            onQR: async (_qr: string) => {
                logger.info(null, '📸 QR Code received');
                expect(true).toBe('Authentication failed QR Code received');
            },
            onReceiveMessages: async (messages, type) => {
                // todo: not get here
                logger.info(null, `📨 Received ${messages?.length} messages (${type})`, messages);
                const fromMe = messages[0].key.fromMe;
                expect(fromMe).toBeTruthy();
                const textMsg = messages[0].message.extendedTextMessage?.text;
                expect(textMsg).toBe(myMsg);
                // todo: cleanup message
                done();
            },
        });

        client.sendButtonsMessage(TEST_RECIPIENT, myMsg);
    });
});
