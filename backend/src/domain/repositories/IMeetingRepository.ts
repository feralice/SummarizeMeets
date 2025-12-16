import { Meeting } from '../entities/Meeting';

export interface IMeetingRepository {
  create(meeting: Meeting): Promise<Meeting>;
  findById(id: string): Promise<Meeting | null>;
  findByUserId(userId: string): Promise<Meeting[]>;
}
