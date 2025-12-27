import ms, { type StringValue } from 'ms';
import { parseBuffer, parseStream } from 'music-metadata';
import { ReadStream } from 'node:fs';
import { basename } from 'node:path';

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
