import {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_ENDPOINT,
    BUCKET,
    BUCKET_ACL,
    LOCALSTACK,
} from './dotenv';
import { S3Util, S3LocalstackUtil, ACLs } from '@hdriel/aws-utils';
import logger from './logger';

export { S3Util } from '@hdriel/aws-utils';

export const s3Util = LOCALSTACK
    ? new S3LocalstackUtil({
          accessKeyId: AWS_ACCESS_KEY_ID,
          region: AWS_REGION,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
          endpoint: AWS_ENDPOINT,
          bucket: BUCKET,
          logger,
      })
    : new S3Util({
          accessKeyId: AWS_ACCESS_KEY_ID,
          region: AWS_REGION,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
          endpoint: AWS_ENDPOINT,
          bucket: BUCKET,
          logger,
      });

s3Util.initBucket(BUCKET_ACL as ACLs);
