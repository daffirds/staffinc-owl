import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

const router = Router();

router.get('/metrics/overview', async (req: Request, res: Response) => {
    try {
        const clientId = req.query.client_id as string | undefined;
        const interviewerId = req.query.interviewer_id as string | undefined;

        // Build where clause
        const whereClause: Prisma.CandidateWhereInput = {};

        if (clientId) {
            whereClause.requirement = { clientId };
        }
        if (interviewerId) {
            whereClause.interviewerId = interviewerId;
        }

        // Base counts
        const total = await prisma.candidate.count({ where: whereClause });

        const accepted = await prisma.candidate.count({
            where: { ...whereClause, isAccepted: true },
        });

        const rejected = await prisma.candidate.count({
            where: { ...whereClause, isAccepted: false },
        });

        // Gap Metrics for REJECTED candidates
        const rejectedWhere: Prisma.CandidateWhereInput = { ...whereClause, isAccepted: false };

        const hiddenCriteria = await prisma.candidate.count({
            where: { ...rejectedWhere, hasHiddenCriteria: true },
        });

        const assessmentConflict = await prisma.candidate.count({
            where: { ...rejectedWhere, hasAssessmentConflict: true },
        });

        const calibrationGap = await prisma.candidate.count({
            where: { ...rejectedWhere, hasCalibrationGap: true },
        });

        const scoreMismatch = await prisma.candidate.count({
            where: { ...rejectedWhere, hasScoreMismatch: true },
        });

        // Calculate avg score for score_mismatch group
        const scoreMismatchCandidates = await prisma.candidate.findMany({
            where: { ...rejectedWhere, hasScoreMismatch: true },
            select: { avgInternalScore: true },
        });

        let avgScoreMismatch = 0;
        if (scoreMismatchCandidates.length > 0) {
            const validScores = scoreMismatchCandidates
                .map((c) => c.avgInternalScore)
                .filter((s): s is Prisma.Decimal => s !== null);

            if (validScores.length > 0) {
                const sum = validScores.reduce((acc, val) => acc + Number(val), 0);
                avgScoreMismatch = sum / validScores.length;
            }
        }

        res.json({
            total,
            accepted,
            rejected,
            metrics: {
                hidden_criteria: hiddenCriteria,
                assessment_conflict: assessmentConflict,
                calibration_gap: calibrationGap,
                score_mismatch: scoreMismatch,
                score_mismatch_avg: avgScoreMismatch,
            },
        });
    } catch (error) {
        console.error('Error fetching metrics overview:', error);
        res.status(500).json({ error: String(error) });
    }
});

router.get('/metrics/candidates', async (req: Request, res: Response) => {
    try {
        const metric = req.query.metric as string | undefined;
        const clientId = req.query.client_id as string | undefined;
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 50;

        // Base query: rejected candidates only
        const whereClause: Prisma.CandidateWhereInput = { isAccepted: false };

        if (clientId) {
            whereClause.requirement = { clientId };
        }

        // Apply metric filter
        if (metric === 'hidden_criteria') {
            whereClause.hasHiddenCriteria = true;
        } else if (metric === 'assessment_conflict') {
            whereClause.hasAssessmentConflict = true;
        } else if (metric === 'calibration_gap') {
            whereClause.hasCalibrationGap = true;
        } else if (metric === 'score_mismatch') {
            whereClause.hasScoreMismatch = true;
        }

        const candidates = await prisma.candidate.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        res.json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ error: String(error) });
    }
});

export default router;
