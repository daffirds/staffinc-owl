import OpenAI from 'openai';
import { GapAnalysisResult, LLMResult } from '../types';

class LLMService {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({ apiKey });
    this.model = 'gpt-4o-mini';
  }

  private async getJsonResponseSafe<T>(prompt: string): Promise<LLMResult<T>> {
    try {
      const startTime = Date.now();

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that responds only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.3
      });

      const duration = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || '{}';

      console.log('[LLM Service] OpenAI call completed:', {
        durationMs: duration,
        hasContent: !!content
      });

      if (!content || content === '{}') {
        return { success: false, error: 'OpenAI returned empty response', isTimeout: false };
      }

      const parsed = JSON.parse(content);

      return { success: true, data: parsed as T, isTimeout: false };

    } catch (error: any) {
      const safeStringify = (value: any) => {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      console.error('[LLM Service] Error in getJsonResponse:', {
        message: error?.message,
        name: error?.name,
        raw: safeStringify(error)
      });

      return {
        success: false,
        error: typeof error?.message === 'string' ? error.message : JSON.stringify(error),
        isTimeout: false
      } as LLMResult<T>;
    }
  }

  async extractTextFromImage(imageBase64: string, mimeType: string): Promise<string> {
    try {
      console.log('[LLM Service] Calling OpenAI vision for image');

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: 'Transcribe text in this image exactly as it appears. Return only raw text.'
              }
            ]
          }
        ],
        max_tokens: 800
      });

      const text = response.choices[0]?.message?.content || '';
      return text;

    } catch (error: any) {
      console.error('[LLM Service] Vision error:', error);
      throw new Error(`Vision model failed: ${error?.message || String(error)}`);
    }
  }

  async normalizeInternalNotes(text: string): Promise<string> {
    console.log('[LLM Service] normalizeInternalNotes called:', {
      textLength: text.length
    });

    const prompt = `
      Summarize and standardize these recruitment interview notes. 
      Focus on key strengths, weaknesses, and overall impression.
      Return JSON: { "summary": "..." }
      
      Notes:
      ${text.slice(0, 16000)}
    `;

    const result = await this.getJsonResponseSafe<{ summary?: string }>(prompt);

    if (!result.success) {
      throw new Error(`Notes normalization failed: ${result.error}`);
    }

    if (!result.data?.summary) {
      throw new Error('Notes normalization returned empty summary');
    }

    return result.data.summary;
  }

  async normalizeScores(text: string): Promise<Record<string, number>> {
    console.log('[LLM Service] normalizeScores called:', {
      textLength: text.length
    });

    const prompt = `
      Extract numerical scores from this text/document. 
      Normalize all scores to a 1-10 scale.
      Return JSON: { "technical": 8.5, "communication": 7.0, ... }
      If no score found for a category, omit it.
      
      Document Content:
      ${text.slice(0, 16000)}
    `;

    const result = await this.getJsonResponseSafe<Record<string, number>>(prompt);

    if (!result.success) {
      throw new Error(`Scores normalization failed: ${result.error}`);
    }

    if (!result.data || Object.keys(result.data).length === 0) {
      throw new Error('Scores normalization returned empty object');
    }

    return result.data;
  }

  async normalizeClientFeedback(text: string): Promise<string> {
    console.log('[LLM Service] normalizeClientFeedback called:', {
      textLength: text.length
    });

    const prompt = `
      Summarize client's rejection or acceptance feedback.
      Highlight main reason for decision.
      Return JSON: { "summary": "..." }
      
      Feedback:
      ${text.slice(0, 16000)}
    `;

    const result = await this.getJsonResponseSafe<{ summary?: string }>(prompt);

    if (!result.success) {
      throw new Error(`Feedback normalization failed: ${result.error}`);
    }

    if (!result.data?.summary) {
      throw new Error('Feedback normalization returned empty summary');
    }

    return result.data.summary;
  }

  async standardizeRequirements(text: string): Promise<string> {
    console.log('[LLM Service] standardizeRequirements called:', {
      textLength: text.length
    });

    const prompt = `
      Standardize these job requirements into concise, structured bullet points focused on must-haves and nice-to-haves.
      Return JSON: { "standardized": "..." }

      Requirements:
      ${text.slice(0, 16000)}
    `;

    const result = await this.getJsonResponseSafe<{ standardized?: string }>(prompt);

    if (!result.success) {
      throw new Error(`Requirements standardization failed: ${result.error}`);
    }

    if (!result.data?.standardized) {
      throw new Error('Requirements standardization returned empty standardized field');
    }

    return result.data.standardized;
  }

  async standardizeRequirementsFromDocument(imageBase64: string, mimeType: string): Promise<string> {
    try {
      console.log('[LLM Service] standardizeRequirementsFromDocument called');

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: 'Read this document and return JSON: { "standardized": "..." } with concise, structured job requirements.'
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content) as { standardized?: string };

      if (!parsed.standardized) {
        throw new Error('Document standardization returned empty standardized field');
      }

      return parsed.standardized;

    } catch (error: any) {
      console.error('[LLM Service] Document standardization error:', error);
      throw new Error(`Document standardization failed: ${error.message}`);
    }
  }

  async analyzeGaps(
    requirements: string,
    internalNotes: string,
    internalScores: Record<string, number>,
    clientFeedback: string
  ): Promise<GapAnalysisResult> {
    console.log('[LLM Service] analyzeGaps called:', {
      requirementsLength: requirements.length,
      notesLength: internalNotes.length,
      scoresCount: Object.keys(internalScores).length,
      feedbackLength: clientFeedback.length
    });

    const prompt = `
      Analyze recruitment gap for this candidate.
      
      Client Requirements: ${requirements}
      Internal Notes: ${internalNotes}
      Internal Scores: ${JSON.stringify(internalScores)}
      Client Feedback: ${clientFeedback}
      
      Determine if any of these gap metrics are TRUE (boolean):
      1. hidden_criteria: Client rejected for a reason NOT mentioned in requirements.
      2. assessment_conflict: Internal notes say X is good, Client says X is bad.
      3. score_mismatch: Internal avg score >= 8 but Client rejected.
      
      Also provide a short explanation for each strictly if it is TRUE.
      
      Return JSON structure:
      {
        "has_hidden_criteria": boolean,
        "hidden_criteria_explanation": "...",
        "has_assessment_conflict": boolean,
        "assessment_conflict_explanation": "...",
        "has_score_mismatch": boolean
      }
    `;

    const result = await this.getJsonResponseSafe<GapAnalysisResult>(prompt);

    if (!result.success) {
      throw new Error(`Gap analysis failed: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('Gap analysis returned empty object');
    }

    const gapAnalysis = result.data;

    console.log('[LLM Service] analyzeGaps completed:', {
      hasHiddenCriteria: gapAnalysis.has_hidden_criteria,
      hasAssessmentConflict: gapAnalysis.has_assessment_conflict,
      hasScoreMismatch: gapAnalysis.has_score_mismatch
    });

    return gapAnalysis;
  }
}

export const llmService = new LLMService();
