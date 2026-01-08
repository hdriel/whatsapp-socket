import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import logger from './logger';
import { ENV_FILE_PATH } from './paths';

logger.info(null, `Starting dotenv: ${ENV_FILE_PATH}`);

const myEnv = dotenv.config({ path: ENV_FILE_PATH });
expand(myEnv);

export default myEnv.parsed;

export const MONGODB_URI = myEnv.parsed?.MONGODB_URI as string;
export const USE_MONGODB_STORAGE = +((myEnv.parsed?.USE_MONGODB_STORAGE as string) ?? '0');
export const MY_PHONE = (myEnv.parsed?.MY_PHONE as string) || '';
export const TARGET_PHONE = (myEnv.parsed?.TARGET_PHONE as string) || MY_PHONE;

logger.info(null, 'env', myEnv.parsed);
