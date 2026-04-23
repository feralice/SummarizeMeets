import { Router } from 'express';
import { constants as HttpStatus } from 'node:http2';
import { PrismaMeetingRepository } from '../../infrastructure/repositories/PrismaMeetingRepository';
import logger from '../../infrastructure/logger';
import { ListUserMeetingsUseCase } from '../../use-cases/meetings/list-user-meetings';
import { authMiddleware } from './middleware/auth.middleware';
import { handleHttpError } from './middleware/http-errors';

const meetingsRouter = Router();

const meetingRepository = new PrismaMeetingRepository();
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

meetingsRouter.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const {
      search,
      dateFrom,
      dateTo,
      page: pageQuery,
      pageSize: pageSizeQuery,
    } = req.query as Record<string, string | undefined>;

    if (dateFrom && isNaN(Date.parse(dateFrom))) {
      return res
        .status(HttpStatus.HTTP_STATUS_BAD_REQUEST)
        .json({ error: 'Invalid dateFrom value' });
    }
    if (dateTo && isNaN(Date.parse(dateTo))) {
      return res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).json({ error: 'Invalid dateTo value' });
    }

    const page = Number(pageQuery || DEFAULT_PAGE);
    const pageSize = Number(pageSizeQuery || DEFAULT_PAGE_SIZE);

    if (!Number.isInteger(page) || page < 1) {
      return res
        .status(HttpStatus.HTTP_STATUS_BAD_REQUEST)
        .json({ error: 'page must be greater than zero' });
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      return res
        .status(HttpStatus.HTTP_STATUS_BAD_REQUEST)
        .json({ error: `pageSize must be between 1 and ${MAX_PAGE_SIZE}` });
    }

    const useCase = new ListUserMeetingsUseCase(meetingRepository);
    const meetings = await useCase.execute(
      userId,
      {
        search: search?.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
      { page, pageSize }
    );

    const result = meetings.data.map((meeting) => ({
      id: meeting.id,
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate,
      summary: meeting.summary,
      topics: meeting.topics,
      decisions: meeting.decisions,
      actionItems: meeting.actionItems,
      speakers: meeting.speakers,
      status: meeting.status,
      userId: meeting.userId,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }));

    logger.info({ userId, page, pageSize, total: meetings.meta.total }, 'Meeting history fetched');
    return res.status(HttpStatus.HTTP_STATUS_OK).json({ data: result, meta: meetings.meta });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Error fetching meeting history');
    return handleHttpError(err, res);
  }
});

export default meetingsRouter;
