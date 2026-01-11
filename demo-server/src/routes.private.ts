import { MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import path from 'pathe';
import express, { type Request, type Response } from 'express';
import { Server as SocketIO } from 'socket.io';
import logger from './logger';
import { WhatsappSocket } from './whatsapp-socket';
import { uploadImage, uploadVideo, uploadAudio, uploadFile, uploadSticker } from './upload';
const fileAuthPath = path.resolve(__dirname, '../..', 'authState/my-profile');

export const initRouterPrivate = (_io: SocketIO) => {
    const was = new WhatsappSocket({
        mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
        fileAuthStateDirectoryPath: fileAuthPath,
        appName: 'whatsapp-socket-demo',
    });

    const router = express.Router();

    router.post('/send-message', async (req: Request, res: Response) => {
        const { phoneTo, message } = req.body;
        logger.info(null, 'Sending message...', req.body);

        // Example for using singleton instance value for same appName key
        const was = new WhatsappSocket({ appName: 'whatsapp-socket-demo', fileAuthStateDirectoryPath: fileAuthPath });
        await was.sendTextMessage(phoneTo, message);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/send-message-actions', async (req: Request, res: Response) => {
        // const code = WhatsappSocket.randomPairingCode('[a-z0-9]');
        const { phoneTo: phone, message, subtitle, actions } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        const buttons = [];
        if (actions?.urlLink?.[1]) buttons.push({ label: actions.urlLink[0] ?? 'link', url: actions.urlLink[1] });
        if (actions?.copyButton?.[1])
            buttons.push({ label: actions.copyButton[0] ?? 'copy', copy: actions.copyButton[1] });
        if (actions?.callTo?.[1]) buttons.push({ label: actions.callTo[0] ?? 'tel', tel: actions.callTo[1] });
        if (actions?.email?.[1]) buttons.push({ label: actions.email[0] ?? 'email', email: actions.email[1] });
        if (actions?.reminder?.[1])
            buttons.push({
                label: actions.reminder[0] ?? 'reminder',
                reminderName: 'reminder name',
                reminderOn: '20m',
                // reminderDate: actions.reminder[1],
            });

        if (!buttons.length) {
            res.status(403).json({ message: 'Missing button actions' });
            return;
        }

        await was.sendButtonsMessage(phone, {
            title: message || 'שדה חובה! שכחת למלא אותו בטופס',
            subtitle,
            buttons: buttons as any,
        });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/send-multiple-inputs', async (req: Request, res: Response) => {
        // const code = WhatsappSocket.randomPairingCode('[a-z0-9]');
        const { phoneTo, message: title, subtitle, inputs } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendReplyButtonsMessage(phoneTo, { title, subtitle, buttons: inputs });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/upload-sticker', uploadSticker.single('sticker'), async (req: Request, res: Response) => {
        const stickerFile = req.file;
        if (!stickerFile) {
            res.status(400).json({ message: 'No sticker file provided' });
            return;
        }

        const { phoneTo } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendStickerMessage(phoneTo, stickerFile.buffer);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/upload-image', uploadImage.single('image'), async (req: Request, res: Response) => {
        const imageFile = req.file;
        if (!imageFile) {
            res.status(400).json({ message: 'No image file provided' });
            return;
        }

        const { phoneTo, message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendImageMessage(phoneTo, imageFile.buffer, { caption: message, filename: imageFile.originalname });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/upload-video', uploadVideo.single('video'), async (req: Request, res: Response) => {
        const videoFile = req.file;
        if (!videoFile) {
            res.status(400).json({ message: 'No video file provided' });
            return;
        }

        const { phoneTo, message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendVideoMessage(phoneTo, videoFile.buffer, message);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/upload-audio', uploadAudio.single('audio'), async (req: Request, res: Response) => {
        const audioFile = req.file;
        if (!audioFile) {
            res.status(400).json({ message: 'No audio file provided' });
            return;
        }

        const { phoneTo } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendAudioMessage(phoneTo, audioFile.buffer, {
            filename: audioFile.originalname,
            mimetype: audioFile.mimetype,
        });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/upload-file', uploadFile.single('file'), async (req: Request, res: Response) => {
        const docFile = req.file;
        if (!docFile) {
            res.status(400).json({ message: 'No document file provided' });
            return;
        }

        const { phoneTo, message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendFileMessage(phoneTo, docFile.buffer, {
            filename: docFile.originalname,
            mimetype: docFile.mimetype,
            caption: message,
            // jpegThumbnailSrc: '',
        });

        res.status(200).json({ message: 'OK' });
    });

    return router;
};
