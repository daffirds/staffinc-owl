import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { llmService } from '../services/llm.service';
import { handler as healthHandler } from '../handlers/health';
import { handler as presignedHandler } from '../handlers/get-presigned-url';

export const handler: APIGatewayProxyHandler = async (event: any) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key',
        },
        body: '',
      };
    }

    console.log('[AI Handler] Received event:', JSON.stringify(event).substring(0, 500));

    const rawPath = (event as any).rawPath || event.path || '/';
    const stage = event.requestContext?.stage || '';

    let path = rawPath;
    if (stage && rawPath.startsWith('/' + stage)) {
      path = rawPath.replace('/' + stage, '') || '/';
    }

    const body = event.body ? JSON.parse(event.body) : {};

    console.log('[AI Handler] Path:', path, 'Body:', JSON.stringify(body).substring(0, 200));

    // Public health + S3 presigned URL endpoints live here too,
    // so the "public" Lambda can stay outside the VPC.
    if (path === '/' || path === '') {
      return healthHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
    }

    if (path === '/upload/presigned') {
      return presignedHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
    }

    if (path === '/ai/analyze') {
      const { requirements, internalNotes, internalScores, clientFeedback } = body;

      const gapAnalysis = await llmService.analyzeGaps(
        requirements,
        internalNotes,
        internalScores,
        clientFeedback
      );

      console.log('[AI Handler] Gap analysis result:', JSON.stringify(gapAnalysis).substring(0, 200));
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

    if (path === '/ai/process-all') {
      const { internalText, scoresText, feedbackText, requirements } = body;

      console.log('[AI Handler] Processing all with texts:', {
        internalText,
        scoresText,
        feedbackText,
        requirements,
      });

      const normalizedNotes = await llmService.normalizeInternalNotes(internalText || '');
      const normalizedScores = await llmService.normalizeScores(scoresText || '');
      const normalizedFeedback = await llmService.normalizeClientFeedback(feedbackText || '');

      const avgScore =
        Object.values(normalizedScores).length > 0
          ? Object.values(normalizedScores).reduce((a, b) => a + b, 0) /
            Object.values(normalizedScores).length
          : null;

      let gapAnalysis = null;
      if (requirements) {
        gapAnalysis = await llmService.analyzeGaps(
          requirements || '',
          normalizedNotes,
          normalizedScores,
          normalizedFeedback
        );
      }

      const result = {
        normalized_notes: normalizedNotes,
        normalized_scores: normalizedScores,
        avg_score: avgScore,
        normalized_feedback: normalizedFeedback,
        gap_analysis: gapAnalysis,
      };

      console.log('[AI Handler] Process all result:', JSON.stringify(result).substring(0, 200));
      return successResponse(result);
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Route not found' }),
    };
  } catch (error: any) {
    console.error('[AI Handler] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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
