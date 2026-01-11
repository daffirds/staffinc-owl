import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { dbService } from '../../services/database';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const candidateId = event.pathParameters?.id;

    if (!candidateId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Candidate ID is required' }),
      };
    }

    const candidate = await dbService.getCandidateById(candidateId);

    if (!candidate) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Candidate not found' }),
      };
    }

    const response: APIGatewayProxyResult = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        id: candidate.id,
        status: candidate.status,
        fileName: candidate.file_name,
        gapAnalysis: candidate.gap_analysis,
        createdAt: candidate.created_at,
        updatedAt: candidate.updated_at,
      }),
    };

    return response;

  } catch (error) {
    console.error('[Status Handler] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Failed to get candidate status' }),
    };
  }
};
