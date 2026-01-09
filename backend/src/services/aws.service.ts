import {
    S3Client,
    PutObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
} from '@aws-sdk/client-s3';
import {
    TextractClient,
    DetectDocumentTextCommand,
    StartDocumentTextDetectionCommand,
    GetDocumentTextDetectionCommand,
} from '@aws-sdk/client-textract';

class AWSService {
    private s3Client: S3Client;
    private textractClient: TextractClient;
    private bucketName: string;

    constructor() {
        const endpoint = process.env.AWS_ENDPOINT_URL || undefined;
        const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
        const credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        };

        this.s3Client = new S3Client({
            endpoint,
            region,
            credentials,
            forcePathStyle: true, // Required for localstack
        });

        this.textractClient = new TextractClient({
            endpoint,
            region,
            credentials,
        });

        this.bucketName = process.env.AWS_S3_BUCKET || 'recruitment-docs';
    }

    async uploadFile(fileBuffer: Buffer, objectName: string): Promise<string | null> {
        try {
            // Check if bucket exists, create if not (for localstack convenience)
            try {
                await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
            } catch {
                await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
            }

            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: objectName,
                    Body: fileBuffer,
                })
            );

            return `s3://${this.bucketName}/${objectName}`;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    }

    async extractText(fileBytes: Buffer, fileExt: string): Promise<string> {
        try {
            if (['.jpg', '.jpeg', '.png'].includes(fileExt.toLowerCase())) {
                const response = await this.textractClient.send(
                    new DetectDocumentTextCommand({
                        Document: { Bytes: fileBytes },
                    })
                );

                let text = '';
                for (const block of response.Blocks || []) {
                    if (block.BlockType === 'LINE' && block.Text) {
                        text += block.Text + '\n';
                    }
                }
                return text;
            } else if (fileExt.toLowerCase() === '.pdf') {
                // For PDF, we need to upload to S3 first
                return 'PDF Extraction requires S3 upload first. Please use extractTextFromS3.';
            }

            return '';
        } catch (error) {
            console.error('Error extracting text:', error);
            return `Error extracting text: ${String(error)}`;
        }
    }

    async extractTextFromS3(s3Key: string): Promise<string> {
        try {
            const ext = s3Key.substring(s3Key.lastIndexOf('.')).toLowerCase();

            if (ext === '.pdf') {
                // Start Async Job
                const startResponse = await this.textractClient.send(
                    new StartDocumentTextDetectionCommand({
                        DocumentLocation: {
                            S3Object: {
                                Bucket: this.bucketName,
                                Name: s3Key,
                            },
                        },
                    })
                );

                const jobId = startResponse.JobId;
                if (!jobId) {
                    return 'Failed to start Textract job';
                }

                // Poll for completion (Not ideal for production, but fine for MVP)
                const maxRetries = 20;
                for (let i = 0; i < maxRetries; i++) {
                    await this.sleep(2000);

                    const statusResponse = await this.textractClient.send(
                        new GetDocumentTextDetectionCommand({ JobId: jobId })
                    );

                    const status = statusResponse.JobStatus;

                    if (status === 'SUCCEEDED') {
                        let text = '';
                        for (const block of statusResponse.Blocks || []) {
                            if (block.BlockType === 'LINE' && block.Text) {
                                text += block.Text + '\n';
                            }
                        }
                        return text;
                    } else if (status === 'FAILED') {
                        return 'Textract Job Failed';
                    }
                }

                return 'Textract Job Timed Out';
            } else {
                // For images in S3
                const response = await this.textractClient.send(
                    new DetectDocumentTextCommand({
                        Document: {
                            S3Object: {
                                Bucket: this.bucketName,
                                Name: s3Key,
                            },
                        },
                    })
                );

                let text = '';
                for (const block of response.Blocks || []) {
                    if (block.BlockType === 'LINE' && block.Text) {
                        text += block.Text + '\n';
                    }
                }
                return text;
            }
        } catch (error) {
            return `Error processing S3 file: ${String(error)}`;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const awsService = new AWSService();
