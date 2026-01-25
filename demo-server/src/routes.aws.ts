import { MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import path, { basename } from 'pathe';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Server as SocketIO } from 'socket.io';
import logger from './logger';
import { WhatsappSocket, WhatsappSocketGroup } from './whatsapp-socket';
const fileAuthPath = path.resolve(__dirname, '../..', 'authState/my-profile');
import { s3Util } from './aws.utils';

export const initRouterAWS = (_io: SocketIO) => {
    const router = express.Router();

    router.get('/supported', async (_req: Request, res: Response, _next: NextFunction) => {
        res.sendStatus(200);
    });

    router.get(['/directories/:directory', '/directories'], async (req: Request, res: Response, next: NextFunction) => {
        if (!s3Util) return next(new Error('AWS FEATURE NOT SUPPORTED'));

        try {
            const directory = req.params.directory || '';
            const pageNumber = req.query?.page ? +req.query?.page : undefined;
            const pageSize = req.query?.size ? +req.query?.size : undefined;
            const result = await s3Util?.directoryListPaginated(directory, { pageNumber, pageSize });

            logger.info('AWS', 'get directory file list from directory.', {
                directory,
                pageNumber,
                pageSize,
                totalFetched: result.totalFetched,
            });
            res.json(result);
        } catch (err: any) {
            logger.error('AWS', 'failed on getDirectoryListCtrl', { errMsg: err.message });
            next(err);
        }
    });

    router.get('/directories/:directory/files', async (req: Request, res: Response, next: NextFunction) => {
        if (!s3Util) return next(new Error('AWS FEATURE NOT SUPPORTED'));

        try {
            const directory = req.params?.directory === '/' ? '' : req.params?.directory;
            const pageNumber = req.query?.page ? +req.query?.page : undefined;
            const pageSize = req.query?.size ? +req.query?.size : undefined;

            const result = await s3Util?.directoryList(directory); // get ALL directory keys
            // const result = await s3Util.directoryListPaginated(directory, { pageNumber, pageSize });

            logger.info('AWS', 'get directory file list from directory.', {
                directory,
                pageNumber,
                pageSize,
                // totalFetched: result.totalFetched,
            });
            res.json(result);
        } catch (err: any) {
            logger.error('AWS', 'failed on getDirectoryListCtrl', { errMsg: err.message });
            next(err);
        }
    });

    router.post('/stream-file/:fileKey', async (req: Request, res: Response, next: NextFunction) => {
        if (!s3Util) return next(new Error('AWS FEATURE NOT SUPPORTED'));

        try {
            const fileKey = decodeURIComponent(req.params.fileKey);
            const fileStream = await s3Util?.getObjectFileStream(fileKey);
            if (!fileStream) {
                res.status(400).json({ message: 'No document file found' });
                return;
            }

            const groupId = req.query?.groupId as string;
            const phoneTo = req.query?.phoneTo as string;
            if (!groupId && !phoneTo) {
                res.status(400).json({ message: 'not retrieved defined, groupId or phoneTo number' });
                return;
            }

            const filename = basename(fileKey);
            logger.info(null, 'Sending message...', { ...req.body, ...req.query, filename });

            if (groupId) {
                const was = new WhatsappSocketGroup({
                    mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
                    fileAuthStateDirectoryPath: fileAuthPath,
                    appName: 'whatsapp-socket-demo',
                    debug: true,
                    logger,
                });

                await was.sendFileMessage(groupId, fileStream as any, { filename });
            }

            if (phoneTo) {
                const was = new WhatsappSocket({
                    mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
                    fileAuthStateDirectoryPath: fileAuthPath,
                    appName: 'whatsapp-socket-demo',
                    debug: true,
                    logger,
                });

                await was.sendFileMessage(phoneTo, fileStream as any, { filename });
            }

            res.status(200).json({ message: 'OK' });
        } catch (err: any) {
            logger.error('AWS', 'failed on getObjectFileStream', { errMsg: err.message });
            next(err);
        }
    });

    return router;
};
