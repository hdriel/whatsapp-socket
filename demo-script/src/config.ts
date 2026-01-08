import { MY_PHONE, MONGODB_URI, USE_MONGODB_STORAGE } from './dotenv';
import logger from './logger';
import { FILE_AUTH_PATH } from './paths';

export const TEST_RECIPIENT = MY_PHONE;
export const TEST_CONFIG = {
    mongoURL: USE_MONGODB_STORAGE ? MONGODB_URI : undefined,
    fileAuthStateDirectoryPath: FILE_AUTH_PATH,
    mongoCollection: 'whatsapp-test-auth',
    appName: 'WhatsApp Test Bot',
    debug: true,
    logger,
    printQRInTerminal: true,
    pairingPhone: MY_PHONE,
};

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
