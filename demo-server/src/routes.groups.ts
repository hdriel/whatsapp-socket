import { MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import path from 'pathe';
import express, { type Request, type Response } from 'express';
import { Server as SocketIO } from 'socket.io';
import logger from './logger';
// import { WhatsappSocketGroup } from '@hdriel/whatsapp-socket';
import { WhatsappSocketGroup } from '../../src';
import { uploadImage, uploadVideo, uploadAudio, uploadFile } from './upload';
const fileAuthPath = path.resolve(__dirname, '../..', 'authState/my-profile');

export const initRouterGroups = (io: SocketIO) => {
    const was = new WhatsappSocketGroup({
        mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
        fileAuthStateDirectoryPath: fileAuthPath,
        appName: 'whatsapp-socket-demo',
        debug: true,
        logger,
    });

    async function updateClientGroups(io: SocketIO) {
        if (!was.isConnected()) return;
        const groups = await was.getAllGroups().catch((reason) => {
            logger.warn(null, 'failed to get groups', { reason });
            return [];
        });

        io.emit('groups', groups);
    }

    const router = express.Router();

    io.on('connection', (socket) => {
        logger.info(socket.id, 'Socket connection connected!');

        socket.on('groups', async () => {
            if (!was.isConnected()) return;
            return updateClientGroups(io);

            /*
            const groups = [
                {
                    "id": "120363423282807100@g.us",
                    "addressingMode": "lid",
                    "subject": "st-logger",
                    "subjectOwner": "972559803211@s.whatsapp.net",
                    "subjectOwnerLid": "150087984513026@lid",
                    "subjectTime": 1767217700,
                    "size": 1,
                    "creation": 1767217700,
                    "owner": "972559803211@s.whatsapp.net",
                    "ownerLid": "150087984513026@lid",
                    "descOwner": "",
                    "descOwnerLid": "",
                    "restrict": false,
                    "announce": false,
                    "isCommunity": false,
                    "isCommunityAnnounce": false,
                    "joinApprovalMode": false,
                    "memberAddMode": false,
                    "participants": [
                        {
                            "id": "150087984513026@lid",
                            "jid": "972559803211@s.whatsapp.net",
                            "admin": "superadmin"
                        }
                    ]
                }
            ]
            */
        });
    });

    router.post(['/', '/:groupId'], async (req: Request, res: Response) => {
        const groupId = req.params.groupId !== 'undefined' ? req.params.groupId : '';
        const { name, description, addParticipants, removeParticipants } = req.body;
        logger.info(null, `${groupId ? 'Updating' : 'Creating'} group...`, req.body);

        if (groupId) {
            try {
                name && (await was.updateGroupName(groupId, name));
                // description && (await was.updateGroupDescription(groupId, description));
                addParticipants?.length && (await was.addParticipants(groupId, addParticipants));
                removeParticipants?.length && (await was.removeParticipants(groupId, removeParticipants));
                res.status(200).json({ message: 'OK' });
            } catch (error: any) {
                const errMsg = error?.message ?? error;
                logger.error(null, 'failed to update group', { error: errMsg });
                res.status(403).json({ message: errMsg });
            }
        } else {
            await was
                .createGroup({ name, description, participants: addParticipants.length ? addParticipants : [] })
                .then(() => {
                    res.status(200).json({ message: 'OK' });
                })
                .then(() => {
                    return updateClientGroups(io);
                })
                .catch((error) => {
                    const errMsg = error?.message ?? error;
                    logger.error(null, 'failed to create group', { error: errMsg });
                    res.status(403).json({ message: errMsg });
                });
        }
    });

    router.post('/:groupId/send-message', async (req: Request, res: Response) => {
        const groupId = req.params.groupId;
        const { message } = req.body;
        logger.info(null, 'Sending message...', req.body);

        // Example for using singleton instance value for same appName key
        const was = new WhatsappSocketGroup({
            appName: 'whatsapp-socket-demo',
            fileAuthStateDirectoryPath: fileAuthPath,
        });
        await was.sendTextMessage(groupId, message);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/:groupId/send-message-actions', async (req: Request, res: Response) => {
        // const code = WhatsappSocket.randomPairingCode('[a-z0-9]');
        const groupId = req.params.groupId;
        const { message, subtitle, actions } = req.body;
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

        await was.sendButtonsMessage(groupId, {
            title: message || 'שדה חובה! שכחת למלא אותו בטופס',
            subtitle,
            buttons: buttons as any,
        });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/:groupId/send-multiple-inputs', async (req: Request, res: Response) => {
        const groupId = req.params.groupId;
        const { message: title, subtitle, inputs } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendReplyButtonsMessage(groupId, { title, subtitle, buttons: inputs });

        res.status(200).json({ message: 'OK' });
    });

    // router.post('/:groupId/upload-sticker', uploadSticker.single('sticker'), async (req: Request, res: Response) => {
    //     const stickerFile = req.file;
    //     if (!stickerFile) {
    //         res.status(400).json({ message: 'No sticker file provided' });
    //         return;
    //     }
    //
    //     const { phoneTo } = req.body;
    //     logger.info(null, 'Sending message...', { ...req.body });
    //
    //     await was.sendStickerMessage(phoneTo, stickerFile.buffer);
    //
    //     res.status(200).json({ message: 'OK' });
    // });

    router.post('/:groupId/upload-image', uploadImage.single('image'), async (req: Request, res: Response) => {
        const groupId = req.params.groupId;
        const imageFile = req.file;
        if (!imageFile) {
            res.status(400).json({ message: 'No image file provided' });
            return;
        }

        const { message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendImageMessage(groupId, imageFile.buffer, { caption: message });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/:groupId/upload-video', uploadVideo.single('video'), async (req: Request, res: Response) => {
        const groupId = req.params.groupId;
        const videoFile = req.file;
        if (!videoFile) {
            res.status(400).json({ message: 'No video file provided' });
            return;
        }

        const { message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendVideoMessage(groupId, videoFile.buffer, message);

        res.status(200).json({ message: 'OK' });
    });

    router.post('/:groupId/upload-audio', uploadAudio.single('audio'), async (req: Request, res: Response) => {
        const groupId = req.params.groupId;
        const audioFile = req.file;
        if (!audioFile) {
            res.status(400).json({ message: 'No audio file provided' });
            return;
        }

        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendAudioMessage(groupId, audioFile.buffer, {
            // filename: audioFile.originalname,
            // mimetype: audioFile.mimetype,
        });

        res.status(200).json({ message: 'OK' });
    });

    router.post('/:groupId/upload-file', uploadFile.single('file'), async (req: Request, res: Response) => {
        const groupId = req.params.groupId;
        const docFile = req.file;
        if (!docFile) {
            res.status(400).json({ message: 'No document file provided' });
            return;
        }

        // const { message } = req.body;
        logger.info(null, 'Sending message...', { ...req.body });

        await was.sendDocumentMessage(
            groupId,
            docFile.buffer,
            docFile.originalname
            //{
            // filename: docFile.originalname,
            // mimetype: docFile.mimetype,
            // caption: message,
            // jpegThumbnailSrc: '',
            //}
        );

        res.status(200).json({ message: 'OK' });
    });

    return router;
};
