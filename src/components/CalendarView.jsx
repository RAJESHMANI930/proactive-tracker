import { useState, useMemo } from 'react';
import { timestampToDisplay } from '../utils/dateHelpers';

const DONE_STATUSES = new Set(['Completed', 'Done', 'Skipped', 'Incomplete']);

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function sameDay(date, year, month, day) {
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

export default function CalendarView({ tasks, onDaySelect }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const { firstDay, daysInMonth } = getMonthDays(year, month);

  // Build a map of day → tasks
  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.deadline) return;
      const d = new Date(t.deadline.seconds * 1000);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks, year, month]);

  const monthName = new Date(year, month).toLocaleDateString([], { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day === selectedDay ? null : day);
    onDaySelect?.(day ? new Date(year, month, day) : null);
  };

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] || []) : [];

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-white">{monthName}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[11px] text-white/30 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const dayTasks = tasksByDay[day] || [];
          const isToday = sameDay(today, year, month, day);
          const isSelected = selectedDay === day;
          const hasPending = dayTasks.some(t => !DONE_STATUSES.has(t.status));
          const hasDone = dayTasks.some(t => DONE_STATUSES.has(t.status));
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all
                ${isSelected ? 'bg-indigo-600 text-white' : isToday ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}
              `}
            >
              {day}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasPending && <span className="w-1 h-1 rounded-full bg-orange-400" />}
                  {hasDone && <span className="w-1 h-1 rounded-full bg-green-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day task list */}
      {selectedDay && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-white/40">
            {new Date(year, month, selectedDay).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-white/30">No tasks scheduled for this day.</p>
          ) : selectedTasks.map(t => (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{t.title}</p>
                <p className="text-[11px] text-white/40">{t.priority} · {t.status} · {timestampToDisplay(t.deadline)}</p>
              </div>
              {DONE_STATUSES.has(t.status)
                ? <span className="text-green-400 text-[10px] font-bold uppercase">{t.status}</span>
                : <span className="text-orange-400 text-[10px] font-bold uppercase">Pending</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
