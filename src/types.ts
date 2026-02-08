// src/types.ts

export type FrictionLevel = 'low' | 'medium' | 'high';
export type FuzzyStatus = 'fresh' | 'approaching' | 'drifted';
export type Season = 'default' | 'winter' | 'summer';

export interface CompletionEvent {
  date: string; // ISO string
  note?: string;
  durationMinutes?: number;
  photo?: string; // Base64 Data URI
}

export interface LogData {
  note?: string;
  durationMinutes?: number;
  photo?: string;
}

export interface Routine {
  id: string;
  name: string;
  cadenceDays: number; // base cadence in days
  friction: FrictionLevel;
  link?: string;
  tags: string[];
  lastCompletedAt: string | null; // ISO string
  skippedUntil: string | null; // ISO string, for postponing on purpose
  history: CompletionEvent[]; // Log of all completion events
  cadenceBySeason?: Partial<Record<Season, number>>; // optional overrides
  isArchived?: boolean;
}
