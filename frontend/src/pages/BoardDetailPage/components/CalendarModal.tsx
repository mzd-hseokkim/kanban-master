import { Card } from '@/types/card';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiCalendar, HiCheck, HiChevronLeft, HiChevronRight, HiClock, HiLightningBolt, HiPlus, HiX } from 'react-icons/hi';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onCardSelect: (cardId: number) => void;
}

type EventType = 'created' | 'started' | 'completed' | 'due';

interface CalendarEvent {
  id: string;
  cardId: number;
  title: string;
  type: EventType;
  date: Date;
  color: string;
  textColor: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarModal = ({ isOpen, onClose, cards, onCardSelect }: CalendarModalProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStarted, setFilterStarted] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentDate(new Date());
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Process cards into events with Filtering & Deduplication
  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    cards.forEach(card => {
      // Filtering Logic (Filter Cards)
      if (filterStarted && !filterCompleted) {
        if (!card.startedAt) return;
      } else if (!filterStarted && filterCompleted) {
        if (!card.completedAt) return;
      } else if (filterStarted && filterCompleted) {
        if (!card.startedAt || !card.completedAt) return;
      }

      const cardEvents: CalendarEvent[] = [];

      // Determine colors based on card status
      let color = 'bg-slate-100 border-slate-200';
      let textColor = 'text-slate-600';

      if (card.isCompleted) {
          color = 'bg-emerald-50 border-emerald-200';
          textColor = 'text-emerald-700';
      } else if (card.dueDate && new Date(card.dueDate) < new Date()) {
          color = 'bg-rose-50 border-rose-200';
          textColor = 'text-rose-700';
      } else if (card.startedAt) {
          color = 'bg-amber-50 border-amber-200';
          textColor = 'text-amber-700';
      }

      if (card.createdAt) cardEvents.push({ id: `created-${card.id}`, cardId: card.id, title: card.title, type: 'created', date: new Date(card.createdAt), color, textColor });
      if (card.startedAt) cardEvents.push({ id: `started-${card.id}`, cardId: card.id, title: card.title, type: 'started', date: new Date(card.startedAt), color, textColor });
      if (card.completedAt) cardEvents.push({ id: `completed-${card.id}`, cardId: card.id, title: card.title, type: 'completed', date: new Date(card.completedAt), color, textColor });
      if (card.dueDate) cardEvents.push({ id: `due-${card.id}`, cardId: card.id, title: card.title, type: 'due', date: new Date(card.dueDate), color, textColor });

      if (cardEvents.length > 0) {
        // Deduplicate events on the same day for this card
        const eventsByDate = new Map<string, CalendarEvent[]>();
        cardEvents.forEach(evt => {
          const dateStr = evt.date.toDateString();
          if (!eventsByDate.has(dateStr)) eventsByDate.set(dateStr, []);
          eventsByDate.get(dateStr)?.push(evt);
        });

        // Priority: completed > started > due > created
        const getPriority = (type: EventType) => {
          switch (type) {
            case 'completed': return 4;
            case 'started': return 3;
            case 'due': return 2;
            case 'created': return 1;
            default: return 0;
          }
        };

        eventsByDate.forEach((dayEvents) => {
          dayEvents.sort((a, b) => getPriority(b.type) - getPriority(a.type));
          allEvents.push(dayEvents[0]);
        });
      }
    });

    return allEvents;
  }, [cards, filterStarted, filterCompleted]);

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      return (
        event.date.getDate() === day &&
        event.date.getMonth() === month &&
        event.date.getFullYear() === year
      );
    });
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'created': return <HiPlus className="w-2.5 h-2.5" />;
      case 'started': return <HiLightningBolt className="w-2.5 h-2.5" />;
      case 'completed': return <HiCheck className="w-2.5 h-2.5" />;
      case 'due': return <HiClock className="w-2.5 h-2.5" />;
    }
  };

  const getEventLabel = (type: EventType) => {
    switch (type) {
      case 'created': return '등록';
      case 'started': return '시작';
      case 'completed': return '완료';
      case 'due': return '마감';
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-7xl h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <HiCalendar className="text-indigo-600" />
              일정 캘린더
            </h2>

            {/* Filter Toggles */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => setFilterStarted(!filterStarted)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        filterStarted
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    시작
                </button>
                <button
                    onClick={() => setFilterCompleted(!filterCompleted)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        filterCompleted
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    종료
                </button>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <HiChevronLeft className="text-xl" />
              </button>
              <span className="text-lg font-semibold min-w-[140px] text-center text-slate-800">
                {year}년 {MONTHS[month]}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <HiChevronRight className="text-xl" />
              </button>
              <button
                onClick={goToToday}
                className="ml-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                오늘
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
            {DAYS.map((day, i) => (
              <div key={day} className={`py-3 text-center text-sm font-semibold ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr gap-px bg-slate-200 overflow-y-auto">
            {/* Empty cells for previous month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/50" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div key={day} className={`bg-white min-h-[120px] p-1.5 flex flex-col gap-1 hover:bg-slate-50 transition-colors group relative ${isToday ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex justify-between items-start mb-0.5">
                    <span className={`
                      w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium
                      ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'}
                    `}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium px-1">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* 2-Column Grid for Events */}
                  <div className="flex-1 grid grid-cols-2 gap-1 content-start overflow-y-auto custom-scrollbar">
                    {dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardSelect(event.cardId);
                        }}
                        title={`${event.title} (${getEventLabel(event.type)})`}
                        className={`
                          w-full text-left px-1.5 py-1 rounded border flex items-center gap-1
                          transition-all hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]
                          ${event.color} ${event.textColor}
                        `}
                      >
                        <span className="flex-shrink-0">{getEventIcon(event.type)}</span>
                        <span className="truncate text-[10px] font-medium leading-tight">{event.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty cells for next month */}
            {Array.from({ length: 42 - (daysInMonth + firstDay) }).map((_, i) => (
              <div key={`next-empty-${i}`} className="bg-slate-50/50" />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
