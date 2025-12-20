import express, { Express, json, urlencoded } from 'express';
export const app: Express = express();
import logger from './logger';
import path from 'pathe';

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

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
