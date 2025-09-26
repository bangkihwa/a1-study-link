import ClassModel from '../models/classModel';
import { CalendarEventModel, CalendarEventRecord } from '../models/calendarEventModel';
import { ParentModel } from '../models/parentModel';
import { TestModel } from '../models/testModel';
import { UserModel } from '../models/userModel';
import { createError } from '../middlewares/errorHandler';
import {
  CalendarContextData,
  CalendarEvent,
  CalendarEventType,
  ParentChildSummary,
  User
} from '../types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value: string): Date => {
  if (!DATE_REGEX.test(value)) {
    throw createError('잘못된 날짜 형식입니다. YYYY-MM-DD 형태여야 합니다.', 400);
  }
  const [year, month, day] = value.split('-').map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    throw createError('유효하지 않은 날짜입니다.', 400);
  }
  return date;
};

const formatDateOnly = (value: Date | string): string => {
  if (typeof value === 'string') {
    if (!DATE_REGEX.test(value)) {
      return formatDateOnly(parseDateOnly(value));
    }
    return value;
  }
  return value.toISOString().slice(0, 10);
};

const normalizeRange = (startDate?: string, endDate?: string) => {
  const today = new Date();
  const defaultStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const defaultEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

  const start = startDate ? parseDateOnly(startDate) : defaultStart;
  const end = endDate ? parseDateOnly(endDate) : defaultEnd;

  if (start.getTime() > end.getTime()) {
    throw createError('시작 날짜는 종료 날짜보다 이후일 수 없습니다.', 400);
  }

  // 최대 1년 범위 제한
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 370) {
    throw createError('최대 조회 기간은 1년입니다.', 400);
  }

  return {
    start: formatDateOnly(start),
    end: formatDateOnly(end)
  };
};

const mapRecordToEvent = (record: CalendarEventRecord): CalendarEvent => ({
  id: record.id,
  eventType: record.eventType,
  title: record.title,
  description: record.description,
  startDate: formatDateOnly(record.startDate),
  endDate: formatDateOnly(record.endDate),
  classId: record.classId,
  className: record.className ?? null,
  subjectName: record.subjectName ?? null,
  testId: record.testId,
  testTitle: record.testTitle ?? null,
  teacherId: record.teacherId,
  teacherName: record.teacherName ?? null,
  visibility: record.visibility
});

const ensureTeacherOwnsClass = async (teacherId: number, classId: number) => {
  const classes = await ClassModel.findByTeacherId(teacherId);
  if (!classes.some((item) => item.id === classId)) {
    throw createError('해당 반에 대한 권한이 없습니다.', 403);
  }
};

const ensureTeacherOwnsTest = async (teacherId: number, testId: number) => {
  const test = await TestModel.findById(testId);
  if (!test) {
    throw createError('테스트를 찾을 수 없습니다.', 404);
  }
  if (test.teacherId !== teacherId) {
    throw createError('해당 테스트에 대한 권한이 없습니다.', 403);
  }
};

export class CalendarService {
  static async getEvents(user: User, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    const { start, end } = normalizeRange(startDate, endDate);

    switch (user.role) {
      case 'teacher':
        return await this.getTeacherEvents(user.id, start, end);
      case 'student':
        return await this.getStudentEvents(user.id, start, end);
      case 'parent':
        return await this.getParentEvents(user.id, start, end);
      case 'admin':
        return await this.getAdminEvents(start, end);
      default:
        return [];
    }
  }

  static async createEvent(
    user: User,
    payload: {
      eventType: CalendarEventType;
      title: string;
      description?: string | null;
      startDate: string;
      endDate?: string;
      classId?: number;
      testId?: number;
      teacherId?: number;
    }
  ): Promise<CalendarEvent> {
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw createError('이벤트를 생성할 권한이 없습니다.', 403);
    }

    const { start, end } = normalizeRange(payload.startDate, payload.endDate ?? payload.startDate);

    if (!payload.title?.trim()) {
      throw createError('제목을 입력해야 합니다.', 400);
    }

    const eventType = payload.eventType;

