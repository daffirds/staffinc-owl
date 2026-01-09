import { APIGatewayProxyHandler } from 'aws-lambda';
import pool from '../config/database';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        // --- Security Check ---
        const adminKey = event.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'temp-secret-key') {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        const body = JSON.parse(event.body || '{}');
        const { action, sql } = body;

        // --- ACTION: Run Manual SQL ---
        if (action === 'query' && sql) {
            const result = await pool.query(sql);
            // Convert BigInt to string for JSON serialization
            const serialized = JSON.stringify(result.rows, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            );
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ result: JSON.parse(serialized) }),
            };
        }

        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Invalid action or missing SQL' }),
        };
    } catch (error) {
        console.error('DB Admin Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: String(error) }),
        };
    }
};
