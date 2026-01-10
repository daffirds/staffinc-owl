import { APIGatewayProxyHandler } from 'aws-lambda';
import pool from '../config/database';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const method = (event as any).requestContext?.http?.method || event.httpMethod || 'GET';
        const path = event.path || (event as any).rawPath || '';
        console.log(`[Metrics] Method: ${method}, Path: ${path}`);
        const { queryStringParameters } = event;

        // Helper to match path
        const isPath = (suffix: string) => {
            const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
            const cleanSuffix = suffix.toLowerCase().replace(/\/+$/, '') || '/';
            return cleanPath === cleanSuffix || cleanPath.endsWith(cleanSuffix);
        };

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        };

        // --- Metrics Overview ---
        if (isPath('/metrics/overview')) {
            const clientId = queryStringParameters?.client_id;
            const interviewerId = queryStringParameters?.interviewer_id;

            let query = `
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE is_accepted = true)::int as accepted,
                    COUNT(*) FILTER (WHERE is_accepted = false)::int as rejected,
                    COUNT(*) FILTER (WHERE is_accepted = false AND has_hidden_criteria = true)::int as hidden_criteria,
                    COUNT(*) FILTER (WHERE is_accepted = false AND has_assessment_conflict = true)::int as assessment_conflict,
                    COUNT(*) FILTER (WHERE is_accepted = false AND has_calibration_gap = true)::int as calibration_gap,
                    COUNT(*) FILTER (WHERE is_accepted = false AND has_score_mismatch = true)::int as score_mismatch,
                    AVG(avg_internal_score) FILTER (WHERE is_accepted = false AND has_score_mismatch = true) as score_mismatch_avg
                FROM candidates c
                LEFT JOIN client_requirements cr ON c.client_requirement_id = cr.id
                WHERE 1=1
            `;

            const params: any[] = [];

            if (clientId) {
                params.push(clientId);
                query += ` AND cr.client_id = $${params.length}`;
            }
            if (interviewerId) {
                params.push(interviewerId);
                query += ` AND c.interviewer_id = $${params.length}`;
            }

            const result = await pool.query(query, params);
            const row = result.rows[0];

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    total: row.total,
                    accepted: row.accepted,
                    rejected: row.rejected,
                    metrics: {
                        hidden_criteria: row.hidden_criteria,
                        assessment_conflict: row.assessment_conflict,
                        calibration_gap: row.calibration_gap,
                        score_mismatch: row.score_mismatch,
                        score_mismatch_avg: row.score_mismatch_avg ? parseFloat(row.score_mismatch_avg) : 0,
                    },
                }),
            };
        }

        // --- Metrics Candidates List ---
        if (isPath('/metrics/candidates')) {
            const metric = queryStringParameters?.metric;
            const clientId = queryStringParameters?.client_id;
            const skip = parseInt(queryStringParameters?.skip || '0');
            const limit = parseInt(queryStringParameters?.limit || '50');

            let query = `
                SELECT c.* 
                FROM candidates c
                LEFT JOIN client_requirements cr ON c.client_requirement_id = cr.id
                WHERE c.is_accepted = false
            `;
            const params: any[] = [];

            if (clientId) {
                params.push(clientId);
                query += ` AND cr.client_id = $${params.length}`;
            }

            // Apply metric filter
            if (metric === 'hidden_criteria') {
                query += ' AND c.has_hidden_criteria = true';
            } else if (metric === 'assessment_conflict') {
                query += ' AND c.has_assessment_conflict = true';
            } else if (metric === 'calibration_gap') {
                query += ' AND c.has_calibration_gap = true';
            } else if (metric === 'score_mismatch') {
                query += ' AND c.has_score_mismatch = true';
            }

            query += ` ORDER BY c.created_at DESC OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
            params.push(skip, limit);

            const result = await pool.query(query, params);

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(result.rows),
            };
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Route not found' }),
        };

    } catch (error) {
        console.error('Metrics Handler Error:', error);
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
