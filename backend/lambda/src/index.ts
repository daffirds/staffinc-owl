import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { handler as setupHandler } from './handlers/setup';
import { handler as uploadHandler } from './handlers/process-candidate';
import { handler as presignedHandler } from './handlers/get-presigned-url';
import { handler as metricsHandler } from './handlers/metrics';
import { handler as dbAdminHandler } from './handlers/db-admin';

export const handler: APIGatewayProxyHandler = async (event, context, callback) => {
    // Enable CORS for all OPTIONS requests (pre-flight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
            },
            body: '',
        };
    }

    const { path } = event;
    const isPath = (suffix: string) => path.endsWith(suffix);
    const hasPath = (segment: string) => path.includes(segment);

    // --- UPLOAD FLOW ---
    if (isPath('/upload/presigned')) {
        return presignedHandler(event, context, callback) as Promise<APIGatewayProxyResult>;
    }
    if (isPath('/upload/process')) {
        return uploadHandler(event, context, callback) as Promise<APIGatewayProxyResult>;
    }

    // --- SETUP FLOW ---
    if (isPath('/clients') || isPath('/interviewers') || isPath('/requirements')) {
        return setupHandler(event, context, callback) as Promise<APIGatewayProxyResult>;
    }

    // --- METRICS FLOW ---
    if (hasPath('/metrics/')) {
        return metricsHandler(event, context, callback) as Promise<APIGatewayProxyResult>;
    }

    // --- ADMIN FLOW ---
    if (isPath('/admin/db')) {
        return dbAdminHandler(event, context, callback) as Promise<APIGatewayProxyResult>;
    }

    return {
        statusCode: 404,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Route not found' }),
    };
};
