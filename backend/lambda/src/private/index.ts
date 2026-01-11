import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { handler as setupHandler } from './handlers/setup';
import { handler as metricsHandler } from './handlers/metrics';
import { handler as adminHandler } from './handlers/admin';
import { handler as internalProcessHandler } from './handlers/internal-process';
import { handler as dbTestHandler } from './handlers/db-test';
import { handler as processCandidateHandler } from '../public/handlers/process-candidate';
import { handler as candidateStatusHandler } from '../public/handlers/status';

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
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Admin-Key',
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

  console.log('Raw path:', rawPath, 'Stage:', stage, 'Clean path:', path);

  const isPath = (suffix: string) => {
    const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
    const cleanSuffix = suffix.toLowerCase().replace(/\/+$/, '') || '/';
    return cleanPath === cleanSuffix || cleanPath.endsWith(cleanSuffix);
  };

  const hasPath = (segment: string) => path.toLowerCase().includes(segment.toLowerCase());

  if (path.includes('/internal/process')) {
    return internalProcessHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (hasPath('/upload/process/status/')) {
    return candidateStatusHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (hasPath('/upload/process')) {
    return processCandidateHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (isPath('/clients') || isPath('/interviewers') || isPath('/requirements')) {
    return setupHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (hasPath('/metrics/')) {
    return metricsHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (hasPath('/admin/')) {
    return adminHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  if (path === '/db-test') {
    return dbTestHandler(event, null as any, null as any) as Promise<APIGatewayProxyResult>;
  }

  // Debug: show path for debugging
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({
      error: 'Route not found',
      debug: { rawPath, stage, path },
    }),
  };
};
