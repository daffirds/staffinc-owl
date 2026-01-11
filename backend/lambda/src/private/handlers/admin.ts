import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { dbService } from '../../services/database';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const requestAdminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key'];

    if (!requestAdminKey || requestAdminKey !== adminKey) {
      return errorResponse(401, 'Unauthorized');
    }

    const path = event.path || (event as any).rawPath || '';

    if (path.includes('/admin/cleanup-stuck')) {
      const stuckCandidates = await dbService.getStuckCandidates(30);
      await dbService.resetStuckCandidates(stuckCandidates);
      return successResponse({ message: 'Reset stuck candidates', count: stuckCandidates.length });
    }

    if (path.includes('/admin/db')) {
      const queryString = event.queryStringParameters?.query;

      if (!queryString) {
        return errorResponse(400, 'Query parameter is required');
      }

      try {
        const result = await dbService.executeQuery(queryString);
        return successResponse(result);
      } catch (error: any) {
        return errorResponse(400, error.message);
      }
    }

    return errorResponse(404, 'Route not found');

  } catch (error) {
    console.error('[Admin Handler] Error:', error);
    return errorResponse(500, 'Internal server error');
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

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({ error: message }),
  };
}
