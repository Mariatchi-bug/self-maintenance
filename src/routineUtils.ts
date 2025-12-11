// src/routineUtils.ts
import type { Routine, FuzzyStatus, Season } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
    return (a.getTime() - b.getTime()) / MS_PER_DAY;
}

export function getEffectiveCadence(routine: Routine, season: Season): number {
    if (routine.cadenceBySeason && routine.cadenceBySeason[season]) {
        return routine.cadenceBySeason[season] as number;
    }
    return routine.cadenceDays;
}

export function getRoutineStatus(
    routine: Routine,
    now: Date,
    season: Season
): {
    status: FuzzyStatus;
    daysSince: number | null;
    daysUntil: number | null;
} {
    const cadence = getEffectiveCadence(routine, season);

    let referenceDate: Date | null = null;

    if (routine.skippedUntil) {
        const skippedUntil = new Date(routine.skippedUntil);
        if (skippedUntil > now) {
            // Treat skippedUntil as the next due anchor
            const daysUntil = daysBetween(skippedUntil, now);
            return {
                status: 'fresh',
                daysSince: null,
                daysUntil,
            };
        }
    }

    if (routine.lastCompletedAt) {
        referenceDate = new Date(routine.lastCompletedAt);
    }

    if (!referenceDate) {
        // Never done before: treat as approaching
        return {
            status: 'approaching',
            daysSince: null,
            daysUntil: null,
        };
    }

    const diff = daysBetween(now, referenceDate); // days since last done
    const freshThreshold = cadence * 0.7;
    const driftThreshold = cadence * 1.1;

    let status: FuzzyStatus;
    if (diff <= freshThreshold) status = 'fresh';
    else if (diff <= driftThreshold) status = 'approaching';
    else status = 'drifted';

    const daysUntil = Math.max(cadence - diff, 0);

    return {
        status,
        daysSince: diff,
        daysUntil,
    };
}
