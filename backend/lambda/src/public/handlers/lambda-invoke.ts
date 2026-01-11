import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { llmService } from '../../services/llm.service';

export const handler: APIGatewayProxyHandler = async (event: any) => {
  try {
    console.log('[Lambda Invoke Handler] Received event:', JSON.stringify(event).substring(0, 500));

    const path = event.path || '/';
    const body = event.body ? JSON.parse(event.body) : {};

    console.log('[Lambda Invoke Handler] Path:', path, 'Body:', JSON.stringify(body).substring(0, 200));

    if (path === '/ai/analyze') {
      const { requirements, internalNotes, internalScores, clientFeedback } = body;
      
      const gapAnalysis = await llmService.analyzeGaps(
        requirements,
        internalNotes,
        internalScores,
        clientFeedback
      );

      console.log('[Lambda Invoke Handler] Gap analysis result:', JSON.stringify(gapAnalysis).substring(0, 200));
      return successResponse(gapAnalysis);
    }

    if (path === '/ai/normalize-notes') {
      const { text } = body;
      const normalized = await llmService.normalizeInternalNotes(text || '');
      return successResponse({ summary: normalized });
    }

    if (path === '/ai/normalize-scores') {
      const { text } = body;
      const normalized = await llmService.normalizeScores(text || '');
      return successResponse(normalized);
    }

    if (path === '/ai/normalize-feedback') {
      const { text } = body;
      const normalized = await llmService.normalizeClientFeedback(text || '');
      return successResponse({ summary: normalized });
    }

    if (path === '/ai/standardize-requirements') {
      const { text } = body;
      const standardized = await llmService.standardizeRequirements(text || '');
      return successResponse({ standardized });
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error: any) {
    console.error('[Lambda Invoke Handler] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || String(error) }),
    };
  }
};

function successResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}
