import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { awsService } from '../services/aws.service';

const PresignedUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const parsed = PresignedUrlSchema.safeParse(JSON.parse(event.body));

    if (!parsed.success) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Invalid request body', details: parsed.error }),
      };
    }

    const { fileName, contentType } = parsed.data;

    const key = `uploads/${uuidv4()}/${fileName}`;

    const url = await awsService.getPresignedPutUrl(key, contentType, 300);

    const response: APIGatewayProxyResult = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        uploadUrl: url,
        url,
        key,
      }),
    };

    return response;

  } catch (error) {
    console.error('[Presigned URL Handler] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Failed to generate presigned URL' }),
    };
  }
};
