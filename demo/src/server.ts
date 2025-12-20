import { MONGODB_URI } from './dotenv';
import express, { Express, json, urlencoded, type Request, type Response } from 'express';
export const app: Express = express();
import logger from './logger';
import path from 'pathe';
import http, { Server as HttpServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { WhatsappSocketClient } from '@hdriel/whatsapp-socket';

const server: HttpServer = http.createServer(app);
const io = new SocketIO(server);
const was = new WhatsappSocketClient({
    mongoURL: MONGODB_URI,
    logger,
    printQRInTerminal: true,
    debug: true,
    onQR: async (qr) => {
        const qrImage = await WhatsappSocketClient.qrToImage(qr);
        io.emit('qr', qrImage);
    },
});

const router = express.Router();

{
    router.post('/connect', async (_req: Request, res: Response) => {
        was.startConnection();
        res.status(200).json({ message: 'OK' });
    });

    router.post('/disconnect', async (_req: Request, res: Response) => {
        await was.closeConnection();
        res.status(200).json({ message: 'OK' });
    });

    router.post('/reset', async (_req: Request, res: Response) => {
        was.resetConnection();
        res.status(200).json({ message: 'OK' });
    });

    router.post('/send-message', async (req: Request, res: Response) => {
        const { phone, message } = req.body;
        await was.sendTextMessage(phone, message);
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
app.listen(PORT, () => {
    logger.info(null, 'server is up', { port: PORT });
});
