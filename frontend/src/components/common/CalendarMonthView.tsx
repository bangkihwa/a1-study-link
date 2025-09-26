import React from 'react';
import { CalendarEvent } from '../../types';

type CalendarMonthViewProps = {
  monthDate: Date;
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (value: number) => value.toString().padStart(2, '0');

const toDateString = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ monthDate, events, selectedDate, onSelectDate }) => {
  const startOfMonth = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
  const startDayOffset = startOfMonth.getUTCDay();
  const firstCellDate = new Date(startOfMonth);
  firstCellDate.setUTCDate(firstCellDate.getUTCDate() - startDayOffset);

  const cells = Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(firstCellDate);
    cellDate.setUTCDate(firstCellDate.getUTCDate() + index);
    const dateString = toDateString(cellDate);
    const inCurrentMonth = cellDate.getUTCMonth() === monthDate.getUTCMonth();
    const dayEvents = events.filter((event) => dateString >= event.startDate && dateString <= event.endDate);
    return { cellDate, dateString, inCurrentMonth, dayEvents };
  });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
        {DAYS.map((day) => (
          <div key={day} className="px-2 py-2 text-center uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map(({ cellDate, dateString, inCurrentMonth, dayEvents }) => {
          const isSelected = selectedDate === dateString;
          return (
            <button
              key={dateString}
              type="button"
              onClick={() => onSelectDate(dateString)}
              className={`h-28 border border-gray-100 flex flex-col items-start p-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 focus:z-10 ${
                inCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              } ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}
            >
              <span className={`text-sm font-semibold ${inCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                {cellDate.getUTCDate()}
              </span>
              <div className="mt-1 space-y-1 w-full overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={`${event.id}-${event.eventType}`}
                    className={`truncate text-[11px] px-1 py-0.5 rounded ${
                      event.eventType === 'teacher_schedule'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {event.eventType === 'teacher_schedule' ? '일정' : '테스트'} · {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-500">+{dayEvents.length - 3} 더보기</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthView;
