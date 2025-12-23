import { MONGODB_URI } from './dotenv';
import express, { Express, json, urlencoded, type Request, type Response } from 'express';
export const app: Express = express();
import logger from './logger';
import path from 'pathe';
import http, { Server as HttpServer } from 'http';
import { Server as SocketIO } from 'socket.io';
// import { WhatsappSocketClient } from '@hdriel/whatsapp-socket';
import { WhatsappSocketClient } from '../../src';

const server: HttpServer = http.createServer(app);
const io = new SocketIO(server);

io.on('connection', (socket) => {
    logger.info(socket.id, 'Socket connection connected!');
    socket.emit('connected');
    io.emit('qr-connected');
});

const was = new WhatsappSocketClient({
    // mongoURL: MONGODB_URI,
    fileAuthStateDirectoryPath: path.resolve(__dirname, '../..', 'authState/my-profile'),
    logger,
    printQRInTerminal: true,
    customPairingCode: 'a',
    debug: true,
    onQR: async (qr, qrCode) => {
        const qrImage = await WhatsappSocketClient.qrToImage(qr).catch(() => null);
        io.emit('qr', { qrImage, qrCode });
    },
    onOpen: async () => {
        io.emit('qr-connected');
    },
    onClose: async () => {
        io.emit('qr-connected');
    },
});

const router = express.Router();

{
    router.post('/connect', async (_req: Request, res: Response) => {
        was.startConnection().catch(() => null);
        res.status(200).json({ message: 'OK' });
    });

    router.post('/disconnect', async (_req: Request, res: Response) => {
        await was.closeConnection();
        res.status(200).json({ message: 'OK' });
    });

    router.post('/reset', async (req: Request, res: Response) => {
        const { phone } = req.body;
        was.resetConnection({ pairingPhone: phone }).catch(() => null);
        res.status(200).json({ message: 'OK' });
    });

    router.post('/send-message', async (req: Request, res: Response) => {
        // const { phone, message } = req.body;
        // await was.sendTextMessage(phone, message);
        const { phone } = req.body;
        await was.sendButtonsMessage(phone);
        res.status(200).json({ message: 'OK' });
    });
}

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/', router);

app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
    logger.error(null, 'request error', {
        errorMsg: err.message,
        errorName: err.name,
        stackTraceLines: 3,
    });
    res.status(500).json({ message: err.message });
});

const PORT = 1010;
server.listen(PORT, () => {
    logger.info(null, 'server is up', { port: PORT });
});
