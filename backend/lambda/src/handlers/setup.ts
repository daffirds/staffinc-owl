import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { Pool } from 'pg';
import { Lambda } from '@aws-sdk/client-lambda';
import { dbService } from '../services/database';

const CreateClientSchema = z.object({
  name: z.string().min(1),
});

const CreateInterviewerSchema = z.object({
  name: z.string().min(1),
});

const CreateRequirementSchema = z.object({
  client_id: z.string().min(1),
  title: z.string().min(1),
  requirements_text: z.string().min(1),
});

async function testDatabase(): Promise<any> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    const timeResult = await client.query('SELECT NOW() as time');
    const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    client.release();
    await pool.end();
    return { success: true, time: timeResult.rows[0].time, tables: tablesResult.rows.map(r => r.table_name) };
  } catch (error: any) {
    return { success: false, error: error.message, code: error.code };
  }
}

function successResponse(data: any, origin?: string): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Credentials': true,
      'Vary': 'Origin',
    },
    body: JSON.stringify(data),
  };
}

function errorResponse(statusCode: number, message: string, details?: any, origin?: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Credentials': true,
      'Vary': 'Origin',
    },
    body: JSON.stringify({ error: message, details }),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || (event.headers as any)?.Origin;

  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Vary': 'Origin',
    'Content-Type': 'application/json'
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

  const path = event.path || (event as any).rawPath || '';

  if (path === '/db-test' || path.includes('/db-test')) {
    const dbResult = await testDatabase();
    return {
      statusCode: dbResult.success ? 200 : 500,
      headers,
      body: JSON.stringify({
        ...dbResult,
        envCheck: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          databaseUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'
        }
      })
    };
  }

  try {
    console.log('Setup handler called, path:', path);
    console.log('Database URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

    if (path.includes('/clients')) {
      if (event.httpMethod === 'POST') {
        if (!event.body) {
          return errorResponse(400, 'Request body is required', undefined, origin || undefined);
        }

        const parsed = CreateClientSchema.safeParse(JSON.parse(event.body));
        if (!parsed.success) {
          return errorResponse(400, 'Invalid request body', parsed.error, origin || undefined);
        }

        const client = await dbService.createClient(parsed.data);
        return successResponse(client, origin || undefined);
      }

      if (event.httpMethod === 'GET') {
        const clients = await dbService.getClients();
        return successResponse(clients, origin || undefined);
      }
    }

    if (path.includes('/interviewers')) {
      if (event.httpMethod === 'POST') {
        if (!event.body) {
          return errorResponse(400, 'Request body is required', undefined, origin || undefined);
        }

        const parsed = CreateInterviewerSchema.safeParse(JSON.parse(event.body));
        if (!parsed.success) {
          return errorResponse(400, 'Invalid request body', parsed.error, origin || undefined);
        }

        const interviewer = await dbService.createInterviewer(parsed.data);
        return successResponse(interviewer, origin || undefined);
      }

      if (event.httpMethod === 'GET') {
        const interviewers = await dbService.getInterviewers();
        return successResponse(interviewers, origin || undefined);
      }
    }

    if (path.includes('/requirements')) {
      if (event.httpMethod === 'POST') {
        if (!event.body) {
          return errorResponse(400, 'Request body is required', undefined, origin || undefined);
        }

        const parsed = CreateRequirementSchema.safeParse(JSON.parse(event.body));
        if (!parsed.success) {
          return errorResponse(400, 'Invalid request body', parsed.error, origin || undefined);
        }

        const { client_id, title, requirements_text } = parsed.data;

        const lambdaClient = new Lambda({
          region: process.env.AWS_DEFAULT_REGION || 'ap-southeast-2',
          maxAttempts: 1,
        });

        const aiFunctionArn = process.env.AI_FUNCTION_ARN;
        
        if (!aiFunctionArn) {
            return errorResponse(500, 'AI_FUNCTION_ARN environment variable is not set', undefined, origin || undefined);
        }

        const standardizeResponse = await lambdaClient.invoke({
          FunctionName: aiFunctionArn,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({
            httpMethod: 'POST',
            path: '/ai/standardize-requirements',
            body: JSON.stringify({ text: requirements_text }),
            requestContext: { stage: 'Prod' },
          })),
        });

        const standardizeResult = standardizeResponse as any;
        if (standardizeResult.FunctionError) {
            return errorResponse(500, 'AI standardization failed', standardizeResult.FunctionError, origin || undefined);
        }

        if (!standardizeResult.Payload) {
            return errorResponse(500, 'Empty response from AI function', undefined, origin || undefined);
        }

        const standardizePayload = JSON.parse(Buffer.from(standardizeResult.Payload).toString());
        let standardized = null;
        
        if (standardizePayload.body) {
          const body = typeof standardizePayload.body === 'string' 
            ? JSON.parse(standardizePayload.body) 
            : standardizePayload.body;
          standardized = body.standardized;
          
          // If standardized is an object (has must_haves/nice_to_haves), convert to string
          if (typeof standardized === 'object' && standardized !== null) {
            try {
              standardized = JSON.stringify(standardized, null, 2);
            } catch (e) {
              standardized = String(standardized);
            }
          }
        }

        const requirement = await dbService.createRequirement({
          client_id,
          title,
          requirements_text,
          standardized_requirements: standardized
        });

        return successResponse({
          ...requirement,
          standardized_requirements: standardized
        }, origin || undefined);
      }

      if (event.httpMethod === 'GET') {
        const clientId = event.queryStringParameters?.clientId;
        if (clientId) {
          const parsed = z.string().uuid().safeParse(clientId);
          if (!parsed.success) {
            return errorResponse(400, 'clientId must be a valid UUID', parsed.error, origin || undefined);
          }
        }
        const requirements = await dbService.getRequirements(clientId);
        return successResponse(requirements, origin || undefined);
      }
    }

    return errorResponse(404, 'Route not found', undefined, origin || undefined);

  } catch (error: any) {
    console.error('[Setup Handler] Error:', error);
    return errorResponse(500, 'Internal server error', error.message, origin || undefined);
  }
};
