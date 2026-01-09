import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

// --- Clients ---
router.post('/clients', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const client = await prisma.client.create({
            data: { name },
        });
        res.status(201).json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: String(error) });
    }
});

router.get('/clients', async (req: Request, res: Response) => {
    try {
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;

        const clients = await prisma.client.findMany({
            skip,
            take: limit,
        });
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: String(error) });
    }
});

// --- Interviewers ---
router.post('/interviewers', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const interviewer = await prisma.interviewer.create({
            data: { name },
        });
        res.status(201).json(interviewer);
    } catch (error) {
        console.error('Error creating interviewer:', error);
        res.status(500).json({ error: String(error) });
    }
});

router.get('/interviewers', async (req: Request, res: Response) => {
    try {
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;

        const interviewers = await prisma.interviewer.findMany({
            skip,
            take: limit,
        });
        res.json(interviewers);
    } catch (error) {
        console.error('Error fetching interviewers:', error);
        res.status(500).json({ error: String(error) });
    }
});

// --- Client Requirements ---
router.post('/requirements', async (req: Request, res: Response) => {
    try {
        const { client_id, role_title, raw_content, standardized_requirements } = req.body;
        const requirement = await prisma.clientRequirement.create({
            data: {
                clientId: client_id,
                roleTitle: role_title,
                rawContent: raw_content,
                standardizedRequirements: standardized_requirements,
            },
        });
        res.status(201).json(requirement);
    } catch (error) {
        console.error('Error creating requirement:', error);
        res.status(500).json({ error: String(error) });
    }
});

router.get('/requirements', async (req: Request, res: Response) => {
    try {
        const clientId = req.query.client_id as string | undefined;
        const skip = parseInt(req.query.skip as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;

        const requirements = await prisma.clientRequirement.findMany({
            where: clientId ? { clientId } : undefined,
            skip,
            take: limit,
            include: {
                client: true,
            },
        });
        res.json(requirements);
    } catch (error) {
        console.error('Error fetching requirements:', error);
        res.status(500).json({ error: String(error) });
    }
});

export default router;
