// src/useRoutines.ts
import { useEffect, useState } from 'react';
import type { Routine, Season } from './types';

const STORAGE_KEY = 'self-maintenance-routines-v1';

function loadRoutines(): Routine[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        // Migration: ensure every routine has a history array of CompletionEvents
        return parsed.map((r: any) => {
            let history = Array.isArray(r.history) ? r.history : [];

            // Convert string[] history to CompletionEvent[]
            history = history.map((h: any) => {
                if (typeof h === 'string') return { date: h };
                return h;
            });

            // Handle legacy case: no history but has lastCompletedAt
            if (history.length === 0 && r.lastCompletedAt) {
                history = [{ date: r.lastCompletedAt }];
            }

            return {
                ...r,
                history,
                tags: Array.isArray(r.tags) ? r.tags : [],
                link: r.link || undefined,
            };
        });
    } catch {
        return [];
    }
}

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function saveRoutines(routines: Routine[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
}

export function useRoutines() {
    const [routines, setRoutines] = useState<Routine[]>(() => loadRoutines());

    useEffect(() => {
        saveRoutines(routines);
    }, [routines]);

    const importRoutines = (json: string): boolean => {
        try {
            const parsed = JSON.parse(json);
            if (!Array.isArray(parsed)) {
                throw new Error('Invalid backup file: Not an array');
            }
            // Basic validation: check if items look like routines
            const isValid = parsed.every((r: any) => r.id && r.name && typeof r.cadenceDays === 'number');
            if (!isValid) {
                throw new Error('Invalid backup file: Malformed routines');
            }

            setRoutines(parsed);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const addRoutine = (routine: Omit<Routine, 'id'>) => {
        setRoutines((prev) => [
            ...prev,
            { ...routine, id: generateId(), history: [], tags: routine.tags || [], link: routine.link },
        ]);
    };

    const updateRoutine = (id: string, patch: Partial<Routine>) => {
        setRoutines((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
        );
    };

    const markDone = (id: string, patch: { note?: string; durationMinutes?: number; photo?: string } = {}) => {
        const nowIso = new Date().toISOString();
        setRoutines((prev) =>
            prev.map((r) => {
                if (r.id === id) {
                    const newEvent = {
                        date: nowIso,
                        note: patch.note,
                        durationMinutes: patch.durationMinutes,
                        photo: patch.photo
                    };
                    return {
                        ...r,
                        lastCompletedAt: nowIso,
                        skippedUntil: null,
                        history: [newEvent, ...(r.history || [])],
                    };
                }
                return r;
            })
        );
    };

    const skipUntil = (id: string, days: number) => {
        const now = new Date();
        const skippedUntil = new Date(
            now.getTime() + days * 24 * 60 * 60 * 1000
        ).toISOString();
        updateRoutine(id, { skippedUntil });
    };

    const deleteRoutine = (id: string) => {
        setRoutines((prev) => prev.filter((r) => r.id !== id));
    };

    const updateHistoryEvent = (routineId: string, eventIndex: number, patch: Partial<import('./types').CompletionEvent>) => {
        setRoutines((prev) =>
            prev.map((r) => {
                if (r.id !== routineId) return r;
                const newHistory = [...(r.history || [])];
                if (newHistory[eventIndex]) {
                    newHistory[eventIndex] = { ...newHistory[eventIndex], ...patch };
                }
                // If the most recent one (index 0 usually) changed, update lastCompletedAt?
                // For simplicity, we won't auto-recalculate lastCompletedAt based on history editing unless needed.
                // But if the date changed, we SHOULD re-sort?
                // Let's assume for now we just patch it.
                return { ...r, history: newHistory };
            })
        );
    };

    const deleteHistoryEvent = (routineId: string, eventIndex: number) => {
        setRoutines((prev) =>
            prev.map((r) => {
                if (r.id !== routineId) return r;
                const newHistory = r.history?.filter((_, idx) => idx !== eventIndex) || [];

                // If we deleted the most recent event, we might want to update lastCompletedAt
                // A simple heuristic: take the new first item's date, or null
                let newLastCompleted = r.lastCompletedAt;
                if (eventIndex === 0) { // Assuming history is sorted desc
                    newLastCompleted = newHistory.length > 0 ? newHistory[0].date : null;
                }

                return { ...r, history: newHistory, lastCompletedAt: newLastCompleted };
            })
        );
    };

    const toggleArchive = (id: string) => {
        setRoutines((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, isArchived: !r.isArchived } : r
            )
        );
    };

    return {
        routines,
        addRoutine,
        updateRoutine,
        markDone,
        skipUntil,
        deleteRoutine,
        updateHistoryEvent,
        deleteHistoryEvent,
        toggleArchive,
        importRoutines,
    };
}

const SEASON_STORAGE_KEY = 'self-maintenance-season';

export function useSeason() {
    const [season, setSeason] = useState<Season>(() => {
        const stored = localStorage.getItem(SEASON_STORAGE_KEY);
        if (stored && ['default', 'winter', 'summer'].includes(stored)) {
            return stored as Season;
        }
        return 'default';
    });

    useEffect(() => {
        localStorage.setItem(SEASON_STORAGE_KEY, season);
    }, [season]);

    return { season, setSeason };
}
