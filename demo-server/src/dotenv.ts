import dotenv from 'dotenv';
import path from 'pathe';
import { expand } from 'dotenv-expand';
import logger from './logger';

const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env.local');
logger.info('SYSTEM', `Starting dotenv: ${ENV_FILE_PATH}`);

const myEnv = dotenv.config({ path: ENV_FILE_PATH });
expand(myEnv);

export default myEnv.parsed;

export const MONGODB_URI = myEnv.parsed?.MONGODB_URI as string;
export const USE_MONGODB_STORAGE = +((myEnv.parsed?.USE_MONGODB_STORAGE as string) ?? '0');
logger.info('SYSTEM', 'env', myEnv.parsed);
