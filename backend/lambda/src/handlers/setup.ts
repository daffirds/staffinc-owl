import { APIGatewayProxyHandler } from 'aws-lambda';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const method = (event as any).requestContext?.http?.method || event.httpMethod || 'GET';
        const path = event.path || (event as any).rawPath || '';
        console.log(`[Setup] Method: ${method}, Path: ${path}`);
        const { queryStringParameters, body } = event;
        const jsonBody = body ? JSON.parse(body) : {};

        // Helper to match path (ignores leading slash and stage if present)
        const isPath = (suffix: string) => {
            const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
            const cleanSuffix = suffix.toLowerCase().replace(/\/+$/, '') || '/';
            return cleanPath === cleanSuffix || cleanPath.endsWith(cleanSuffix);
        };

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        };

        // --- Clients ---
        if (isPath('/clients')) {
            if (method === 'POST') {
                const { name } = jsonBody;
                const id = uuidv4();
                const result = await pool.query(
                    'INSERT INTO clients (id, name) VALUES ($1, $2) RETURNING *',
                    [id, name]
                );
                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify(result.rows[0]),
                };
            }
            if (method === 'GET') {
                const skip = parseInt(queryStringParameters?.skip || '0');
                const limit = parseInt(queryStringParameters?.limit || '100');
                const result = await pool.query(
                    'SELECT * FROM clients OFFSET $1 LIMIT $2',
                    [skip, limit]
                );
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(result.rows),
                };
            }
        }

        // --- Interviewers ---
        if (isPath('/interviewers')) {
            if (method === 'POST') {
                const { name } = jsonBody;
                const id = uuidv4();
                const result = await pool.query(
                    'INSERT INTO interviewers (id, name) VALUES ($1, $2) RETURNING *',
                    [id, name]
                );
                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify(result.rows[0]),
                };
            }
            if (method === 'GET') {
                const skip = parseInt(queryStringParameters?.skip || '0');
                const limit = parseInt(queryStringParameters?.limit || '100');
                const result = await pool.query(
                    'SELECT * FROM interviewers OFFSET $1 LIMIT $2',
                    [skip, limit]
                );
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(result.rows),
                };
            }
        }

        // --- Client Requirements ---
        if (isPath('/requirements')) {
            if (method === 'POST') {
                const { client_id, role_title, raw_content, standardized_requirements } = jsonBody;
                const id = uuidv4();
                const result = await pool.query(
                    `INSERT INTO client_requirements
    (id, client_id, role_title, raw_content, standardized_requirements)
VALUES($1, $2, $3, $4, $5) RETURNING * `,
                    [id, client_id, role_title, raw_content, standardized_requirements]
                );
                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify(result.rows[0]),
                };
            }
            if (method === 'GET') {
                const clientId = queryStringParameters?.client_id;
                const skip = parseInt(queryStringParameters?.skip || '0');
                const limit = parseInt(queryStringParameters?.limit || '100');

                let query = 'SELECT cr.*, c.name as client_name FROM client_requirements cr LEFT JOIN clients c ON cr.client_id = c.id';
                const params: any[] = [];

                if (clientId) {
                    query += ' WHERE cr.client_id = $1';
                    params.push(clientId);
                }

                query += ` OFFSET $${params.length + 1} LIMIT $${params.length + 2} `;
                params.push(skip, limit);

                const result = await pool.query(query, params);
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(result.rows),
                };
            }
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Route not found' }),
        };

    } catch (error) {
        console.error('Setup Handler Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: String(error) }),
        };
    }
};
