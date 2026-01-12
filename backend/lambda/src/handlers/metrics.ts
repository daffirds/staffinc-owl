import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { dbService } from '../services/database';

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || (event.headers as any)?.Origin;

  const headers: Record<string, string | boolean> = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Admin-Key',
      },
      body: '',
    };
  }

  try {
    const rawPath = (event as any).rawPath || event.path || '';
    const stage = event.requestContext?.stage || '';

    let path = rawPath;
    if (stage && rawPath.startsWith('/' + stage)) {
      path = rawPath.replace('/' + stage, '');
    }

    const qs = event.queryStringParameters || {};

    if (path.includes('/metrics/overview')) {
      const overview = await dbService.getMetricsOverview({
        clientId: qs.client_id || (qs as any).clientId,
        interviewerId: qs.interviewer_id || (qs as any).interviewerId,
        startDate: qs.startDate,
        endDate: qs.endDate,
      });

      return { statusCode: 200, headers, body: JSON.stringify(overview) };
    }

    if (path.includes('/metrics/candidates')) {
      const candidates = await dbService.getCandidatesForDashboard({
        metric: qs.metric,
        page: qs.page,
        pageSize: qs.pageSize,
        clientId: qs.client_id || (qs as any).clientId,
        interviewerId: qs.interviewer_id || (qs as any).interviewerId,
        startDate: qs.startDate,
        endDate: qs.endDate,
      });

      return { statusCode: 200, headers, body: JSON.stringify(candidates) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Route not found' }) };
  } catch (error: any) {
    console.error('[Metrics Handler] Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || String(error) }) };
  }
};
