import { Response } from 'express';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { CalendarService } from '../services/calendarService';
import { AuthRequest } from '../types';

export class CalendarController {
  static getEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('인증이 필요합니다.', 401);
    }

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const events = await CalendarService.getEvents(req.user, startDate, endDate);

    res.status(200).json({
      success: true,
      data: events,
      message: '이벤트를 불러왔습니다.'
    });
  });

  static createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('인증이 필요합니다.', 401);
    }

    const event = await CalendarService.createEvent(req.user, req.body);

    res.status(201).json({
      success: true,
      data: event,
      message: '이벤트가 생성되었습니다.'
    });
  });

  static updateEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('인증이 필요합니다.', 401);
    }

    const eventId = Number(req.params.id);
    if (Number.isNaN(eventId)) {
      throw createError('잘못된 이벤트 ID 입니다.', 400);
    }

    const event = await CalendarService.updateEvent(req.user, eventId, req.body);

    res.status(200).json({
      success: true,
      data: event,
      message: '이벤트가 수정되었습니다.'
    });
  });

  static deleteEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('인증이 필요합니다.', 401);
    }

    const eventId = Number(req.params.id);
    if (Number.isNaN(eventId)) {
      throw createError('잘못된 이벤트 ID 입니다.', 400);
    }

    await CalendarService.deleteEvent(req.user, eventId);

    res.status(200).json({
      success: true,
      message: '이벤트가 삭제되었습니다.'
    });
  });

  static getContext = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('인증이 필요합니다.', 401);
    }

    const context = await CalendarService.getContext(req.user);

    res.status(200).json({
      success: true,
      data: context,
      message: '캘린더 컨텍스트를 불러왔습니다.'
    });
  });
}
