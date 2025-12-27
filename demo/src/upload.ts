import multer from 'multer';
import bytes from 'bytes';
import { type Request } from 'express';

const storage = multer.memoryStorage();

export const uploadFile = multer({
    storage,
    limits: { fileSize: bytes('500MB') as number },
});

export const uploadImage = multer({
    storage,
    limits: { fileSize: bytes('50MB') as number },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, success?: boolean) => void) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

export const uploadVideo = multer({
    storage,
    limits: { fileSize: bytes('100MB') as number },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, success?: boolean) => void) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    },
});

export const uploadAudio = multer({
    storage,
    limits: { fileSize: bytes('10MB') as number },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, success?: boolean) => void) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    },
});
