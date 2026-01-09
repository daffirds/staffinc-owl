import { APIGatewayProxyHandler } from 'aws-lambda';
import pool from '../config/database';
import { awsService } from '../services/aws.service';
import { llmService } from '../services/llm.service';
import { v4 as uuidv4 } from 'uuid';

interface ProcessRequest {
    client_requirement_id: string;
    interviewer_id?: string;
    candidate_name?: string;
    role?: string;
    interview_date?: string;
    is_accepted?: boolean;

    // S3 Keys from frontend upload
    notes_key?: string;
    scores_key?: string;
    feedback_key?: string;

    // Direct text fallback
    notes_text?: string;
    scores_text?: string;
    feedback_text?: string;
}

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Missing body' }),
            };
        }

        const data: ProcessRequest = JSON.parse(event.body);
        const { client_requirement_id } = data;

        // 1. Fetch Requirement
        const reqResult = await pool.query(
            'SELECT * FROM client_requirements WHERE id = $1',
            [client_requirement_id]
        );

        if (reqResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Client Requirement not found' }),
            };
        }

        const requirement = reqResult.rows[0];
        const reqText = requirement.standardized_requirements || requirement.raw_content || '';

        // Helper to extract text from S3 Key (Image/Doc) OR use raw text
        const getText = async (key?: string, raw?: string): Promise<string> => {
            if (raw) return raw;
            if (key) {
                // Generate Presigned GET URL for GPT-4o to read
                const presignedUrl = await awsService.getPresignedGetUrl(key);
                return await llmService.extractTextFromImage(presignedUrl);
            }
            return '';
        };

        // 2. Extract Text
        const rawNotes = await getText(data.notes_key, data.notes_text);
        const rawScores = await getText(data.scores_key, data.scores_text);
        const rawFeedback = await getText(data.feedback_key, data.feedback_text);

        // 3. Normalize & Analyze (Parallelize for speed)
        const [normNotes, normScoresDict, normFeedback] = await Promise.all([
            llmService.normalizeInternalNotes(rawNotes),
            llmService.normalizeScores(rawScores),
            llmService.normalizeClientFeedback(rawFeedback),
        ]);

        // Calculate Average Score
        let avgScore = 0;
        const scoreValues = Object.values(normScoresDict).filter((v): v is number => typeof v === 'number');
        if (scoreValues.length > 0) {
            avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
        }

        // 4. Analyze Gaps
        const gapAnalysis = await llmService.analyzeGaps(
            reqText,
            normNotes,
            normScoresDict,
            normFeedback
        );

        // 5. Save Candidate & Documents (Transaction)
        const client = await pool.connect();
        let newCandidateId: string;

        try {
            await client.query('BEGIN');

            newCandidateId = uuidv4();
            const insertCandidateQuery = `
                INSERT INTO candidates (
                    id, client_requirement_id, interviewer_id, candidate_name, role, interview_date,
                    raw_internal_notes, raw_internal_scores, raw_client_feedback,
                    standardized_internal_notes, standardized_scores, avg_internal_score, standardized_client_feedback,
                    is_accepted,
                    has_hidden_criteria, hidden_criteria_explanation,
                    has_assessment_conflict, assessment_conflict_explanation,
                    has_calibration_gap, calibration_gap_explanation,
                    has_score_mismatch
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9,
                    $10, $11, $12, $13,
                    $14,
                    $15, $16,
                    $17, $18,
                    $19, $20,
                    $21
                )
            `;

            await client.query(insertCandidateQuery, [
                newCandidateId, client_requirement_id, data.interviewer_id || null, data.candidate_name || null, data.role || null, data.interview_date ? new Date(data.interview_date) : null,
                rawNotes, rawScores, rawFeedback,
                normNotes, JSON.stringify(normScoresDict), avgScore, normFeedback,
                data.is_accepted ?? false,
                gapAnalysis.has_hidden_criteria ?? false, gapAnalysis.hidden_criteria_explanation || null,
                gapAnalysis.has_assessment_conflict ?? false, gapAnalysis.assessment_conflict_explanation || null,
                gapAnalysis.has_calibration_gap ?? false, gapAnalysis.calibration_gap_explanation || null,
                gapAnalysis.has_score_mismatch ?? false
            ]);

            // 6. Save Documents
            const insertDocQuery = `
                INSERT INTO documents (id, candidate_id, file_path, document_type, content_type)
                VALUES ($1, $2, $3, $4, $5)
            `;

            if (data.notes_key) {
                await client.query(insertDocQuery, [uuidv4(), newCandidateId, data.notes_key, 'NOTES', 'application/octet-stream']);
            }
            if (data.scores_key) {
                await client.query(insertDocQuery, [uuidv4(), newCandidateId, data.scores_key, 'SCORES', 'application/octet-stream']);
            }
            if (data.feedback_key) {
                await client.query(insertDocQuery, [uuidv4(), newCandidateId, data.feedback_key, 'FEEDBACK', 'application/octet-stream']);
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                status: 'success',
                candidate_id: newCandidateId,
                gaps: gapAnalysis,
            }),
        };

    } catch (error) {
        console.error('Process Handler Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: String(error) }),
        };
    }
};
