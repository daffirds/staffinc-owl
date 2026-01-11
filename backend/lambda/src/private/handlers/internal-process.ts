import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { Lambda } from '@aws-sdk/client-lambda';
import { dbService } from '../../services/database';
import { GapAnalysisResult } from '../../types';

const InternalProcessSchema = z.object({
  candidateId: z.string().min(1),
  rawText: z.string().optional(),
  clientFeedbackText: z.string().optional(),
  internalNotesText: z.string().optional(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const parsedBody = event.body ? JSON.parse(event.body) : {};
    const parsed = InternalProcessSchema.safeParse(parsedBody);

    if (!parsed.success) {
      return errorResponse(400, 'Invalid request body', parsed.error);
    }

    const { candidateId, rawText, clientFeedbackText, internalNotesText } = parsed.data;

    const candidate = await dbService.getCandidateById(candidateId);
    if (!candidate) {
      return errorResponse(404, 'Candidate not found');
    }

    try {
      const lambdaClient = new Lambda({
        region: process.env.AWS_DEFAULT_REGION || 'ap-southeast-2',
        maxAttempts: 1,
      });

      const result = await invokeLambda<any>(lambdaClient, 'AIFunction', '/ai/process-all', {
        internalText: candidate.raw_internal_notes || '',
        scoresText: candidate.raw_internal_scores || '',
        feedbackText: candidate.raw_client_feedback || '',
        requirements: ''
      });

      const clientRequirementId = candidate.client_requirement_id;
      if (clientRequirementId) {
        const requirements = await getRequirementsForId(clientRequirementId);
        result.requirements = requirements;
        
        const gapResult = await invokeLambda<any>(lambdaClient, 'AIFunction', '/ai/analyze', {
          requirements,
          internalNotes: result.normalized_notes,
          internalScores: result.normalized_scores,
          clientFeedback: result.normalized_feedback
        });
        result.gap_analysis = gapResult;
      }

      await dbService.updateCandidateStatus(candidateId, 'completed', {
        standardized_notes: result.normalized_notes,
        scores: result.normalized_scores,
        standardized_feedback: result.normalized_feedback,
        avg_score: result.avg_score,
        has_hidden_criteria: result.gap_analysis?.has_hidden_criteria ?? false,
        hidden_criteria_explanation: result.gap_analysis?.hidden_criteria_explanation || null,
        has_assessment_conflict: result.gap_analysis?.has_assessment_conflict ?? false,
        assessment_conflict_explanation: result.gap_analysis?.assessment_conflict_explanation || null,

        has_score_mismatch: result.gap_analysis?.has_score_mismatch ?? false
      });

      return successResponse({
        candidateId,
        status: 'completed',
        gapAnalysis: result.gap_analysis ?? null,
      });

    } catch (error: any) {
      console.error('[Internal Process] Analysis failed:', error);
      console.error('[Internal Process] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      await dbService.updateCandidateStatus(candidateId, 'failed');
      return errorResponse(500, 'Analysis failed', error?.message || String(error));
    }

  } catch (error) {
    console.error('[Internal Process Handler] Error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

async function getRequirementsForId(requirementId: string): Promise<string> {
  try {
    const result = await dbService.query('SELECT raw_content FROM client_requirements WHERE id = $1', [requirementId]);
    return result.rows[0]?.raw_content || '';
  } catch {
    return '';
  }
}

async function invokeLambda<T>(
  lambdaClient: Lambda,
  _functionName: string,
  path: string,
  payload: any
): Promise<T> {
  const aiFunctionArn = process.env.AI_FUNCTION_ARN;

  if (!aiFunctionArn) {
    throw new Error('AI_FUNCTION_ARN environment variable is not set');
  }

  console.log(`[Internal Process] Invoking AI function for ${path}`);

  const event = {
    httpMethod: 'POST',
    path,
    body: JSON.stringify(payload),
    headers: {},
    queryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      resourceId: 'lambda-invoke',
      resourcePath: path,
      httpMethod: 'POST',
      stage: 'Prod',
      requestId: 'lambda-invoke',
      identity: {},
    },
  };

  const response = await lambdaClient.invoke({
    FunctionName: aiFunctionArn,
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify(event)),
  });

  const invokeResponse = response as any;

  if (invokeResponse.FunctionError) {
    throw new Error(`Lambda error: ${invokeResponse.FunctionError}`);
  }

  if (!invokeResponse.Payload) {
    throw new Error('Empty response from Lambda');
  }

  const payloadStr = Buffer.from(invokeResponse.Payload).toString();
  console.log(`[Internal Process] AI function response:`, payloadStr.substring(0, 200));

  const parsed = JSON.parse(payloadStr);

  // When invoking a Lambda that returns an APIGatewayProxyResult,
  // the actual payload is inside `body`.
  if (parsed && typeof parsed === 'object' && 'statusCode' in parsed) {
    const statusCode = (parsed as any).statusCode;
    const body = (parsed as any).body;

    if (statusCode && statusCode >= 400) {
      throw new Error(`AI function HTTP ${statusCode}: ${body}`);
    }

    if (body === undefined || body === null) {
      return parsed as T;
    }

    if (typeof body === 'string') {
      return JSON.parse(body) as T;
    }

    return body as T;
  }

  return parsed as T;
}

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
