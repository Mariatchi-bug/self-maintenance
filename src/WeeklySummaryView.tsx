// src/WeeklySummaryView.tsx
import React, { useMemo, useState } from 'react';
import type { Routine } from './types';

interface Props {
    routines: Routine[];
}

interface WeekData {
    startDate: Date;
    endDate: Date;
    completionRate: number;
    totalCompletions: number;
    totalTimeMinutes: number;
    mostConsistentRoutines: { name: string; completions: number; possible: number }[];
    comparisonToPrevious: number; // percentage change
}

const getWeekBounds = (weekOffset: number = 0): { start: Date; end: Date } => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek - weekOffset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

const calculateWeekData = (routines: Routine[], weekOffset: number): WeekData => {
    const { start, end } = getWeekBounds(weekOffset);

    let totalCompletions = 0;
    let totalTimeMinutes = 0;
    let totalPossibleCompletions = 0;

    const routineStats: Map<string, { completions: number; possible: number }> = new Map();

    routines.forEach(routine => {
        // How many times should this routine have been done in this week?
        const daysInWeek = 7;
        const possibleInWeek = Math.floor(daysInWeek / routine.cadenceDays);
        totalPossibleCompletions += possibleInWeek;

        // Count actual completions in this week
        let completionsInWeek = 0;
        let timeInWeek = 0;

        if (routine.history && Array.isArray(routine.history)) {
            routine.history.forEach(event => {
                const eventDate = new Date(event.date);
                if (eventDate >= start && eventDate <= end) {
                    completionsInWeek++;
                    if (event.durationMinutes) {
                        timeInWeek += event.durationMinutes;
                    }
                }
            });
        }

        totalCompletions += completionsInWeek;
        totalTimeMinutes += timeInWeek;

        if (possibleInWeek > 0) {
            routineStats.set(routine.name, {
                completions: completionsInWeek,
                possible: possibleInWeek
            });
        }
    });

    const completionRate = totalPossibleCompletions > 0
        ? (totalCompletions / totalPossibleCompletions) * 100
        : 0;

    // Get most consistent routines (highest completion rate)
    const sortedRoutines = Array.from(routineStats.entries())
        .map(([name, stats]) => ({
            name,
            completions: stats.completions,
            possible: stats.possible,
            rate: stats.possible > 0 ? (stats.completions / stats.possible) * 100 : 0
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5);

    // Calculate previous week for comparison
    const prevWeekData = calculatePreviousWeekRate(routines, weekOffset + 1);
    const comparisonToPrevious = prevWeekData > 0
        ? ((completionRate - prevWeekData) / prevWeekData) * 100
        : 0;

    return {
        startDate: start,
        endDate: end,
        completionRate,
        totalCompletions,
        totalTimeMinutes,
        mostConsistentRoutines: sortedRoutines,
        comparisonToPrevious
    };
};

const calculatePreviousWeekRate = (routines: Routine[], weekOffset: number): number => {
    const { start, end } = getWeekBounds(weekOffset);

    let totalCompletions = 0;
    let totalPossibleCompletions = 0;

    routines.forEach(routine => {
        const daysInWeek = 7;
        const possibleInWeek = Math.floor(daysInWeek / routine.cadenceDays);
        totalPossibleCompletions += possibleInWeek;

        if (routine.history && Array.isArray(routine.history)) {
            routine.history.forEach(event => {
                const eventDate = new Date(event.date);
                if (eventDate >= start && eventDate <= end) {
                    totalCompletions++;
                }
            });
        }
    });

    return totalPossibleCompletions > 0
        ? (totalCompletions / totalPossibleCompletions) * 100
        : 0;
};

export const WeeklySummaryView: React.FC<Props> = ({ routines }) => {
    const [weekOffset, setWeekOffset] = useState(0);

    const weekData = useMemo(() =>
        calculateWeekData(routines, weekOffset),
        [routines, weekOffset]
    );

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const isCurrentWeek = weekOffset === 0;

    return (
        <div className="weekly-summary-container">
            <div className="week-navigation">
                <button
                    className="week-nav-btn"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    aria-label="Previous week"
                >
                    ← Previous
                </button>
                <h2 className="week-title">
                    {isCurrentWeek ? 'This Week' : 'Week of'} {formatDate(weekData.startDate)} - {formatDate(weekData.endDate)}
                </h2>
                <button
                    className="week-nav-btn"
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                    disabled={isCurrentWeek}
                    aria-label="Next week"
                >
                    Next →
                </button>
            </div>

            <div className="weekly-stats-grid">
                <div className="weekly-stat-card highlight-card">
                    <h3>Completion Rate</h3>
                    <div className="weekly-stat-value">
                        {weekData.completionRate.toFixed(0)}%
                    </div>
                    {!isNaN(weekData.comparisonToPrevious) && weekData.comparisonToPrevious !== 0 && (
                        <div className={`trend-indicator ${weekData.comparisonToPrevious > 0 ? 'positive' : 'negative'}`}>
                            {weekData.comparisonToPrevious > 0 ? '↑' : '↓'}
                            {Math.abs(weekData.comparisonToPrevious).toFixed(1)}% vs last week
                        </div>
                    )}
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(100, weekData.completionRate)}%` }}
                        />
                    </div>
                </div>

                <div className="weekly-stat-card">
                    <h3>Total Completions</h3>
                    <div className="weekly-stat-value">{weekData.totalCompletions}</div>
                    <div className="stat-subtitle">routines completed</div>
                </div>

                <div className="weekly-stat-card">
                    <h3>Time Invested</h3>
                    <div className="weekly-stat-value">
                        {weekData.totalTimeMinutes > 0 ? formatTime(weekData.totalTimeMinutes) : '—'}
                    </div>
                    <div className="stat-subtitle">across all routines</div>
                </div>
            </div>

            {weekData.mostConsistentRoutines.length > 0 && (
                <div className="consistent-routines-section">
                    <h3>Most Consistent Routines</h3>
                    <div className="routines-ranking">
                        {weekData.mostConsistentRoutines.map((routine, index) => {
                            const rate = routine.possible > 0
                                ? (routine.completions / routine.possible) * 100
                                : 0;

                            return (
                                <div key={routine.name} className="ranking-item">
                                    <div className="ranking-badge">{index + 1}</div>
                                    <div className="ranking-info">
                                        <span className="ranking-name">{routine.name}</span>
                                        <span className="ranking-detail">
                                            {routine.completions} / {routine.possible} completed
                                        </span>
                                    </div>
                                    <div className="ranking-rate">{rate.toFixed(0)}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {weekData.totalCompletions === 0 && (
                <div className="empty-week-state">
                    <p>No routines completed this week yet.</p>
                    <p className="muted-text">Start completing your rhythms to see your progress here!</p>
                </div>
            )}
        </div>
    );
};
