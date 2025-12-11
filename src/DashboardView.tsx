import React, { useMemo } from 'react';
import type { Routine, CompletionEvent } from './types';


interface DashboardViewProps {
  routines: Routine[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ routines }) => {

  // --- Derived State ---

  if (!routines || !Array.isArray(routines)) {
    return null; // Or some loading/error state
  }

  const {
    dueTodayCount,
    completedTodayCount,
    totalRoutines,
    needsAttention,
    recentActivity
  } = useMemo(() => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      let dueToday = 0;
      let completedToday = 0;

      const attentionList: { routine: Routine; overdueDays: number }[] = [];
      const _recentActivity: { routineName: string; event: CompletionEvent; routineId: string }[] = [];

      routines.forEach(r => {
        if (!r) return;

        // Stats: Completed Today
        if (r.lastCompletedAt && r.lastCompletedAt.startsWith(todayStr)) {
          completedToday++;
        }

        // Stats: Due Today
        const last = r.lastCompletedAt ? new Date(r.lastCompletedAt).getTime() : 0;
        const nextDue = last + ((r.cadenceDays || 1) * 24 * 60 * 60 * 1000);

        // If skipped
        const skippedUntilTime = r.skippedUntil ? new Date(r.skippedUntil).getTime() : 0;
        const effectiveDue = Math.max(nextDue, skippedUntilTime);

        if (!isNaN(effectiveDue) && effectiveDue <= Date.now()) {
          dueToday++;

          const overdueMs = Date.now() - effectiveDue;
          const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
          attentionList.push({ routine: r, overdueDays });
        }

        // Collect History
        if (Array.isArray(r.history)) {
          r.history.forEach(h => {
            if (h && h.date) {
              _recentActivity.push({ routineName: r.name, event: h, routineId: r.id });
            }
          });
        }
      });

      // Sort Needs Attention by overdue days desc
      attentionList.sort((a, b) => b.overdueDays - a.overdueDays);

      // Sort Recent Activity by date desc, take top 20
      _recentActivity.sort((a, b) => {
        const dA = new Date(a.event.date).getTime();
        const dB = new Date(b.event.date).getTime();
        return (isNaN(dB) ? 0 : dB) - (isNaN(dA) ? 0 : dA);
      });
      const topActivity = _recentActivity.slice(0, 10);

      return {
        dueTodayCount: dueToday,
        completedTodayCount: completedToday,
        totalRoutines: routines.length,
        needsAttention: attentionList,
        recentActivity: topActivity
      };
    } catch (e) {
      console.error("Dashboard calculation error", e);
      return {
        dueTodayCount: 0,
        completedTodayCount: 0,
        totalRoutines: 0,
        needsAttention: [],
        recentActivity: []
      };
    }
  }, [routines]);



  // --- Render ---

  return (
    <div className="dashboard-container">
      {/* 1. Overview Cards */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <h3>Due Today</h3>
          <div className="stat-value highlight">{dueTodayCount}</div>
        </div>
        <div className="stat-card">
          <h3>Done Today</h3>
          <div className="stat-value">{completedTodayCount}</div>
        </div>
        <div className="stat-card">
          <h3>Total Rhythms</h3>
          <div className="stat-value">{totalRoutines}</div>
        </div>
      </section>

      <div className="dashboard-main-columns">
        {/* 2. Needs Attention (Left/Main Column) */}
        <section className="dashboard-column urgent-column">
          <h2>Needs Attention</h2>
          {needsAttention.length === 0 ? (
            <div className="empty-dashboard-state">
              <p>Nothing due right now. You're all caught up!</p>
            </div>
          ) : (
            <div className="attention-list">
              {needsAttention.map(({ routine, overdueDays }) => (
                <div key={routine.id} className="attention-card">
                  <div className="attention-info">
                    <span className="attention-name">{routine.name}</span>
                    <span className="attention-sub">
                      {overdueDays <= 0 ? 'Due today' : `${overdueDays} days overdue`}
                    </span>
                  </div>
                  {/* We could add a quick 'Mark Done' button here later, but for now simple view */}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Recent Activity (Right/Side Column) */}
        <section className="dashboard-column activity-column">
          <h2>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="dim-text">No activity recorded yet.</p>
          ) : (
            <div className="activity-feed">
              {recentActivity.map((item, idx) => {
                const dateObj = new Date(item.event.date);
                const dateStr = dateObj.toLocaleDateString();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={`${item.routineId}-${idx}`} className="activity-item">
                    <div className="activity-header">
                      <strong>{item.routineName}</strong>
                      <span className="activity-date">{dateStr} {timeStr}</span>
                    </div>
                    {item.event.note && <div className="activity-note">"{item.event.note}"</div>}
                    {item.event.photo && (
                      <div className="activity-photo-preview">
                        <img src={item.event.photo} alt={`Photo for ${item.routineName}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
