import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { llmService } from '../../services/llm.service';

const AiAnalyzeSchema = z.object({
  requirements: z.string(),
  internalNotes: z.string(),
  internalScores: z.record(z.number()),
  clientFeedback: z.string()
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return errorResponse(400, 'Request body is required');
    }

    const parsed = AiAnalyzeSchema.safeParse(JSON.parse(event.body));

    if (!parsed.success) {
      return errorResponse(400, 'Invalid request body', parsed.error);
    }

    const { requirements, internalNotes, internalScores, clientFeedback } = parsed.data;

    const gapAnalysis = await llmService.analyzeGaps(
      requirements,
      internalNotes,
      internalScores,
      clientFeedback
    );

    return successResponse(gapAnalysis);

  } catch (error: any) {
    console.error('[AI Analyze Handler] Error:', error);
    return errorResponse(500, 'Analysis failed', error.message);
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
