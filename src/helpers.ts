import { ReadStream } from 'node:fs';
import ms, { type StringValue } from 'ms';
import type Stream from 'node:stream';
// NOTE: Hidden for Dynamic Import for ESM-only Packages
// import { parseBuffer, parseStream } from 'music-metadata';

export const getTotalSeconds = (msValue: StringValue) => {
    const value = ms(msValue);
    return value / 1000;
};

export async function getUrlBuffer(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
}

async function getDurationFromStream(stream: ReadStream, mimeType?: string): Promise<number> {
    try {
        const { parseStream } = await import('music-metadata');
        const metadata = await parseStream(stream, { mimeType: mimeType || 'audio/mpeg' });
        return Math.floor(metadata.format.duration || 0);
    } catch (error) {
        console.error('Error parsing stream:', error);
        throw error;
    } finally {
        if (!stream.destroyed) {
            stream.destroy();
        }
    }
}

async function getDurationFromBuffer(buffer: Buffer, mimeType?: string): Promise<number> {
    try {
        const { parseBuffer } = await import('music-metadata');
        const metadata = await parseBuffer(buffer, mimeType || 'audio/mpeg').catch(() => null);
        return metadata ? Math.floor(metadata.format.duration || 0) : 0;
    } catch (error) {
        console.error('Error parsing buffer:', error);
        throw error;
    }
}

export async function getAudioFileDuration(audioFile: ReadStream | Buffer, mimeType?: string): Promise<number> {
    if (audioFile instanceof ReadStream) {
        return getDurationFromStream(audioFile, mimeType);
    } else {
        return getDurationFromBuffer(audioFile, mimeType);
    }
}

export async function streamToBuffer(stream: Stream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream as ReadStream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

export function getFilenameFromStream(_stream: Stream): string | undefined {
    // if (stream.path) {
    //     const pathStr = stream.path.toString();
    //     return basename(pathStr);
    // }
    return undefined;
}

export const sleep = (timeout: StringValue | number) => {
    return new Promise((resolve) => setTimeout(resolve, typeof timeout === 'number' ? timeout : ms(timeout)));
};

export const MIME_TYPES: { [key: string]: string } = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',

    // Videos
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    aac: 'audio/aac',
    m4a: 'audio/mp4',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
};

export const MIME_TO_TYPES: { [key: string]: 'Images' | 'Videos' | 'Audio' | 'Documents' } = {
    jpg: 'Images',
    jpeg: 'Images',
    'image/jpeg': 'Images',
    png: 'Images',
    'image/png': 'Images',
    webp: 'Images',
    'image/webp': 'Images',
    bmp: 'Images',
    'image/bmp': 'Images',
    svg: 'Images',
    'image/svg+xml': 'Images',

    // Videos
    gif: 'Videos',
    'image/gif': 'Videos',
    mp4: 'Videos',
    'video/mp4': 'Videos',
    avi: 'Videos',
    'video/x-msvideo': 'Videos',
    mov: 'Videos',
    'video/quicktime': 'Videos',
    mkv: 'Videos',
    'video/x-matroska': 'Videos',
    webm: 'Videos',
    'video/webm': 'Videos',

    // Audio
    mp3: 'Audio',
    'audio/mpeg': 'Audio',
    wav: 'Audio',
    'audio/wav': 'Audio',
    ogg: 'Audio',
    'audio/ogg': 'Audio',
    opus: 'Audio',
    'audio/opus': 'Audio',
    aac: 'Audio',
    'audio/aac': 'Audio',
    m4a: 'Audio',
    'audio/mp4': 'Audio',

    // Documents
    pdf: 'Documents',
    'application/pdf': 'Documents',
    doc: 'Documents',
    'application/msword': 'Documents',
    docx: 'Documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documents',
    xls: 'Documents',
    'application/vnd.ms-excel': 'Documents',
    xlsx: 'Documents',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Documents',
    ppt: 'Documents',
    'application/vnd.ms-powerpoint': 'Documents',
    pptx: 'Documents',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Documents',
    txt: 'Documents',
    'text/plain': 'Documents',
    zip: 'Documents',
    'application/zip': 'Documents',
    rar: 'Documents',
    'application/x-rar-compressed': 'Documents',
    '7z': 'Documents',
    'application/x-7z-compressed': 'Documents',
};
