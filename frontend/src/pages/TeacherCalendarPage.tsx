import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CalendarMonthView from '../components/common/CalendarMonthView';
import { apiService } from '../services/api';
import { CalendarContextData, CalendarEvent } from '../types';

const pad = (value: number) => value.toString().padStart(2, '0');
const toDateString = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const getMonthRange = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return {
    startDate: toDateString(start),
    endDate: toDateString(end)
  };
};

const getMonthTitle = (date: Date) => `${date.getUTCFullYear()}년 ${date.getUTCMonth() + 1}월`;

type FormState = {
  eventType: 'teacher_schedule' | 'test_deadline';
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  classId: string;
  testId: string;
};

const emptyForm = (selectedDate: string): FormState => ({
  eventType: 'teacher_schedule',
  title: '',
  description: '',
  startDate: selectedDate,
  endDate: selectedDate,
  classId: '',
  testId: ''
});

const TeacherCalendarPage: React.FC = () => {
  const today = new Date();
  const initialMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const [monthCursor, setMonthCursor] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [context, setContext] = useState<CalendarContextData>({});
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingContext, setLoadingContext] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(toDateString(today)));
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'test_deadline' | 'teacher_schedule'>('all');

  const loadContext = useCallback(async () => {
    setLoadingContext(true);
    try {
      const response = await apiService.getCalendarContext();
      if (response.success) {
        setContext(response.data || {});
      } else {
        setError(response.message || '캘린더 정보를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '캘린더 정보를 불러오는 동안 오류가 발생했습니다.');
    } finally {
      setLoadingContext(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    const range = getMonthRange(monthCursor);
    setLoadingEvents(true);
    setError(null);
    try {
      const response = await apiService.getCalendarEvents(range);
      if (response.success) {
        setEvents(response.data || []);
      } else {
        setError(response.message || '이벤트를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '이벤트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingEvents(false);
    }
  }, [monthCursor]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, startDate: selectedDate, endDate: selectedDate }));
  }, [selectedDate]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesClass = (() => {
        if (classFilter === 'all') {
          return true;
        }
        if (classFilter === 'schedule') {
          return event.eventType === 'teacher_schedule';
        }
        const classIdValue = Number(classFilter);
        return !Number.isNaN(classIdValue) && event.classId === classIdValue;
      })();

      const matchesType = eventTypeFilter === 'all' ? true : event.eventType === eventTypeFilter;

      return matchesClass && matchesType;
    });
  }, [events, classFilter, eventTypeFilter]);

  const eventsForSelectedDate = useMemo(
    () => filteredEvents.filter((event) => selectedDate >= event.startDate && selectedDate <= event.endDate),
    [filteredEvents, selectedDate]
  );

  const handleMonthChange = (offset: number) => {
    setMonthCursor((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + offset, 1)));
  };

  const handleFormChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm(selectedDate));
    setEditingEventId(null);
    setStatusMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);
    setError(null);

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate
    };

    const payload =
      form.eventType === 'teacher_schedule'
        ? {
            eventType: 'teacher_schedule' as const,
            ...basePayload
          }
        : {
            eventType: 'test_deadline' as const,
            ...basePayload,
            classId: form.classId ? Number(form.classId) : undefined,
            testId: form.testId ? Number(form.testId) : undefined
          };

    try {
      const response = editingEventId
        ? await apiService.updateCalendarEvent(editingEventId, {
            title: payload.title,
            description: payload.description ?? null,
            startDate: payload.startDate,
            endDate: payload.endDate,
            classId: payload.eventType === 'test_deadline' ? payload.classId ?? null : null,
            testId: payload.eventType === 'test_deadline' ? payload.testId ?? null : null
          })
        : await apiService.createCalendarEvent(payload);

      if (!response.success) {
        throw new Error(response.message || '이벤트 저장에 실패했습니다.');
      }

      setStatusMessage(editingEventId ? '이벤트가 수정되었습니다.' : '이벤트가 등록되었습니다.');
      resetForm();
      loadEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '이벤트 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setForm({
      eventType: event.eventType,
      title: event.title,
      description: event.description ?? '',
      startDate: event.startDate,
      endDate: event.endDate,
      classId: event.classId ? String(event.classId) : '',
      testId: event.testId ? String(event.testId) : ''
    });
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('이 이벤트를 삭제하시겠습니까?')) {
      return;
    }
    try {
      await apiService.deleteCalendarEvent(eventId);
      if (editingEventId === eventId) {
        resetForm();
      }
      setStatusMessage('이벤트가 삭제되었습니다.');
      loadEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '이벤트 삭제 중 오류가 발생했습니다.');
    }
  };

  const classOptions = context.classes ?? [];
  const testOptions = context.tests ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">강사 캘린더</h1>
          <p className="text-sm text-gray-600">테스트 마감일과 개인 일정을 한 곳에서 관리하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleMonthChange(-1)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            이전 달
          </button>
          <span className="text-base font-semibold text-gray-800">{getMonthTitle(monthCursor)}</span>
          <button
            type="button"
            onClick={() => handleMonthChange(1)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            다음 달
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mr-2 text-sm text-gray-600">반 필터</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="all">전체 반</option>
            <option value="schedule">개인 일정</option>
            {classOptions.map((cls) => (
              <option key={cls.id} value={String(cls.id)}>
                {cls.name}
                {cls.subjectName ? ` (${cls.subjectName})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 text-sm text-gray-600">유형</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value as typeof eventTypeFilter)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="all">모든 유형</option>
            <option value="test_deadline">테스트 마감</option>
            <option value="teacher_schedule">개인 일정</option>
          </select>
        </div>
      </div>

      {(loadingEvents || loadingContext) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
          캘린더 데이터를 불러오는 중입니다...
        </div>
      )}

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <CalendarMonthView
        monthDate={monthCursor}
        events={filteredEvents}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow p-5 space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-gray-900">이벤트 {editingEventId ? '수정' : '등록'}</h2>
            <p className="text-sm text-gray-600">선택한 날짜: {selectedDate}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="eventType"
                  value="teacher_schedule"
                  checked={form.eventType === 'teacher_schedule'}
                  onChange={() => handleFormChange('eventType', 'teacher_schedule')}
                />
                개인 일정
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="eventType"
                  value="test_deadline"
                  checked={form.eventType === 'test_deadline'}
                  onChange={() => handleFormChange('eventType', 'test_deadline')}
                />
                테스트 마감일
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="이벤트 제목"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">설명 (선택사항)</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="상세 메모를 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">시작일</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">종료일</label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {form.eventType === 'test_deadline' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">반 선택</label>
                  <select
                    value={form.classId}
                    onChange={(e) => handleFormChange('classId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">반을 선택하세요</option>
                    {classOptions.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.subjectName ? ` (${cls.subjectName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">테스트 (선택)</label>
                  <select
                    value={form.testId}
                    onChange={(e) => handleFormChange('testId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">테스트 선택 없음</option>
                    {testOptions.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:cursor-not-allowed"
              >
                {submitting ? '저장 중...' : editingEventId ? '이벤트 수정' : '이벤트 등록'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                초기화
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-lg shadow p-5 space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-gray-900">선택한 날짜의 이벤트</h2>
            <p className="text-sm text-gray-600">{selectedDate} · {eventsForSelectedDate.length}건</p>
          </header>

          {eventsForSelectedDate.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-md p-6 text-sm text-gray-500">
              선택한 날짜에 일정이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {eventsForSelectedDate.map((event) => (
                <article key={event.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        event.eventType === 'teacher_schedule'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {event.eventType === 'teacher_schedule' ? '개인 일정' : '테스트 마감'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditEvent(event)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                  {event.description && <p className="text-sm text-gray-600 whitespace-pre-line">{event.description}</p>}
                  <dl className="text-xs text-gray-500 space-y-1">
                    <div>
                      <dt className="inline font-medium">기간:</dt>{' '}
                      <dd className="inline">{event.startDate} ~ {event.endDate}</dd>
                    </div>
                    {event.className && (
                      <div>
                        <dt className="inline font-medium">반:</dt>{' '}
                        <dd className="inline">{event.className}{event.subjectName ? ` (${event.subjectName})` : ''}</dd>
                      </div>
                    )}
                    {event.testTitle && (
                      <div>
                        <dt className="inline font-medium">테스트:</dt>{' '}
                        <dd className="inline">{event.testTitle}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeacherCalendarPage;
