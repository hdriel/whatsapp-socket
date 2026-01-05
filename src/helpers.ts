import { basename } from 'node:path';
import { ReadStream } from 'node:fs';
import ms, { type StringValue } from 'ms';
// NOTE: Hidden for Dynamic Import for ESM-only Packages
import { parseBuffer, parseStream } from 'music-metadata';

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
        // const { parseStream } = await import('music-metadata');
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
        // const { parseBuffer } = await import('music-metadata');
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

export async function streamToBuffer(stream: ReadStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

export function getFilenameFromStream(stream: ReadStream): string | undefined {
    if (stream.path) {
        const pathStr = stream.path.toString();
        return basename(pathStr);
    }
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
