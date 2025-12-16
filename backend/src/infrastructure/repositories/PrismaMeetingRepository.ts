import { Meeting } from '../../domain/entities/Meeting';
import { IMeetingRepository } from '../../domain/repositories/IMeetingRepository';
import { prisma } from '../database/prisma';

export class PrismaMeetingRepository implements IMeetingRepository {
  async create(meeting: Meeting): Promise<Meeting> {
    const createdMeeting = await prisma.meeting.create({
      data: {
        meetingTitle: meeting.meetingTitle,
        meetingDate: meeting.meetingDate,
        summary: meeting.summary,
        actionPoints: meeting.actionPoints,
        notes: meeting.notes,
        status: meeting.status,
        userId: meeting.userId,
      },
    });

    return new Meeting({
      id: createdMeeting.id,
      meetingTitle: createdMeeting.meetingTitle,
      meetingDate: createdMeeting.meetingDate,
      summary: createdMeeting.summary,
      actionPoints: createdMeeting.actionPoints,
      notes: createdMeeting.notes || undefined,
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
      actionPoints: meeting.actionPoints,
      notes: meeting.notes || undefined,
      status: meeting.status,
      userId: meeting.userId,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
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
          actionPoints: meeting.actionPoints,
          notes: meeting.notes || undefined,
          status: meeting.status,
          userId: meeting.userId,
          createdAt: meeting.createdAt,
          updatedAt: meeting.updatedAt,
        })
    );
  }
}
