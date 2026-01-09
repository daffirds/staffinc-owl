import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class AWSService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';

        // AWS SDK v3 automatically looks for credentials in env vars or IAM roles
        this.s3Client = new S3Client({
            region,
        });

        this.bucketName = process.env.AWS_S3_BUCKET || 'recruitment-docs';
    }

    /**
     * Generate a Presigned URL for uploading a file (PUT)
     * Frontend uses this URL to upload directly to S3
     */
    async getPresignedPutUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn });
    }

    /**
     * Generate a Presigned URL for reading a file (GET)
     * Used by the AI service to access the file
     */
    async getPresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn });
    }

    /**
     * Helper to verify bucket exists (mostly for local dev/first run)
     */
    async ensureBucketExists(): Promise<void> {
        try {
            await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
        } catch {
            await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        }
    }
}

export const awsService = new AWSService();
