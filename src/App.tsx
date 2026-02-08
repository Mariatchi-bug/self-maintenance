// src/App.tsx
import React, { useState } from 'react';
import { useRoutines, useSeason } from './useRoutines';
import { useTheme } from './useTheme';
import { RoutineCard } from './RoutineCard';
import { EditRoutineModal } from './EditRoutineModal';
import type { FrictionLevel, Season, Routine } from './types';
import { HistoryView } from './HistoryView';
import { DashboardView } from './DashboardView';
import { WeeklySummaryView } from './WeeklySummaryView';
import { CalendarView } from './CalendarView';
import { GalleryView } from './GalleryView';
import './App.css';

const frictionOptions: { value: FrictionLevel; label: string }[] = [
  { value: 'low', label: 'Low effort' },
  { value: 'medium', label: 'Medium effort' },
  { value: 'high', label: 'High effort' },
];

const seasonLabels: Record<Season, string> = {
  default: 'Standard',
  winter: 'Winter',
  summer: 'Summer',
};

export const App: React.FC = () => {
  const {
    routines,
    addRoutine,
    updateRoutine,
    markDone,
    skipUntil,
    deleteRoutine,
    updateHistoryEvent,
    toggleArchive,
    importRoutines
  } = useRoutines();
  const { season, setSeason } = useSeason();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'routines' | 'history' | 'dashboard' | 'weekly' | 'calendar' | 'gallery'>('routines');
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = JSON.stringify(routines, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `self-maintenance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importRoutines(content);
        if (success) {
          alert('Backup restored successfully!');
        } else {
          alert('Failed to restore backup. Invalid file.');
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [name, setName] = useState('');
  const [cadenceDays, setCadenceDays] = useState(14);
  const [friction, setFriction] = useState<FrictionLevel>('medium');
  const [tags, setTags] = useState('');
  const [link, setLink] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

    addRoutine({
      name: name.trim(),
      cadenceDays,
      friction,
      lastCompletedAt: null,
      skippedUntil: null,
      history: [],
      cadenceBySeason: undefined,
      tags: tagList,
      link: link.trim() || undefined,
    });

    setName('');
    setCadenceDays(14);
    setFriction('medium');
    setTags('');
    setLink('');
  };

  const headerText =
    routines.length === 0 ? 'Clear start' : 'A brighter day ahead';

  const allTags = Array.from(new Set(routines.flatMap(r => r.tags))).sort();

  const filteredRoutines = activeTag
    ? routines.filter(r => r.tags.includes(activeTag))
    : routines;

  const activeRoutines = filteredRoutines.filter(r => !r.isArchived);
  const archivedRoutines = filteredRoutines.filter(r => r.isArchived);

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div className="header-text-block">
            <h1>{headerText}</h1>
            <p>
              Gently keep track of the small rhythms that help you feel like
              yourself.
            </p>
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="header-blob" />
        </header>

        <section className="control-bar">
          <div className="view-toggle">
            <button
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={activeTab === 'routines' ? 'active' : ''}
              onClick={() => setActiveTab('routines')}
            >
              Routines
            </button>
            <button
              className={activeTab === 'weekly' ? 'active' : ''}
              onClick={() => setActiveTab('weekly')}
            >
              Weekly
            </button>
            <button
              className={activeTab === 'calendar' ? 'active' : ''}
              onClick={() => setActiveTab('calendar')}
            >
              Calendar
            </button>
            <button
              className={activeTab === 'gallery' ? 'active' : ''}
              onClick={() => setActiveTab('gallery')}
            >
              Gallery
            </button>
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>

          <div className="season-select">
            <span>Season</span>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as Season)}
            >
              {Object.entries(seasonLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <main>
          {activeTab === 'routines' ? (
            <section className="routines-section">
              {allTags.length > 0 && (
                <div className="tag-filter-bar">
                  <button
                    className={`filter-pill ${activeTag === null ? 'active' : ''}`}
                    onClick={() => setActiveTag(null)}
                  >
                    All
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      className={`filter-pill ${activeTag === tag ? 'active' : ''}`}
                      onClick={() => setActiveTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {filteredRoutines.length === 0 ? (
                <div className="empty-state">
                  <p>
                    {activeTag
                      ? `No rhythms found for "${activeTag}".`
                      : 'Add your first rhythm — brows, nails, hair, skincare…'}
                  </p>
                </div>
              ) : (
                <div className="routines-list">
                  {activeRoutines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      season={season}
                      onDone={(data) => markDone(routine.id, data)}
                      onSkip={(days) => skipUntil(routine.id, days)}
                      onEdit={() => setEditingRoutine(routine)}
                    />
                  ))}
                </div>
              )}
              <div style={{ marginTop: '32px' }}>
                {archivedRoutines.length > 0 && (
                  <details className="idle-section">
                    <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                      Idle / Paused Rhythms ({archivedRoutines.length})
                    </summary>
                    <div className="routines-list" style={{ opacity: 0.8 }}>
                      {archivedRoutines.map((routine) => (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          season={season}
                          onDone={(data) => markDone(routine.id, data)}
                          onSkip={(days) => skipUntil(routine.id, days)}
                          onEdit={() => setEditingRoutine(routine)}
                        />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </section>

          ) : activeTab === 'history' ? (
            <section className="history-section">
              <HistoryView
                routines={routines}
                onEditLog={updateHistoryEvent}
              />
            </section>
          ) : activeTab === 'weekly' ? (
            <section className="weekly-section">
              <WeeklySummaryView routines={routines} />
            </section>
          ) : activeTab === 'calendar' ? (
            <section className="calendar-section">
              <CalendarView routines={routines} />
            </section>
          ) : activeTab === 'gallery' ? (
            <section className="gallery-section">
              <GalleryView routines={routines} />
            </section>
          ) : (
            <section className="dashboard-section">
              <DashboardView routines={routines} />
            </section>
          )}

          {activeTab === 'routines' && (
            <section className="add-section">
              <h2>Add a rhythm</h2>
              <form className="add-form" onSubmit={handleAdd}>
                <input
                  type="text"
                  placeholder="Routine name (e.g. Brows, Nails)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="add-row">
                  <label>
                    Every
                    <input
                      type="number"
                      min={1}
                      value={cadenceDays}
                      onChange={(e) =>
                        setCadenceDays(Number(e.target.value) || 1)
                      }
                    />
                    days
                  </label>

                  <label>
                    Effort
                    <select
                      value={friction}
                      onChange={(e) =>
                        setFriction(e.target.value as FrictionLevel)
                      }
                    >
                      {frictionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="add-row">
                  <input
                    type="text"
                    placeholder="Tags (comma separated, e.g. Face, AM)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="flex-input"
                  />
                  <input
                    type="text"
                    placeholder="Link (optional product URL)"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="flex-input"
                  />
                </div>

                <button type="submit" className="primary-btn wide">
                  Save routine
                </button>
              </form>
            </section>
          )}
        </main>

        <section className="data-section">
          <h3>Data Management</h3>
          <p>Keep your data safe or move it to another device.</p>
          <div className="data-controls">
            <button className="secondary-btn small" onClick={handleExport}>
              Export Backup
            </button>
            <button className="secondary-btn small" onClick={handleImportClick}>
              Import Backup
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </section>

        {editingRoutine && (
          <EditRoutineModal
            isOpen={true}
            routine={editingRoutine}
            onClose={() => setEditingRoutine(null)}
            onSave={updateRoutine}
            onDelete={deleteRoutine}
            onArchive={toggleArchive}
          />
        )}
      </div>
    </div >
  );
};

export default App;
