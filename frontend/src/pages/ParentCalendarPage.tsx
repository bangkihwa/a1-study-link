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

const ParentCalendarPage: React.FC = () => {
  const today = new Date();
  const initialMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [monthCursor, setMonthCursor] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const [context, setContext] = useState<CalendarContextData>({});
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    try {
      const response = await apiService.getCalendarContext();
      if (response.success) {
        setContext(response.data || {});
      }
    } catch (err) {
      // ignore optional context error
    }
  }, []);

  const loadEvents = useCallback(async () => {
    const range = getMonthRange(monthCursor);
    setLoading(true);
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
      setLoading(false);
    }
  }, [monthCursor]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventsForSelectedDate = useMemo(
    () => events.filter((event) => selectedDate >= event.startDate && selectedDate <= event.endDate),
    [events, selectedDate]
  );

  const handleMonthChange = (offset: number) => {
    setMonthCursor((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + offset, 1)));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">자녀 학습 캘린더</h1>
          <p className="text-sm text-gray-600">테스트 마감일을 확인하고 자녀의 학습 일정을 함께 계획해 보세요.</p>
          {context.children && context.children.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {context.children.map((child) => (
                <div key={child.id}>
                  {child.name}
                  {child.className ? ` · ${child.className}` : ''}
                </div>
              ))}
            </div>
          )}
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

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
          캘린더 데이터를 불러오는 중입니다...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <CalendarMonthView
        monthDate={monthCursor}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <section className="bg-white rounded-lg shadow p-5 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-gray-900">선택한 날짜의 일정</h2>
          <p className="text-sm text-gray-600">{selectedDate} · {eventsForSelectedDate.length}건</p>
        </header>

        {eventsForSelectedDate.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-md p-6 text-sm text-gray-500">
            선택한 날짜에 예정된 테스트 일정이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {eventsForSelectedDate.map((event) => (
              <article key={event.id} className="border border-gray-200 rounded-lg p-4 space-y-1">
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  테스트 마감
                </span>
                <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                {event.className && (
                  <p className="text-xs text-gray-500">
                    {event.className}
                    {event.subjectName ? ` · ${event.subjectName}` : ''}
                  </p>
                )}
                {event.relatedStudents && event.relatedStudents.length > 0 && (
                  <p className="text-xs text-blue-700">
                    대상 자녀: {event.relatedStudents.map((student) => student.name).join(', ')}
                  </p>
                )}
                <p className="text-sm text-gray-600">기간: {event.startDate} ~ {event.endDate}</p>
                {event.testTitle && <p className="text-sm text-gray-600">테스트: {event.testTitle}</p>}
                {event.description && <p className="text-sm text-gray-600 whitespace-pre-line">{event.description}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ParentCalendarPage;
