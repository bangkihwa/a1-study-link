import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarEvent {
  id: string;
  type: 'lecture' | 'assignment' | 'question' | 'feedback';
  title: string;
  date: string;
  status?: 'completed' | 'pending' | 'overdue' | 'resolved';
  color?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onDateClick, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일부터 시작
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const days = [];
  let day = startDate;

  // 달력 날짜 생성
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.color) return event.color;
    
    switch (event.type) {
      case 'lecture':
        return event.status === 'completed' ? 'bg-green-500' : 'bg-blue-500';
      case 'assignment':
        if (event.status === 'overdue') return 'bg-red-500';
        if (event.status === 'completed') return 'bg-green-500';
        return 'bg-yellow-500';
      case 'question':
        return event.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500';
      case 'feedback':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'yyyy년 M월')}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="card-body p-0">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((dayName, index) => (
            <div
              key={dayName}
              className={`p-3 text-center text-sm font-medium ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
                } ${isSelected ? 'bg-blue-100' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 
                    index % 7 === 0 && isCurrentMonth ? 'text-red-600' : 
                    index % 7 === 6 && isCurrentMonth ? 'text-blue-600' : ''
                  }`}>
                    {format(day, dateFormat)}
                  </span>
                </div>

                {/* 이벤트 표시 */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={`${event.id}-${eventIndex}`}
                      className={`text-xs p-1 rounded text-white cursor-pointer truncate ${getEventColor(event)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;