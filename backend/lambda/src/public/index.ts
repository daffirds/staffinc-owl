import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { handler as healthHandler } from './handlers/health';
import { handler as presignedHandler } from './handlers/get-presigned-url';
import { handler as processHandler } from './handlers/process-candidate';
import { handler as statusHandler } from './handlers/status';
import { handler as aiAnalyzeHandler } from './handlers/ai-analyze';
import { handler as aiNormalizeNotesHandler } from './handlers/ai-normalize-notes';
import { handler as aiNormalizeScoresHandler } from './handlers/ai-normalize-scores';
import { handler as aiNormalizeFeedbackHandler } from './handlers/ai-normalize-feedback';
import { handler as aiStandardizeRequirementsHandler } from './handlers/ai-standardize-requirements';
import { handler as lambdaInvokeHandler } from './handlers/lambda-invoke';

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || (event.headers as any)?.Origin;

  const corsHeaders: Record<string, string | boolean> = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Vary': 'Origin',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key',
      },
      body: '',
    };
  }

  const rawPath = (event as any).rawPath || event.path || '';
  const stage = event.requestContext?.stage || '';
  let path = rawPath;
  
  if (stage && rawPath.startsWith('/' + stage)) {
    path = rawPath.replace('/' + stage, '');
  }

  console.log('Public handler - rawPath:', rawPath, 'stage:', stage, 'cleanPath:', path);

  const isPath = (suffix: string) => {
    const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
    const cleanSuffix = suffix.toLowerCase().replace(/\/+$/, '') || '/';
    return cleanPath === cleanSuffix || cleanPath.endsWith(cleanSuffix);
  };

  const hasPath = (segment: string) => path.toLowerCase().includes(segment.toLowerCase());

  if (path === '/' || path === '') {
    return healthHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (isPath('/upload/presigned')) {
    return presignedHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (hasPath('/upload/process')) {
    return processHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (hasPath('/upload/process/status/')) {
    return statusHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (path === '/ai/analyze') {
    return aiAnalyzeHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }
  if (path === '/ai/normalize-notes') {
    return aiNormalizeNotesHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }
  if (path === '/ai/normalize-scores') {
    return aiNormalizeScoresHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }
  if (path === '/ai/normalize-feedback') {
    return aiNormalizeFeedbackHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }
  if (path === '/ai/standardize-requirements') {
    return aiStandardizeRequirementsHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (path === '/lambda-invoke') {
    return lambdaInvokeHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Route not found' }),
  };
};
