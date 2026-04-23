import { Meeting } from '../entities/Meeting';

export interface AnalysisResults {
  summary: object;
  topics: object[];
  decisions: string[];
  actionItems: object[];
  speakers: object[];
}

export interface UpdateMeetingFields {
  meetingTitle?: string;
  summary?: object;
  topics?: object[];
  decisions?: string[];
  actionItems?: object[];
  speakers?: object[];
}

export interface MeetingFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MeetingPagination {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface PaginatedMeetings {
  data: Meeting[];
  meta: PaginationMeta;
}

export interface IMeetingRepository {
  create(meeting: Meeting): Promise<Meeting>;
  findById(id: string): Promise<Meeting | null>;
  findByUserId(userId: string, filters?: MeetingFilters, pagination?: MeetingPagination): Promise<PaginatedMeetings>;
  updateStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  updateWithResults(id: string, results: AnalysisResults): Promise<void>;
  updateFields(id: string, fields: UpdateMeetingFields): Promise<Meeting>;
  delete(id: string): Promise<void>;
}
