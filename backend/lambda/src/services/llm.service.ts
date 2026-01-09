import OpenAI from 'openai';

interface GapAnalysisResult {
    has_hidden_criteria: boolean;
    hidden_criteria_explanation?: string;
    has_assessment_conflict: boolean;
    assessment_conflict_explanation?: string;
    has_calibration_gap: boolean;
    calibration_gap_explanation?: string;
    has_score_mismatch: boolean;
}

class LLMService {
    private client: OpenAI | null = null;
    private model: string = 'gpt-4o-mini';

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        } else {
            console.warn('⚠️ OPENAI_API_KEY not set - LLM features will return mock data');
        }
    }

    private async getJsonResponse<T>(prompt: string): Promise<T> {
        // Return mock data if client not initialized
        if (!this.client) {
            console.warn('LLM client not initialized, returning empty response');
            return {} as T;
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that outputs JSON only.' },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0]?.message?.content || '{}';
            return JSON.parse(content) as T;
        } catch (error) {
            console.error('LLM Error:', error);
            return { error: String(error) } as T;
        }
    }

    async extractTextFromImage(imageUrl: string): Promise<string> {
        if (!this.client) return '';

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Transcribe the text in this image exactly as it appears. Return only the raw text.' },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl,
                                    detail: 'high'
                                },
                            },
                        ],
                    },
                ],
            });
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('LLM Vision Error:', error);
            return '';
        }
    }

    async normalizeInternalNotes(text: string): Promise<string> {
        const prompt = `
      Summarize and standardize these recruitment interview notes. 
      Focus on key strengths, weaknesses, and overall impression.
      Return JSON: { "summary": "..." }
      
      Notes:
      ${text.slice(0, 16000)}
    `;

        const result = await this.getJsonResponse<{ summary?: string }>(prompt);
        return result.summary || text;
    }

    async normalizeScores(text: string): Promise<Record<string, number>> {
        const prompt = `
      Extract numerical scores from this text/document. 
      Normalize all scores to a 1-10 scale.
      Return JSON: { "technical": 8.5, "communication": 7.0, ... }
      If no score found for a category, omit it.
      
      Document Content:
      ${text.slice(0, 16000)}
    `;

        return this.getJsonResponse<Record<string, number>>(prompt);
    }

    async normalizeClientFeedback(text: string): Promise<string> {
        const prompt = `
      Summarize the client's rejection or acceptance feedback.
      Highlight the main reason for the decision.
      Return JSON: { "summary": "..." }
      
      Feedback:
      ${text.slice(0, 16000)}
    `;

        const result = await this.getJsonResponse<{ summary?: string }>(prompt);
        return result.summary || text;
    }

    async analyzeGaps(
        requirements: string,
        internalNotes: string,
        internalScores: Record<string, number>,
        clientFeedback: string
    ): Promise<GapAnalysisResult> {
        const prompt = `
      Analyze the recruitment gap for this candidate.
      
      Client Requirements: ${requirements}
      Internal Notes: ${internalNotes}
      Internal Scores: ${JSON.stringify(internalScores)}
      Client Feedback: ${clientFeedback}
      
      Determine if any of these gap metrics are TRUE (boolean):
      1. hidden_criteria: Client rejected for a reason NOT mentioned in requirements.
      2. assessment_conflict: Internal notes say X is good, Client says X is bad.
      3. calibration_gap: Both mention skill X, but Internal rated high and Client rated low.
      4. score_mismatch: Internal avg score >= 7 but Client rejected.
      
      Also provide a short explanation for each strictly if it is TRUE.
      
      Return JSON structure:
      {
        "has_hidden_criteria": boolean,
        "hidden_criteria_explanation": "...",
        "has_assessment_conflict": boolean,
        "assessment_conflict_explanation": "...",
        "has_calibration_gap": boolean,
        "calibration_gap_explanation": "...",
        "has_score_mismatch": boolean
      }
    `;

        return this.getJsonResponse<GapAnalysisResult>(prompt);
    }
}

export const llmService = new LLMService();
