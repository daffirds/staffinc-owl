import { APIGatewayProxyHandler } from 'aws-lambda';
import { awsService } from '../services/aws.service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing body' }),
            };
        }

        const { filename, contentType, folder } = JSON.parse(event.body);

        if (!filename || !contentType) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing filename or contentType' }),
            };
        }

        const validFolders = ['notes', 'scores', 'feedback'];
        const targetFolder = validFolders.includes(folder) ? folder : 'uploads';

        const ext = path.extname(filename);
        const key = `${targetFolder}/${uuidv4()}${ext}`;

        const uploadUrl = await awsService.getPresignedPutUrl(key, contentType);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                uploadUrl,
                key,
            }),
        };
    } catch (error) {
        console.error('Presigned URL Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: String(error) }),
        };
    }
};
