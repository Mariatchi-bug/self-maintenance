// src/RoutineCard.tsx
import React, { useState } from 'react';
import type { Routine, Season, LogData } from './types';
import { getRoutineStatus } from './routineUtils';
import { LogCompletionModal } from './LogCompletionModal';

interface Props {
    routine: Routine;
    season: Season;
    onDone: (data: LogData) => void;
    onSkip: (days: number) => void;
    onEdit: () => void;
}

export const RoutineCard: React.FC<Props> = ({
    routine,
    season,
    onDone,
    onSkip,
    onEdit,
}) => {
    const [showModal, setShowModal] = useState(false);
    const { status, daysSince, daysUntil } = getRoutineStatus(routine, new Date(), season);

    const statusLabel =
        status === 'fresh'
            ? 'In rhythm'
            : status === 'approaching'
                ? 'Coming up'
                : 'Drifted a bit';

    const badgeClass =
        status === 'fresh'
            ? 'status-badge fresh'
            : status === 'approaching'
                ? 'status-badge approaching'
                : 'status-badge drifted';

    const frictionLabel =
        routine.friction === 'low'
            ? 'Low effort'
            : routine.friction === 'medium'
                ? 'Medium effort'
                : 'High effort';

    const timingText = (() => {
        if (daysSince === null && daysUntil === null) {
            return 'Not done yet';
        }
        if (daysSince !== null) {
            const rounded = Math.floor(daysSince);
            if (rounded === 0) return 'Done today';
            if (rounded === 1) return '1 day ago';
            return `${rounded} days ago`;
        }
        if (daysUntil !== null) {
            const rounded = Math.ceil(daysUntil);
            if (rounded === 0) return 'Due now';
            if (rounded === 1) return 'In 1 day';
            return `In ~${rounded} days`;
        }
        return '';
    })();

    const handleQuickDone = () => {
        onDone({});
    };

    const handleLogSave = (data: LogData) => {
        onDone(data);
        setShowModal(false);
    };

    return (
        <div className="routine-card">
            <div className="routine-header">
                <div className="header-top-row">
                    <span className={badgeClass}>{statusLabel}</span>
                    {routine.tags && routine.tags.length > 0 && (
                        <div className="card-tags">
                            {routine.tags.map((tag) => (
                                <span key={tag} className="card-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <button
                        className="edit-icon-btn"
                        onClick={onEdit}
                        title="Edit Routine"
                        aria-label="Edit Routine"
                    >
                        ✎
                    </button>
                </div>
                <div className="title-row">
                    <span className="routine-name">{routine.name}</span>
                    {routine.link && (
                        <a
                            href={routine.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-icon"
                            title="Open Link"
                        >
                            ↗
                        </a>
                    )}
                </div>
            </div>

            <div className="routine-meta">
                <span className="timing-text">{timingText}</span>
                <span className="friction-text">{frictionLabel}</span>
            </div>

            <div className="routine-actions">
                <button className="primary-btn" onClick={handleQuickDone}>
                    Done
                </button>
                <button
                    className="secondary-btn"
                    onClick={() => setShowModal(true)}
                    title="Log with details"
                    aria-label="Log completion with details"
                >
                    📝
                </button>
                <button
                    className="secondary-btn"
                    onClick={() => onSkip(7)}
                    title="Postpone by a week"
                    aria-label="Postpone routine by 7 days"
                >
                    Skip 7d
                </button>
            </div>

            <LogCompletionModal
                isOpen={showModal}
                routineName={routine.name}
                onClose={() => setShowModal(false)}
                onSave={handleLogSave}
            />
        </div>
    );
};
