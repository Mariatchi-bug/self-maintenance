// src/HistoryView.tsx
import React from 'react';
import type { Routine } from './types';

interface Props {
    routines: Routine[];
}

interface HistoryEvent {
    id: string;
    routineName: string;
    date: Date;
    note?: string;
    durationMinutes?: number;
    photo?: string;
}

export const HistoryView: React.FC<Props> = ({ routines }) => {
    // Flatten all history into a single timeline
    const events: HistoryEvent[] = routines
        .flatMap((r) =>
            (r.history || []).map((eventOrString, index) => {
                const isString = typeof eventOrString === 'string';
                const dateStr = isString ? eventOrString : eventOrString.date;
                const note = isString ? undefined : eventOrString.note;
                const durationMinutes = isString ? undefined : eventOrString.durationMinutes;
                const photo = isString ? undefined : eventOrString.photo;

                return {
                    id: `${r.id}-${index}`,
                    routineName: r.name,
                    date: new Date(dateStr),
                    note,
                    durationMinutes,
                    photo,
                };
            })
        )
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (events.length === 0) {
        return (
            <div className="empty-state">
                <p>No history yet. Complete a routine to start your log!</p>
            </div>
        );
    }

    // Group by "Month Year"
    const grouped: Record<string, HistoryEvent[]> = {};
    events.forEach((event) => {
        const key = event.date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(event);
    });

    return (
        <div className="history-view">
            {Object.entries(grouped).map(([month, monthEvents]) => (
                <div key={month} className="history-group">
                    <h3 className="history-month-header">{month}</h3>
                    <ul className="history-list">
                        {monthEvents.map((event) => (
                            <li key={event.id} className="history-item">
                                <div className="history-content">
                                    <div className="history-info">
                                        <div className="history-header">
                                            <span className="history-name">{event.routineName}</span>
                                            {event.durationMinutes && (
                                                <span className="duration-badge">⏱ {event.durationMinutes}m</span>
                                            )}
                                        </div>
                                        {event.note && <span className="history-note">“{event.note}”</span>}
                                    </div>
                                    <span className="history-date">
                                        {event.date.toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            day: 'numeric',
                                        })}
                                        {' • '}
                                        {event.date.toLocaleTimeString(undefined, {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                {event.photo && (
                                    <div className="history-photo">
                                        <img src={event.photo} alt="Log" loading="lazy" />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};
