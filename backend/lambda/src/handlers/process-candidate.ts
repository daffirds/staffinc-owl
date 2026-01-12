import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Lambda } from '@aws-sdk/client-lambda';
import { dbService } from '../services/database';

const CandidateSubmitSchema = z.object({
  candidateScoresText: z.string().optional(),
  clientFeedbackText: z.string().optional(),
  internalNotesText: z.string().optional(),
  clientId: z.string().optional(),
  interviewerId: z.string().optional(),
  requirementId: z.string().optional(),
}).refine((data) => {
  return data.candidateScoresText || (data.internalNotesText && data.clientFeedbackText);
}, {
  message: "Either candidateScoresText or both internalNotesText and clientFeedbackText is required",
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || (event.headers as any)?.Origin;

  const corsHeaders: Record<string, string | boolean> = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Vary': 'Origin',
  };

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const parsed = CandidateSubmitSchema.safeParse(JSON.parse(event.body));

    if (!parsed.success) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid request body', details: parsed.error }),
      };
    }

    const candidateData = parsed.data;

    const candidate = await dbService.createCandidate({
      client_id: candidateData.clientId,
      interviewer_id: candidateData.interviewerId,
      requirement_id: candidateData.requirementId,
      raw_internal_notes: candidateData.internalNotesText || undefined,
      raw_internal_scores: candidateData.candidateScoresText || undefined,
      raw_client_feedback: candidateData.clientFeedbackText || undefined,
    });

    const lambdaClient = new Lambda({
      region: process.env.AWS_DEFAULT_REGION || 'ap-southeast-2',
      maxAttempts: 1,
    });
    const privateFunctionArn = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.PRIVATE_FUNCTION_ARN;

    if (!privateFunctionArn) {
      throw new Error('PRIVATE_FUNCTION_ARN (or AWS_LAMBDA_FUNCTION_NAME) is not set');
    }

    const invokePayload = {
      candidateId: candidate.id,
      rawText: candidateData.candidateScoresText,
      clientFeedbackText: candidateData.clientFeedbackText,
      internalNotesText: candidateData.internalNotesText,
    };

    // Invoke the private Lambda using an API Gateway-like event
    // so the router in `src/private/index.ts` can dispatch correctly.
    const invokeEvent = {
      httpMethod: 'POST',
      path: '/internal/process',
      body: JSON.stringify(invokePayload),
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: { stage: 'Prod' },
    };

    console.log('Invoking Private Lambda with event:', JSON.stringify(invokeEvent));

    const invokePromise = lambdaClient.invoke({
      FunctionName: privateFunctionArn,
      InvocationType: 'Event',
      Payload: Buffer.from(JSON.stringify(invokeEvent)),
    });

    invokePromise.then(result => {
      console.log('Private Lambda invoke result:', result.$metadata);
    }).catch(error => {
      console.error('Private Lambda invoke error:', error);
      dbService.updateCandidateStatus(candidate.id, 'failed').catch(console.error);
    });

    const response: APIGatewayProxyResult = {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidateId: candidate.id,
        status: candidate.status,
      }),
    };

    return response;

  } catch (error: any) {
    console.error('[Process Candidate Handler] Error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to process candidate', details: error.message }),
    };
  }
};
