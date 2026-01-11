import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class AWSService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    const region = process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';

    this.s3Client = new S3Client({
      region,
    });

    this.bucketName = process.env.AWS_S3_BUCKET || '';
  }

  async getPresignedPutUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getPresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getFileContent(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const body = response.Body as any;
    return await body.transformToString();
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
    }
  }
}

export const awsService = new AWSService();
