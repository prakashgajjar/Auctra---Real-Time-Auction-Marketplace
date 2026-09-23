import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';

let s3Client = null;

if (config.aws.accessKeyId && config.aws.secretAccessKey) {
  s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

export async function generatePresignedUploadUrl({ filename, fileType, sellerId }) {
  const extension = filename.split('.').pop() || 'jpg';
  const fileKey = `auctions/${sellerId}/${uuidv4()}.${extension}`;

  if (s3Client) {
    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      publicUrl,
      fileKey,
      mode: 'S3_PRESIGNED',
    };
  }

  // Graceful Local / Development Mock Fallback
  return {
    uploadUrl: `http://localhost:${config.port}/api/v1/upload/mock-receiver?key=${encodeURIComponent(fileKey)}`,
    publicUrl: `/images/${filename.includes('porsche') ? 'classic_porsche.jpg' : filename.includes('art') ? 'contemporary_art.jpg' : 'rolex_daytona.jpg'}`,
    fileKey,
    mode: 'DEV_MOCK',
    note: 'Configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env for direct S3 uploads.',
  };
}
