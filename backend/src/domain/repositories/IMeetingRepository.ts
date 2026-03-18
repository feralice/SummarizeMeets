import { Meeting } from '../entities/Meeting';

export interface AnalysisResults {
  summary: object;
  topics: object[];
  decisions: string[];
  actionItems: object[];  // camelCase — already mapped from Gemini's action_items
  speakers: object[];
}

export interface IMeetingRepository {
  create(meeting: Meeting): Promise<Meeting>;
  findById(id: string): Promise<Meeting | null>;
  findByUserId(userId: string): Promise<Meeting[]>;
  updateStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  updateWithResults(id: string, results: AnalysisResults): Promise<void>;
}
