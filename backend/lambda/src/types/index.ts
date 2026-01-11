export interface GapAnalysisResult {
  has_hidden_criteria: boolean;
  hidden_criteria_explanation?: string;
  has_assessment_conflict: boolean;
  assessment_conflict_explanation?: string;
  has_score_mismatch: boolean;
}

export interface LLMResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isTimeout?: boolean;
}

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
}

export interface CandidateSubmitRequest {
  s3Key: string;
  fileName: string;
  clientId?: string;
  interviewerId?: string;
  requirementId?: string;
}

export interface CandidateSubmitResponse {
  candidateId: string;
  status: 'processing' | 'completed' | 'failed' | 'timeout';
}

export interface InternalProcessRequest {
  candidateId: string;
}

export interface CandidateRecord {
  id: string;
  s3_key: string;
  file_name: string;
  status: 'processing' | 'completed' | 'failed' | 'timeout';
  created_at: Date;
  updated_at: Date;
  client_id?: string;
  interviewer_id?: string;
  requirement_id?: string;
  gap_analysis?: GapAnalysisResult;
}

export interface AiAnalyzeRequest {
  requirements: string;
  internalNotes: string;
  internalScores: Record<string, number>;
  clientFeedback: string;
}

export interface AiTextRequest {
  text: string;
}

export interface AiStandardizeRequest {
  text: string;
}
