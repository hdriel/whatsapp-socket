import { MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import path from 'pathe';
import express, { type Request, type Response } from 'express';
import { Server as SocketIO } from 'socket.io';
import logger from './logger';
// import { WhatsappSocket } from '@hdriel/whatsapp-socket';
import { WhatsappSocket } from '../../src';

export const initRouters = (io: SocketIO) => {
    const was = new WhatsappSocket({
        mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
        fileAuthStateDirectoryPath: path.resolve(__dirname, '../..', 'authState/my-profile'),
        logger,
        printQRInTerminal: true,
        customPairingCode: 'a',
        debug: true,
        onConnectionStatusChange: (status) => {
            io.emit('connection-status', status);
        },
        onQR: async (qr: string, qrCode: string | null | undefined) => {
            logger.info(null, 'generated new QR CODE/IMAGE', { qrImage: !!qr, qrCode: !!qrCode });
            const qrImage = await WhatsappSocket.qrToImage(qr).catch(() => null);
            io.emit('qr', { qrImage, qrCode });
        },
        onOpen: async () => {
            io.emit('qr-connected');
        },
        onClose: async () => {
            io.emit('qr-connected');
        },
    });
    was.startConnection().catch(() => null);

    const router = express.Router();

    router.post('/api/connect', async (_req: Request, res: Response) => {
        logger.info(null, 'connecting to whatsapp-socket client');
        await was.startConnection().catch(() => null);
        res.status(200).json({ message: 'OK' });
    });

    router.post('/api/disconnect', async (_req: Request, res: Response) => {
        logger.info(null, 'disconnect to whatsapp-socket client');
        await was.closeConnection();
        res.status(200).json({ message: 'OK' });
    });

    router.post('/api/generate-qr', async (req: Request, res: Response) => {
        const { phone } = req.body;
        logger.info(null, 'reset connection and create new QR image/code', { peering: phone });

        await was.resetConnection({ pairingPhone: phone }).catch(() => null);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/api/send-message', async (req: Request, res: Response) => {
        const code = WhatsappSocket.randomPairingCode('[a-z0-9]');
        const { phoneTo, message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body, code });

        await was.sendTextMessage(phoneTo, message);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/api/send-message-actions', async (req: Request, res: Response) => {
        const code = WhatsappSocket.randomPairingCode('[a-z0-9]');
        const { phone, message, subtitle, tel, url, authCode } = req.body;
        logger.info(null, 'Sending message...', { ...req.body, code });

        const buttons = [];
        if (url) buttons.push({ label: 'קישור לאתר', url });
        if (authCode) buttons.push({ label: 'העתק קוד אישי', copy: code });
        if (tel) buttons.push({ label: 'חיוג למספר', tel });

        if (buttons.length) {
            await was.sendButtonsMessage(phone, {
                title: message || 'שדה חובה! שכחת למלא אותו בטופס',
                subtitle,
                buttons,
            });
        } else {
            await was.sendTextMessage(phone, message);
            // await was.sendReplyButtonsMessage(phone, { title: message, subtitle, buttons: ['junior', 'medium', 'senior'] });
        }

        res.status(200).json({ message: 'OK' });
    });

    return router;
};
