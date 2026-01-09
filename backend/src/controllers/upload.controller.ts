import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import prisma from '../config/database';
import { upload } from '../middleware/upload.middleware';
import { awsService } from '../services/aws.service';
import { llmService } from '../services/llm.service';

const router = Router();

interface CandidateData {
    client_requirement_id: string;
    interviewer_id?: string;
    candidate_name?: string;
    role?: string;
    interview_date?: string;
    is_accepted?: boolean;
}

// Configure multer fields
const uploadFields = upload.fields([
    { name: 'notes_file', maxCount: 1 },
    { name: 'scores_file', maxCount: 1 },
    { name: 'feedback_file', maxCount: 1 },
]);

router.post('/upload/process', uploadFields, async (req: Request, res: Response) => {
    try {
        // Parse candidate data from form
        const candidateData: CandidateData = JSON.parse(req.body.candidate_data || '{}');

        // Get text inputs
        const notesText = req.body.notes_text as string | undefined;
        const scoresText = req.body.scores_text as string | undefined;
        const feedbackText = req.body.feedback_text as string | undefined;

        // Get files from multer
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const notesFile = files?.notes_file?.[0];
        const scoresFile = files?.scores_file?.[0];
        const feedbackFile = files?.feedback_file?.[0];

        // 1. Fetch Requirement
        const reqId = candidateData.client_requirement_id;
        const requirement = await prisma.clientRequirement.findUnique({
            where: { id: reqId },
        });

        if (!requirement) {
            res.status(404).json({ error: 'Client Requirement not found' });
            return;
        }

        const reqText = requirement.standardizedRequirements || requirement.rawContent || '';

        // 2. Extract & Normalize Notes
        let rawNotes = notesText || '';
        if (notesFile) {
            const ext = path.extname(notesFile.originalname);
            const s3Key = `notes/${uuidv4()}${ext}`;

            // Upload to S3
            await awsService.uploadFile(notesFile.buffer, s3Key);

            // Extract text
            rawNotes = await awsService.extractText(notesFile.buffer, ext);
        }

        const normNotes = await llmService.normalizeInternalNotes(rawNotes);

        // 3. Extract & Normalize Scores
        let rawScores = scoresText || '';
        if (scoresFile) {
            const ext = path.extname(scoresFile.originalname);
            const s3Key = `scores/${uuidv4()}${ext}`;

            await awsService.uploadFile(scoresFile.buffer, s3Key);
            rawScores = await awsService.extractText(scoresFile.buffer, ext);
        }

        const normScoresDict = await llmService.normalizeScores(rawScores);

        // Calculate Average
        let avgScore = 0;
        const scoreValues = Object.values(normScoresDict).filter(
            (v): v is number => typeof v === 'number'
        );
        if (scoreValues.length > 0) {
            avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
        }

        // 4. Extract & Normalize Feedback
        let rawFeedback = feedbackText || '';
        if (feedbackFile) {
            const ext = path.extname(feedbackFile.originalname);
            const s3Key = `feedback/${uuidv4()}${ext}`;

            await awsService.uploadFile(feedbackFile.buffer, s3Key);
            rawFeedback = await awsService.extractText(feedbackFile.buffer, ext);
        }

        const normFeedback = await llmService.normalizeClientFeedback(rawFeedback);

        // 5. Analyze Gaps
        const gapAnalysis = await llmService.analyzeGaps(
            reqText,
            normNotes,
            normScoresDict,
            normFeedback
        );

        // 6. Save Candidate
        const newCandidate = await prisma.candidate.create({
            data: {
                clientRequirementId: reqId,
                interviewerId: candidateData.interviewer_id || null,
                candidateName: candidateData.candidate_name || null,
                role: candidateData.role || null,
                interviewDate: candidateData.interview_date
                    ? new Date(candidateData.interview_date)
                    : null,

                rawInternalNotes: rawNotes,
                rawInternalScores: rawScores,
                rawClientFeedback: rawFeedback,

                standardizedInternalNotes: normNotes,
                standardizedScores: JSON.stringify(normScoresDict),
                avgInternalScore: avgScore,
                standardizedClientFeedback: normFeedback,

                isAccepted: candidateData.is_accepted ?? false,

                hasHiddenCriteria: gapAnalysis.has_hidden_criteria ?? false,
                hiddenCriteriaExplanation: gapAnalysis.hidden_criteria_explanation || null,

                hasAssessmentConflict: gapAnalysis.has_assessment_conflict ?? false,
                assessmentConflictExplanation: gapAnalysis.assessment_conflict_explanation || null,

                hasCalibrationGap: gapAnalysis.has_calibration_gap ?? false,
                calibrationGapExplanation: gapAnalysis.calibration_gap_explanation || null,

                hasScoreMismatch: gapAnalysis.has_score_mismatch ?? false,
            },
        });

        res.json({
            status: 'success',
            candidate_id: newCandidate.id,
            gaps: gapAnalysis,
        });
    } catch (error) {
        console.error('Process Error:', error);
        res.status(500).json({ error: String(error) });
    }
});

export default router;
