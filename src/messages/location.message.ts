import { type WASocket } from '@fadzzzslebew/baileys';
import type { Logger } from 'stack-trace-logger';
import type { LocationMessageProps } from './messages.decs.ts';

export async function sendLocationMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    { latitude, longitude, name, address }: LocationMessageProps
): Promise<any> {
    if (latitude === undefined || longitude === undefined) {
        throw new Error('sendLocation: latitude and longitude are required fields.');
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
        throw new Error('sendLocation: latitude must be between -90 and 90.');
    }
    if (longitude < -180 || longitude > 180) {
        throw new Error('sendLocation: longitude must be between -180 and 180.');
    }

    if (debug) {
        logger?.debug('WHATSAPP', 'send location message', {
            jid,
            latitude,
            longitude,
            name,
            address,
        });
    }

    return socket?.sendMessage(jid, {
        location: {
            degreesLatitude: latitude,
            degreesLongitude: longitude,
            ...(name && { name }),
            ...(address && { address }),
        },
    });
}