    if (eventType !== 'teacher_schedule' && eventType !== 'test_deadline') {
      throw createError('지원하지 않는 이벤트 유형입니다.', 400);
    }

    let classId: number | null = null;
    let testId: number | null = null;
    let teacherId: number | null = null;
    let visibility: 'teacher_only' | 'class' = 'class';

    if (eventType === 'teacher_schedule') {
      visibility = 'teacher_only';
      teacherId = user.role === 'admin' ? payload.teacherId ?? user.id : user.id;
      if (!teacherId) {
        throw createError('교사 일정에는 담당 교사 정보가 필요합니다.', 400);
      }
    } else {
      // test_deadline
      if (!payload.classId) {
        throw createError('테스트 마감 일정에는 반 정보가 필요합니다.', 400);
      }
      classId = payload.classId;

      if (user.role === 'teacher') {
        await ensureTeacherOwnsClass(user.id, classId);
        teacherId = user.id;
      } else if (payload.teacherId) {
        teacherId = payload.teacherId;
      }

      if (payload.testId) {
        testId = payload.testId;
        if (user.role === 'teacher') {
          await ensureTeacherOwnsTest(user.id, testId);
        }
      }
    }

    const newId = await CalendarEventModel.create({
      eventType,
      title: payload.title.trim(),
      description: payload.description?.trim() ?? null,
      startDate: start,
      endDate: end,
      classId,
      testId,
      teacherId,
      visibility,
      createdBy: user.id
    });

    const created = await CalendarEventModel.findById(newId);
    if (!created) {
      throw createError('이벤트 생성에 실패했습니다.', 500);
    }

