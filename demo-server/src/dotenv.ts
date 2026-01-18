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
export const USE_MONGODB_STORAGE = myEnv.parsed?.USE_MONGODB_STORAGE as string;
export const AWS_ACCESS_KEY_ID = myEnv.parsed?.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = myEnv.parsed?.AWS_SECRET_ACCESS_KEY as string;
export const AWS_REGION = myEnv.parsed?.AWS_REGION as string;
export const AWS_ENDPOINT = myEnv.parsed?.AWS_ENDPOINT as string;
export const BUCKET = myEnv.parsed?.BUCKET as string;
export const BUCKET_ACL = myEnv.parsed?.BUCKET_ACL as string;
export const LOCALSTACK = +((myEnv.parsed?.LOCALSTACK as string) ?? '0');
export const USE_AWS = +((myEnv.parsed?.USE_AWS as string) ?? '0');
logger.info('SYSTEM', 'env', myEnv.parsed);
