import { Meeting } from '../../domain/entities/Meeting';
import { AnalysisResults, IMeetingRepository } from '../../domain/repositories/IMeetingRepository';
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
        userId: meeting.userId,
      },
    });

    return new Meeting({
      id: createdMeeting.id,
      meetingTitle: createdMeeting.meetingTitle,
      meetingDate: createdMeeting.meetingDate,
      summary: createdMeeting.summary,
      topics: createdMeeting.topics as any[],
      decisions: createdMeeting.decisions as string[],
      actionItems: createdMeeting.actionItems as any[],
      speakers: createdMeeting.speakers as any[],
      status: createdMeeting.status,
      userId: createdMeeting.userId,
      createdAt: createdMeeting.createdAt,
      updatedAt: createdMeeting.updatedAt,
    });
  }

  async findById(id: string): Promise<Meeting | null> {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) return null;

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
      userId: meeting.userId,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.meeting.update({
      where: { id },
      data: { status },
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

  async findByUserId(userId: string): Promise<Meeting[]> {
    const meetings = await prisma.meeting.findMany({
      where: { userId },
      orderBy: { meetingDate: 'desc' },
    });

    return meetings.map(
      (meeting) =>
        new Meeting({
          id: meeting.id,
          meetingTitle: meeting.meetingTitle,
          meetingDate: meeting.meetingDate,
          summary: meeting.summary,
          topics: meeting.topics as any[],
          decisions: meeting.decisions as string[],
          actionItems: meeting.actionItems as any[],
          speakers: meeting.speakers as any[],
          status: meeting.status,
          userId: meeting.userId,
          createdAt: meeting.createdAt,
          updatedAt: meeting.updatedAt,
        })
    );
  }
}
