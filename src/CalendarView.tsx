import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Routine } from './types';

interface Props {
    routines: Routine[];
}

interface DayData {
    date: Date;
    completions: { routineName: string; routineId: string }[];
    isCurrentMonth: boolean;
    isToday: boolean;
}

const getDaysInMonth = (year: number, month: number): DayData[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i);
        days.push({
            date,
            completions: [],
            isCurrentMonth: false,
            isToday: false
        });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const isToday = date.getTime() === today.getTime();

        days.push({
            date,
            completions: [],
            isCurrentMonth: true,
            isToday
        });
    }

    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        days.push({
            date,
            completions: [],
            isCurrentMonth: false,
            isToday: false
        });
    }

    return days;
};

export const CalendarView: React.FC<Props> = ({ routines }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarDays = useMemo(() => {
        const days = getDaysInMonth(year, month);

        // Populate completion data for each day
        routines.forEach(routine => {
            if (routine.history && Array.isArray(routine.history)) {
                routine.history.forEach(event => {
                    const eventDate = new Date(event.date);
                    eventDate.setHours(0, 0, 0, 0);

                    const dayData = days.find(day => day.date.getTime() === eventDate.getTime());
                    if (dayData) {
                        dayData.completions.push({
                            routineName: routine.name,
                            routineId: routine.id
                        });
                    }
                });
            }
        });

        return days;
    }, [routines, year, month]);

    const monthName = new Date(year, month).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
    });

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const modalContent = selectedDay ? (
        <div className="day-details-overlay" onClick={() => setSelectedDay(null)}>
            <div className="day-details-panel" onClick={(e) => e.stopPropagation()}>
                <div className="day-details-header">
                    <h3>
                        {selectedDay.date.toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </h3>
                    <button className="close-btn" onClick={() => setSelectedDay(null)} aria-label="Close details">
                        ×
                    </button>
                </div>
                <div className="day-details-content">
                    <p className="detail-label">{selectedDay.completions.length} routine{selectedDay.completions.length !== 1 ? 's' : ''} completed:</p>
                    <ul className="routine-list">
                        {selectedDay.completions.map((completion, i) => (
                            <li key={`${completion.routineId}-${i}`} className="routine-item">
                                {completion.routineName}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="calendar-view-container">
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={previousMonth}>
                    ← Prev
                </button>
                <h2 className="calendar-title">{monthName}</h2>
                <button className="calendar-nav-btn" onClick={nextMonth}>
                    Next →
                </button>
            </div>

            <button className="today-btn" onClick={goToToday}>
                Today
            </button>

            <div className="calendar-grid">
                {/* Week day headers */}
                {weekDays.map(day => (
                    <div key={day} className="calendar-weekday-header">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((dayData, index) => {
                    const dayNum = dayData.date.getDate();
                    const hasCompletions = dayData.completions.length > 0;

                    return (
                        <div
                            key={index}
                            className={`calendar-day ${!dayData.isCurrentMonth ? 'other-month' : ''} ${dayData.isToday ? 'today' : ''} ${hasCompletions ? 'has-completions' : ''}`}
                            onClick={() => hasCompletions && setSelectedDay(dayData)}
                            role="button"
                            tabIndex={hasCompletions ? 0 : -1}
                            onKeyDown={(e) => {
                                if (hasCompletions && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    setSelectedDay(dayData);
                                }
                            }}
                            aria-label={`${dayData.date.toLocaleDateString()}, ${hasCompletions ? `${dayData.completions.length} routines completed` : 'no activity'}`}
                            aria-disabled={!hasCompletions}
                        >
                            <div className="day-number">{dayNum}</div>
                            {hasCompletions && (
                                <div className="completion-dots">
                                    {dayData.completions.slice(0, 3).map((_, i) => (
                                        <div key={i} className="completion-dot" />
                                    ))}
                                    {dayData.completions.length > 3 && (
                                        <span className="more-count">+{dayData.completions.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {modalContent && ReactDOM.createPortal(modalContent, document.body)}
        </div>
    );
};
