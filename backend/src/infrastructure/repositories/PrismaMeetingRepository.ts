import { Meeting as PrismaMeeting } from '@prisma/client';
import { Meeting } from '../../domain/entities/Meeting';
import {
  AnalysisResults,
  IMeetingRepository,
  MeetingFilters,
  MeetingPagination,
  PaginatedMeetings,
  UpdateMeetingFields,
} from '../../domain/repositories/IMeetingRepository';
import { prisma } from '../database/prisma';

export class PrismaMeetingRepository implements IMeetingRepository {
  async create(meeting: Meeting): Promise<Meeting> {
    const createdMeeting = await prisma.meeting.create({
      data: {
        meetingTitle: meeting.meetingTitle,
        meetingDate: meeting.meetingDate,
        summary: meeting.summary,
        topics: meeting.topics,
        decisions: meeting.decisions,
        actionItems: meeting.actionItems,
        speakers: meeting.speakers,
        status: meeting.status,
        s3Key: meeting.s3Key ?? null,
        userId: meeting.userId,
      },
    });

    return this.toDomain(createdMeeting);
  }

  async findById(id: string): Promise<Meeting | null> {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    return meeting ? this.toDomain(meeting) : null;
  }

  async updateStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    await prisma.meeting.update({
      where: { id },
      data: { status, ...(errorMessage !== undefined && { errorMessage }) },
    });
  }

  async updateWithResults(id: string, results: AnalysisResults): Promise<void> {
    await prisma.meeting.update({
      where: { id },
      data: {
        summary: results.summary,
        topics: results.topics,
        decisions: results.decisions,
        actionItems: results.actionItems,
        speakers: results.speakers,
        status: 'completed',
      },
    });
  }

  async updateFields(id: string, fields: UpdateMeetingFields): Promise<Meeting> {
    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        ...(fields.meetingTitle !== undefined && { meetingTitle: fields.meetingTitle }),
        ...(fields.summary !== undefined && { summary: fields.summary }),
        ...(fields.topics !== undefined && { topics: fields.topics }),
        ...(fields.decisions !== undefined && { decisions: fields.decisions }),
        ...(fields.actionItems !== undefined && { actionItems: fields.actionItems }),
        ...(fields.speakers !== undefined && { speakers: fields.speakers }),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.meeting.delete({ where: { id } });
  }

  async findByUserId(
    userId: string,
    filters?: MeetingFilters,
    pagination?: MeetingPagination
  ): Promise<PaginatedMeetings> {
    const where = {
      userId,
      ...(filters?.search && {
        meetingTitle: { contains: filters.search, mode: 'insensitive' as const },
      }),
      ...((filters?.dateFrom || filters?.dateTo) && {
        meetingDate: {
          ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo && { lte: new Date(`${filters.dateTo}T23:59:59`) }),
        },
      }),
    };

    const page = pagination?.page ?? 1;
    const total = await prisma.meeting.count({ where });
    const pageSize = pagination?.pageSize ?? (total || 1);
    const skip = pagination ? (page - 1) * pageSize : undefined;
    const take = pagination ? pageSize : undefined;

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { meetingDate: 'desc' },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });

    return {
      data: meetings.map((meeting) => this.toDomain(meeting)),
      meta: {
        total,
        page,
        pageSize,
        hasNextPage: page * pageSize < total,
      },
    };
  }

  private toDomain(meeting: PrismaMeeting): Meeting {
    return new Meeting({
      id: meeting.id,
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate,
      summary: meeting.summary,
      topics: meeting.topics as any[],
      decisions: meeting.decisions as string[],
      actionItems: meeting.actionItems as any[],
      speakers: meeting.speakers as any[],
      status: meeting.status,
      errorMessage: meeting.errorMessage,
      s3Key: meeting.s3Key,
      userId: meeting.userId,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    });
  }
}
