import { Pool, QueryResult } from 'pg';

class DatabaseService {
  private getPool(): Pool {
    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    if (!databaseUrl.includes('sslmode')) {
      databaseUrl += databaseUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
    }

    return new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 30000
    });
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
      await pool.end();
    }
  }

  async getClients(): Promise<any[]> {
    const result = await this.query('SELECT * FROM clients ORDER BY created_at DESC');
    return result.rows;
  }

  async createClient(data: { name: string }): Promise<any> {
    const { name } = data;
    const result = await this.query(
      'INSERT INTO clients (id, name, created_at) VALUES (gen_random_uuid(), $1, NOW()) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  async getInterviewers(): Promise<any[]> {
    const result = await this.query('SELECT * FROM interviewers ORDER BY created_at DESC');
    return result.rows;
  }

  async createInterviewer(data: { name: string }): Promise<any> {
    const { name } = data;
    const result = await this.query(
      'INSERT INTO interviewers (id, name, created_at) VALUES (gen_random_uuid(), $1, NOW()) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  async getRequirements(): Promise<any[]> {
    const result = await this.query('SELECT id, client_id, role_title as title, raw_content as requirements_text, created_at FROM client_requirements ORDER BY created_at DESC');
    return result.rows;
  }

  async createRequirement(data: { client_id: string; title: string; requirements_text: string; standardized_requirements?: string }): Promise<any> {
    const { client_id, title, requirements_text, standardized_requirements } = data;
    const result = await this.query(
      'INSERT INTO client_requirements (id, client_id, role_title, raw_content, standardized_requirements, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW()) RETURNING *',
      [client_id, title, requirements_text, standardized_requirements || null]
    );
    return result.rows[0];
  }

  async getCandidates(): Promise<any[]> {
    const result = await this.query('SELECT * FROM candidates ORDER BY created_at DESC');
    return result.rows;
  }

  async getCandidateById(id: string): Promise<any | null> {
    const result = await this.query('SELECT * FROM candidates WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createCandidate(data: {
    candidate_name?: string;
    role?: string;
    interview_date?: string;
    is_accepted?: boolean;
    s3_key?: string;
    file_name?: string;
    client_id?: string;
    interviewer_id?: string;
    requirement_id?: string;
    raw_internal_notes?: string;
    raw_internal_scores?: string;
    raw_client_feedback?: string;
  }): Promise<any> {
    const {
      candidate_name,
      role,
      interview_date,
      is_accepted,
      s3_key,
      file_name,
      client_id,
      interviewer_id,
      requirement_id,
      raw_internal_notes,
      raw_internal_scores,
      raw_client_feedback,
    } = data;
    const result = await this.query(
      `INSERT INTO candidates (
        id,
        candidate_name,
        role,
        interview_date,
        is_accepted,
        client_requirement_id,
        interviewer_id,
        raw_internal_notes,
        raw_internal_scores,
        raw_client_feedback,
        status,
        processing_started_at,
        status_updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'processing', NOW(), NOW())
      RETURNING *`,
      [
        candidate_name || null,
        role || null,
        interview_date || null,
        is_accepted || null,
        requirement_id || null,
        interviewer_id || null,
        raw_internal_notes || null,
        raw_internal_scores || null,
        raw_client_feedback || null,
      ]
    );
    return result.rows[0];
  }

  async updateCandidateStatus(id: string, status: string, gapAnalysis?: any): Promise<any> {
    if (gapAnalysis) {
      const result = await this.query(
        `UPDATE candidates SET
          status = $1,
          status_updated_at = NOW(),
          standardized_internal_notes = $2,
          standardized_scores = $3,
          standardized_client_feedback = $4,
          avg_internal_score = $5,
          has_hidden_criteria = $6,
          hidden_criteria_explanation = $7,
          has_assessment_conflict = $8,
          assessment_conflict_explanation = $9,
          has_score_mismatch = $10
        WHERE id = $11 RETURNING *`,
        [
          status,
          gapAnalysis.standardized_notes || null,
          gapAnalysis.scores ? JSON.stringify(gapAnalysis.scores) : null,
          gapAnalysis.standardized_feedback || null,
          gapAnalysis.avg_score || null,
          gapAnalysis.has_hidden_criteria ?? false,
          gapAnalysis.hidden_criteria_explanation || null,
          gapAnalysis.has_assessment_conflict ?? false,
          gapAnalysis.assessment_conflict_explanation || null,
          gapAnalysis.has_score_mismatch ?? false,
          id
        ]
      );
      return result.rows[0];
    } else {
      const result = await this.query(
        `UPDATE candidates SET status = $1, status_updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      return result.rows[0];
    }
  }

  async getMetricsOverview(filters?: {
    clientId?: string;
    interviewerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const where: string[] = ["c.status = 'completed'"];
    const params: any[] = [];

    if (filters?.clientId) {
      params.push(filters.clientId);
      where.push(`cr.client_id = $${params.length}`);
    }

    if (filters?.interviewerId) {
      params.push(filters.interviewerId);
      where.push(`c.interviewer_id = $${params.length}`);
    }

    if (filters?.startDate) {
      params.push(filters.startDate);
      where.push(`COALESCE(c.interview_date, c.created_at)::date >= $${params.length}`);
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      where.push(`COALESCE(c.interview_date, c.created_at)::date <= $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await this.query(
      `
      SELECT
        COUNT(*)::int AS total_interviews,
        COUNT(*)::int AS total_candidates,
        COUNT(*) FILTER (WHERE c.is_accepted IS TRUE)::int AS accepted_count,
        COUNT(*) FILTER (WHERE COALESCE(c.is_accepted, false) IS FALSE)::int AS rejected_count,
        COUNT(*) FILTER (
          WHERE COALESCE(c.is_accepted, false) IS FALSE AND c.has_hidden_criteria IS TRUE
        )::int AS hidden_criteria_rejected,
        COUNT(*) FILTER (
          WHERE COALESCE(c.is_accepted, false) IS FALSE AND c.has_assessment_conflict IS TRUE
        )::int AS assessment_conflict_rejected,
        COUNT(*) FILTER (
          WHERE COALESCE(c.is_accepted, false) IS FALSE AND c.has_score_mismatch IS TRUE
        )::int AS score_mismatch_rejected,
        COUNT(*) FILTER (
          WHERE COALESCE(c.is_accepted, false) IS FALSE
            AND COALESCE(c.has_hidden_criteria, false) IS FALSE
            AND COALESCE(c.has_assessment_conflict, false) IS FALSE
            AND COALESCE(c.has_score_mismatch, false) IS FALSE
        )::int AS other_rejected
      FROM candidates c
      LEFT JOIN client_requirements cr ON c.client_requirement_id = cr.id
      ${whereClause}
      `,
      params
    );

    const row = result.rows[0] || {};

    return {
      totalInterviews: row.total_interviews || 0,
      totalCandidates: row.total_candidates || 0,
      acceptedCount: row.accepted_count || 0,
      rejectedCount: row.rejected_count || 0,
      gapBreakdown: {
        hiddenCriteria: { rejected: row.hidden_criteria_rejected || 0, total: row.rejected_count || 0 },
        assessmentConflict: { rejected: row.assessment_conflict_rejected || 0, total: row.rejected_count || 0 },
        scoreMismatch: { rejected: row.score_mismatch_rejected || 0, total: row.rejected_count || 0 },
        other: { rejected: row.other_rejected || 0, total: row.rejected_count || 0 },
      },
    };
  }

  async getCandidatesForDashboard(paramsInput?: {
    metric?: string;
    page?: string;
    pageSize?: string;
    clientId?: string;
    interviewerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const metricRaw = paramsInput?.metric || '';
    const metric = metricRaw.toLowerCase().replace(/[_\s-]/g, '');

    const page = Math.max(parseInt(paramsInput?.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(paramsInput?.pageSize || '10', 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const where: string[] = ["c.status = 'completed'"];
    const params: any[] = [];

    if (paramsInput?.clientId) {
      params.push(paramsInput.clientId);
      where.push(`cr.client_id = $${params.length}`);
    }

    if (paramsInput?.interviewerId) {
      params.push(paramsInput.interviewerId);
      where.push(`c.interviewer_id = $${params.length}`);
    }

    if (paramsInput?.startDate) {
      params.push(paramsInput.startDate);
      where.push(`COALESCE(c.interview_date, c.created_at)::date >= $${params.length}`);
    }

    if (paramsInput?.endDate) {
      params.push(paramsInput.endDate);
      where.push(`COALESCE(c.interview_date, c.created_at)::date <= $${params.length}`);
    }

    const metricFilterMap: Record<string, string> = {
      hiddencriteria: 'c.has_hidden_criteria IS TRUE',
      assessmentconflict: 'c.has_assessment_conflict IS TRUE',
      scoremismatch: 'c.has_score_mismatch IS TRUE',
      other:
        'COALESCE(c.has_hidden_criteria, false) IS FALSE AND COALESCE(c.has_assessment_conflict, false) IS FALSE AND COALESCE(c.has_score_mismatch, false) IS FALSE',
    };

    if (metric && metricFilterMap[metric]) {
      where.push(metricFilterMap[metric]);
      // gap drilldowns are for rejected candidates
      where.push('COALESCE(c.is_accepted, false) IS FALSE');
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const baseQuery = `
      FROM candidates c
      LEFT JOIN client_requirements cr ON c.client_requirement_id = cr.id
      LEFT JOIN clients cl ON cr.client_id = cl.id
      LEFT JOIN interviewers i ON c.interviewer_id = i.id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT
        c.id,
        c.candidate_name,
        c.role,
        c.interview_date,
        c.created_at,
        c.is_accepted,
        c.raw_internal_notes,
        c.raw_internal_scores,
        c.raw_client_feedback,
        c.standardized_internal_notes,
        c.standardized_scores,
        c.standardized_client_feedback,
        cr.raw_content AS requirements_text,
        cr.standardized_requirements,
        c.has_hidden_criteria,
        c.hidden_criteria_explanation,
        c.has_assessment_conflict,
        c.assessment_conflict_explanation,
        c.has_score_mismatch,
        cl.name AS client_name,
        i.name AS interviewer_name
      ${baseQuery}
      ORDER BY c.created_at DESC
      OFFSET $${params.length + 1} LIMIT $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      ${baseQuery}
    `;

    const [dataResult, countResult] = await Promise.all([
      this.query(dataQuery, [...params, offset, pageSize]),
      this.query(countQuery, params),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const candidates = dataResult.rows.map((row: any) => {
      const isAccepted = row.is_accepted === true;
      const isRejected = !isAccepted;
      const hasOther =
        isRejected &&
        !(row.has_hidden_criteria || row.has_assessment_conflict || row.has_score_mismatch);

      return {
        id: row.id,
        name: row.candidate_name || '—',
        appliedRole: row.role || undefined,
        interviewDate: row.interview_date || undefined,
        createdAt: row.created_at || undefined,
        status: isAccepted ? 'accepted' : 'rejected',
        clientName: row.client_name || 'Unknown',
        interviewerName: row.interviewer_name || undefined,
        requirementsText: row.requirements_text || undefined,
        standardizedRequirements: row.standardized_requirements || undefined,
        rawInternalNotes: row.raw_internal_notes || undefined,
        rawInternalScores: row.raw_internal_scores || undefined,
        rawClientFeedback: row.raw_client_feedback || undefined,
        standardizedNotes: row.standardized_internal_notes || undefined,
        standardizedScores: row.standardized_scores || undefined,
        standardizedFeedback: row.standardized_client_feedback || undefined,
        hasHiddenCriteria: !!row.has_hidden_criteria,
        hiddenCriteriaExplanation: row.hidden_criteria_explanation || undefined,
        hasAssessmentConflict: !!row.has_assessment_conflict,
        assessmentConflictExplanation: row.assessment_conflict_explanation || undefined,
        hasScoreMismatch: !!row.has_score_mismatch,
        scoreMismatchExplanation: undefined,
        hasOther,
        otherExplanation: undefined,
      };
    });

    return {
      candidates,
      aiSummary: '',
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async getStuckCandidates(timeoutMinutes = 30): Promise<any[]> {
    const result = await this.query(
      `SELECT * FROM candidates WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '${timeoutMinutes} minutes'`,
      []
    );
    return result.rows;
  }

  async resetStuckCandidates(candidates: any[]): Promise<void> {
    for (const candidate of candidates) {
      await this.query('UPDATE candidates SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', candidate.id]);
    }
  }

  async executeQuery(query: string): Promise<any[]> {
    try {
      const result = await this.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Query execution failed: ${error}`);
    }
  }
}

export const dbService = new DatabaseService();
