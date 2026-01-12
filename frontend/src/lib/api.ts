import api from '../services/api';
import axios from 'axios';

export interface MetricsOverview {
  totalInterviews: number;
  totalCandidates: number;
  acceptedCount: number;
  rejectedCount: number;
  gapBreakdown: {
    hiddenCriteria: { rejected: number; total: number };
    assessmentConflict: { rejected: number; total: number };
    scoreMismatch: { rejected: number; total: number };
    other: { rejected: number; total: number };
  };
}

export interface Candidate {
  id: string;
  name: string;
  appliedRole?: string;
  interviewDate?: string;
  createdAt?: string;
  status: 'accepted' | 'rejected';
  clientName: string;
  interviewerName?: string;

  requirementsText?: string;
  standardizedRequirements?: string;

  rawInternalNotes?: string;
  rawInternalScores?: string;
  rawClientFeedback?: string;

  standardizedNotes?: string;
  standardizedScores?: string;
  standardizedFeedback?: string;

  hasHiddenCriteria: boolean;
  hiddenCriteriaExplanation?: string;
  hasAssessmentConflict: boolean;
  assessmentConflictExplanation?: string;
  hasScoreMismatch: boolean;
  scoreMismatchExplanation?: string;
  hasOther: boolean;
  otherExplanation?: string;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  aiSummary: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Client {
  id: string;
  name: string;
}

export interface Requirement {
  id: string;
  title: string;
  clientId: string;
}

export interface Interviewer {
  id: string;
  name: string;
  email?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  url?: string;
}

export interface UploadProcessPayload {
  candidateName: string;
  appliedRole: string;
  interviewDate: string;
  finalStatus: 'accepted' | 'rejected';
  clientId: string;
  requirementId: string;
  interviewerId: string;
  internalNotesKey?: string;
  internalNotesText?: string;
  candidateScoresKey?: string;
  candidateScoresText?: string;
  clientFeedbackKey?: string;
  clientFeedbackText?: string;
}

export type GapType = 'hiddenCriteria' | 'assessmentConflict' | 'scoreMismatch' | 'other';

export const fetchMetricsOverview = async (filters?: {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<MetricsOverview> => {
  const params = new URLSearchParams();
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const { data } = await api.get(`/metrics/overview?${params.toString()}`);
  return data;
};

export const fetchCandidatesByMetric = async (
  metric: GapType,
  page: number = 1,
  pageSize: number = 10,
  filters?: { clientId?: string; startDate?: string; endDate?: string }
): Promise<CandidatesResponse> => {
  const params = new URLSearchParams();
  params.append('metric', metric);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const { data } = await api.get(`/metrics/candidates?${params.toString()}`);
  return data;
};

export const fetchCandidates = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: { clientId?: string; startDate?: string; endDate?: string }
): Promise<CandidatesResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  if (filters?.clientId) params.append('clientId', filters.clientId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const { data } = await api.get(`/metrics/candidates?${params.toString()}`);
  return data;
};

export const fetchClients = async (): Promise<Client[]> => {
  const { data } = await api.get('/clients');
  return data;
};

export const createClient = async (name: string): Promise<Client> => {
  const { data } = await api.post('/clients', { name });
  return data;
};

export const fetchRequirements = async (clientId?: string): Promise<Requirement[]> => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const { data } = await api.get(`/requirements${params}`);
  return data;
};

export const createRequirement = async (payload: {
  title: string;
  clientId: string;
  documentKey?: string;
  documentText?: string;
}): Promise<Requirement> => {
  const { data } = await api.post('/requirements', payload);
  return data;
};

export const fetchInterviewers = async (): Promise<Interviewer[]> => {
  const { data } = await api.get('/interviewers');
  return data;
};

export const createInterviewer = async (payload: { name: string; email?: string }): Promise<Interviewer> => {
  const { data } = await api.post('/interviewers', payload);
  return data;
};

export const getPresignedUrl = async (fileName: string, contentType: string): Promise<PresignedUrlResponse> => {
  const { data } = await api.post('/upload/presigned', { fileName, contentType });

  const uploadUrl = data?.uploadUrl ?? data?.url;
  const key = data?.key;

  if (!uploadUrl || !key) {
    throw new Error('Invalid presigned URL response');
  }

  return { uploadUrl, key, url: data?.url };
};

export const uploadToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  if (!uploadUrl) {
    throw new Error('Missing uploadUrl for S3 upload');
  }

  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
};

export const processUpload = async (payload: UploadProcessPayload): Promise<{ candidateId: string }> => {
  const { data } = await api.post('/upload/process', payload);
  return data;
};

export default api;
