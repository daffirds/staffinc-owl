export interface Client {
    id: string;
    name: string;
    created_at: string;
}

export interface Interviewer {
    id: string;
    name: string;
}

export interface ClientRequirement {
    id: string;
    client_id: string;
    role_title: string;
    raw_content?: string;
    standardized_requirements?: string;
    created_at: string;
    client?: Client;
}

export interface Candidate {
    id: string;
    candidate_name: string;
    role: string;
    interview_date: string;
    is_accepted: boolean;
    avg_internal_score: number;

    has_hidden_criteria: boolean;
    has_assessment_conflict: boolean;
    has_calibration_gap: boolean;
    has_score_mismatch: boolean;

    hidden_criteria_explanation?: string;
    assessment_conflict_explanation?: string;
    calibration_gap_explanation?: string;
}

export interface UploadResponse {
    status: string;
    candidate_id: string;
    gaps: any;
}