    return mapRecordToEvent(created);
  }

  static async updateEvent(
    user: User,
    eventId: number,
    payload: {
      title?: string;
      description?: string | null;
      startDate?: string;
      endDate?: string;
      classId?: number | null;
      testId?: number | null;
      teacherId?: number | null;
    }
  ): Promise<CalendarEvent> {
    const existing = await CalendarEventModel.findById(eventId);
    if (!existing) {
      throw createError('이벤트를 찾을 수 없습니다.', 404);
    }

    CalendarService.ensureCanModify(user, existing);

    let start: string | undefined;
    let end: string | undefined;

    if (payload.startDate || payload.endDate) {
      const range = normalizeRange(payload.startDate ?? formatDateOnly(existing.startDate), payload.endDate ?? formatDateOnly(existing.endDate));
      start = range.start;
      end = range.end;
    }

    if (payload.title !== undefined && !payload.title.trim()) {
      throw createError('제목을 입력해야 합니다.', 400);
    }

    let classId = payload.classId;
    let testId = payload.testId;
    let teacherId = payload.teacherId;

    if (existing.eventType === 'teacher_schedule') {
      if (user.role === 'teacher') {
        teacherId = user.id;
      } else if (teacherId == null) {
        teacherId = existing.teacherId;
      }
    } else {
      if (classId === undefined) {
        classId = existing.classId;
      }

      if (classId != null) {
        if (user.role === 'teacher') {
          await ensureTeacherOwnsClass(user.id, classId);
          teacherId = user.id;
        }
      }

      if (testId === undefined) {
        testId = existing.testId;
      }

      if (testId != null && user.role === 'teacher') {
        await ensureTeacherOwnsTest(user.id, testId);
      }

      if (teacherId === undefined) {
        teacherId = existing.teacherId;
      }
    }

    await CalendarEventModel.update(eventId, {
      title: payload.title?.trim(),
      description: payload.description?.trim(),
      startDate: start,
      endDate: end,
      classId,
      testId,
      teacherId
    });

    const updated = await CalendarEventModel.findById(eventId);
    if (!updated) {
      throw createError('이벤트를 찾을 수 없습니다.', 404);
    }

    return mapRecordToEvent(updated);
  }

  static async deleteEvent(user: User, eventId: number): Promise<void> {
    const existing = await CalendarEventModel.findById(eventId);
    if (!existing) {
      throw createError('이벤트를 찾을 수 없습니다.', 404);
    }

    CalendarService.ensureCanModify(user, existing);

    await CalendarEventModel.delete(eventId);
  }

  static async getContext(user: User): Promise<CalendarContextData> {
    switch (user.role) {
      case 'teacher': {
        const [classes, tests] = await Promise.all([
          ClassModel.findByTeacherId(user.id),
          TestModel.findByTeacherId(user.id)
        ]);
        return {
          classes: classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            subjectName: cls.subjectName ?? null
          })),
          tests: tests.map((test) => ({
            id: test.id,
            title: test.title
          }))
        };
      }
      case 'admin': {
        const [classes, tests] = await Promise.all([
          ClassModel.findAll(false),
          TestModel.findAll()
        ]);
        return {
          classes: classes.map((cls) => ({
            id: cls.id,
            name: cls.name,
            subjectName: cls.subjectName ?? null
          })),
          tests: tests.map((test) => ({
            id: test.id,
            title: test.title
          }))
        };
      }
      case 'student': {
        const student = await UserModel.findStudentByUserId(user.id);
        if (!student?.classId) {
          return { class: null };
        }
        const classRecord = await ClassModel.findById(student.classId);
        return {
          class: classRecord
            ? {
                id: classRecord.id,
                name: classRecord.name,
                subjectName: classRecord.subjectName ?? null
              }
            : null
        };
      }
      case 'parent': {
        const children = await ParentModel.getChildrenByParentId(user.id);
        return {
          children: children.map((child) => ({
            id: child.studentId,
            name: child.studentName,
            classId: child.classId ?? null,
            className: child.className ?? null
          }))
        };
      }
      default:
        return {};
    }
  }

  private static ensureCanModify(user: User, event: CalendarEventRecord) {
    if (user.role === 'admin') {
      return;
    }

    if (user.role !== 'teacher') {
      throw createError('이 이벤트를 수정할 권한이 없습니다.', 403);
    }

    const ownsEvent = event.teacherId === user.id || event.createdBy === user.id;

    if (!ownsEvent) {
      throw createError('이 이벤트를 수정할 권한이 없습니다.', 403);
    }
  }

  private static async getTeacherEvents(teacherId: number, start: string, end: string): Promise<CalendarEvent[]> {
    const classes = await ClassModel.findByTeacherId(teacherId);
    const classIds = classes.map((cls) => cls.id);

    const [classEvents, scheduleEvents] = await Promise.all([
      CalendarEventModel.getTestDeadlineEvents(classIds, start, end),
      CalendarEventModel.getTeacherScheduleEvents(teacherId, start, end)
    ]);

    return [...classEvents, ...scheduleEvents].map(mapRecordToEvent);
  }

  private static async getStudentEvents(studentId: number, start: string, end: string): Promise<CalendarEvent[]> {
    const student = await UserModel.findStudentByUserId(studentId);
    if (!student?.classId) {
      return [];
    }

    const events = await CalendarEventModel.getTestDeadlineEvents([student.classId], start, end);
    return events.map(mapRecordToEvent);
  }

  private static async getParentEvents(parentId: number, start: string, end: string): Promise<CalendarEvent[]> {
    const children = await ParentModel.getChildrenByParentId(parentId);
    const classToChildren = new Map<number, ParentChildSummary[]>();

    children.forEach((child) => {
      if (child.classId != null) {
        if (!classToChildren.has(child.classId)) {
          classToChildren.set(child.classId, []);
        }
        classToChildren.get(child.classId)!.push(child);
      }
    });

    const classIds = Array.from(classToChildren.keys());

    if (!classIds.length) {
      return [];
    }

    const events = await CalendarEventModel.getTestDeadlineEvents(classIds, start, end);
    return events.map((record) => {
      const base = mapRecordToEvent(record);
      if (base.classId != null) {
        const related = classToChildren.get(base.classId) || [];
        base.relatedStudents = related.map((child) => ({ id: child.studentId, name: child.studentName }));
      }
      return base;
    });
  }

  private static async getAdminEvents(start: string, end: string): Promise<CalendarEvent[]> {
    const events = await CalendarEventModel.getAllEvents(start, end);
    return events.map(mapRecordToEvent);
  }
}
