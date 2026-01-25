import express, { Express, json, urlencoded } from 'express';
export const app: Express = express();
import logger from './logger';
import cors from 'cors';
import path from 'pathe';
import http, { Server as HttpServer } from 'http';
import { initRouterConnection } from './routes.connection';
import { initRouterPrivate } from './routes.private';
import { initRouterGroups } from './routes.groups';
import { Server as SocketIO } from 'socket.io';
import { USE_AWS } from './dotenv';

const server: HttpServer = http.createServer(app);
const io = new SocketIO(server, {
    cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true },
});

io.on('connection', (socket) => {
    logger.info(socket.id, 'Socket connection connected!');
    socket.emit('connected');
    io.emit('qr-connected');
});

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../demo-client/dist')));
app.use('/api', initRouterConnection(io));
app.use('/api/private', initRouterPrivate(io));
app.use('/api/groups', initRouterGroups(io));
if (USE_AWS) {
    import('./routes.aws').then(({ initRouterAWS }) => {
        app.use('/api/aws', initRouterAWS(io));
    });
}

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
