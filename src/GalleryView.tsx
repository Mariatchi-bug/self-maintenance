// src/GalleryView.tsx
import React, { useMemo, useState } from 'react';
import type { Routine } from './types';

interface Props {
    routines: Routine[];
}

interface PhotoEntry {
    routineName: string;
    routineId: string;
    photo: string;
    date: Date;
    note?: string;
    durationMinutes?: number;
}

export const GalleryView: React.FC<Props> = ({ routines }) => {
    const [selectedRoutine, setSelectedRoutine] = useState<string>('all');
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

    const photos = useMemo(() => {
        const entries: PhotoEntry[] = [];

        routines.forEach(routine => {
            if (routine.history && Array.isArray(routine.history)) {
                routine.history.forEach(event => {
                    if (event.photo) {
                        entries.push({
                            routineName: routine.name,
                            routineId: routine.id,
                            photo: event.photo,
                            date: new Date(event.date),
                            note: event.note,
                            durationMinutes: event.durationMinutes
                        });
                    }
                });
            }
        });

        // Sort by date descending (newest first)
        entries.sort((a, b) => b.date.getTime() - a.date.getTime());

        return entries;
    }, [routines]);

    const filteredPhotos = useMemo(() => {
        if (selectedRoutine === 'all') return photos;
        return photos.filter(p => p.routineId === selectedRoutine);
    }, [photos, selectedRoutine]);

    const routinesWithPhotos = useMemo(() => {
        const routineMap = new Map<string, { id: string; name: string; count: number }>();

        photos.forEach(photo => {
            if (routineMap.has(photo.routineId)) {
                routineMap.get(photo.routineId)!.count++;
            } else {
                routineMap.set(photo.routineId, {
                    id: photo.routineId,
                    name: photo.routineName,
                    count: 1
                });
            }
        });

        return Array.from(routineMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [photos]);

    if (photos.length === 0) {
        return (
            <div className="empty-gallery-state">
                <div className="empty-gallery-icon">📸</div>
                <h3>No photos yet</h3>
                <p>Complete routines with photos to build your before/after gallery!</p>
            </div>
        );
    }

    return (
        <div className="gallery-container">
            <div className="gallery-controls">
                <div className="gallery-filter">
                    <label htmlFor="routine-filter">Filter by routine:</label>
                    <select
                        id="routine-filter"
                        value={selectedRoutine}
                        onChange={(e) => setSelectedRoutine(e.target.value)}
                        className="routine-filter-select"
                    >
                        <option value="all">All Routines ({photos.length})</option>
                        {routinesWithPhotos.map(routine => (
                            <option key={routine.id} value={routine.id}>
                                {routine.name} ({routine.count})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="view-mode-toggle">
                    <button
                        className={viewMode === 'grid' ? 'active' : ''}
                        onClick={() => setViewMode('grid')}
                    >
                        Grid
                    </button>
                    <button
                        className={viewMode === 'timeline' ? 'active' : ''}
                        onClick={() => setViewMode('timeline')}
                    >
                        Timeline
                    </button>
                </div>
            </div>

            {filteredPhotos.length === 0 ? (
                <div className="no-photos-message">
                    <p>No photos for this routine yet.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="photo-grid">
                    {filteredPhotos.map((photo, index) => (
                        <div
                            key={`${photo.routineId}-${index}`}
                            className="photo-grid-item"
                            onClick={() => setSelectedPhoto(photo)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedPhoto(photo);
                                }
                            }}
                            aria-label={`View photo for ${photo.routineName} from ${photo.date.toLocaleDateString()}`}
                        >
                            <img src={photo.photo} alt={`${photo.routineName} - ${photo.date.toLocaleDateString()}`} />
                            <div className="photo-overlay">
                                <div className="photo-info">
                                    <span className="photo-routine">{photo.routineName}</span>
                                    <span className="photo-date">{photo.date.toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="photo-timeline">
                    {filteredPhotos.map((photo, index) => (
                        <div key={`${photo.routineId}-${index}`} className="timeline-entry">
                            <div className="timeline-date-marker">
                                <div className="timeline-dot" />
                                <span className="timeline-date">
                                    {photo.date.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div
                                className="timeline-content"
                                onClick={() => setSelectedPhoto(photo)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedPhoto(photo);
                                    }
                                }}
                                aria-label={`View photo for ${photo.routineName} from ${photo.date.toLocaleDateString()}`}
                            >
                                <img src={photo.photo} alt={photo.routineName} />
                                <div className="timeline-details">
                                    <h4>{photo.routineName}</h4>
                                    {photo.note && <p className="timeline-note">"{photo.note}"</p>}
                                    {photo.durationMinutes && (
                                        <span className="timeline-duration">⏱ {photo.durationMinutes}m</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {selectedPhoto && (
                <div className="lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setSelectedPhoto(null)} aria-label="Close photo">
                            ×
                        </button>
                        <img src={selectedPhoto.photo} alt={selectedPhoto.routineName} />
                        <div className="lightbox-info">
                            <h3>{selectedPhoto.routineName}</h3>
                            <p className="lightbox-date">
                                {selectedPhoto.date.toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            {selectedPhoto.note && <p className="lightbox-note">"{selectedPhoto.note}"</p>}
                            {selectedPhoto.durationMinutes && (
                                <p className="lightbox-duration">Duration: {selectedPhoto.durationMinutes} minutes</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
