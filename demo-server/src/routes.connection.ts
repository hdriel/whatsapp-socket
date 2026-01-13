import { MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import path from 'pathe';
import express, { type Request, type Response } from 'express';
import { Server as SocketIO } from 'socket.io';
import logger from './logger';
import { WhatsappSocket } from './whatsapp-socket';
const fileAuthPath = path.resolve(__dirname, '../..', 'authState/my-profile');

export const initRouterConnection = (io: SocketIO) => {
    const was = new WhatsappSocket({
        mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
        fileAuthStateDirectoryPath: fileAuthPath,
        appName: 'whatsapp-socket-demo',
        logger,
        printQRInTerminal: true,
        debug: true,
        onConnectionStatusChange: (status) => {
            io.emit('connection-status', status);
        },
        onQR: async (qr: string, qrCode: string | null | undefined) => {
            logger.info(null, 'generated new QR CODE/IMAGE', { qrImage: !!qr, qrCode: !!qrCode });
            const qrImage = await WhatsappSocket.qrToImage(qr).catch(() => null);
            io.emit('qr', { qrImage, qrCode });
        },
        onOpen: () => {
            io.emit('qr-connected');
        },
        onClose: () => {
            io.emit('qr-connected');
        },
        // onReceiveMessages: console.log,
        onPreConnectionSendMessageFailed: console.error,
    });
    was.startConnection()
        .then(() => {
            const connected = was.isConnected();
            io.emit('connection-status', connected ? 'open' : 'close');
        })
        .catch(() => null);

    const router = express.Router();

    router.post('/connect', async (_req: Request, res: Response) => {
        logger.info(null, 'connecting to whatsapp-socket client');
        await was.startConnection().catch(() => null);
        res.status(200).json({ message: 'OK' });
    });

    router.post('/disconnect', async (_req: Request, res: Response) => {
        logger.info(null, 'disconnect to whatsapp-socket client');
        await was.closeConnection();
        res.status(200).json({ message: 'OK' });
    });

    router.post('/generate-qr', async (req: Request, res: Response) => {
        const { phone } = req.body;
        logger.info(null, 'reset connection and create new QR image/code', { pairingPhone: phone });

        await was.resetConnection({ pairingPhone: phone }).catch(() => null);

        res.status(200).json({ message: 'OK' });
    });

    return router;
};
