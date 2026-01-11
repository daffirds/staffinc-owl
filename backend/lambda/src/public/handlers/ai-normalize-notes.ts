import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { llmService } from '../../services/llm.service';

const AiTextSchema = z.object({
  text: z.string().min(1)
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return errorResponse(400, 'Request body is required');
    }

    const parsed = AiTextSchema.safeParse(JSON.parse(event.body));

    if (!parsed.success) {
      return errorResponse(400, 'Invalid request body', parsed.error);
    }

    const { text } = parsed.data;

    const normalized = await llmService.normalizeInternalNotes(text);

    return successResponse({ summary: normalized });

  } catch (error: any) {
    console.error('[AI Normalize Notes Handler] Error:', error);
    return errorResponse(500, 'Normalization failed', error.message);
  }
};

function successResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(data),
  };
}

function errorResponse(statusCode: number, message: string, details?: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({ error: message, details }),
  };
}
