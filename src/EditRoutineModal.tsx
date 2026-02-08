import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Routine, FrictionLevel } from './types';

interface Props {
    isOpen: boolean;
    routine: Routine;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Routine>) => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
}

const frictionOptions: { value: FrictionLevel; label: string }[] = [
    { value: 'low', label: 'Low effort' },
    { value: 'medium', label: 'Medium effort' },
    { value: 'high', label: 'High effort' },
];

export const EditRoutineModal: React.FC<Props> = ({ isOpen, routine, onClose, onSave, onDelete, onArchive }) => {
    const [name, setName] = useState(routine.name);
    const [cadenceDays, setCadenceDays] = useState(routine.cadenceDays);
    const [friction, setFriction] = useState<FrictionLevel>(routine.friction);
    const [tags, setTags] = useState(routine.tags?.join(', ') || '');
    const [link, setLink] = useState(routine.link || '');

    // Reset state when routine changes
    useEffect(() => {
        setName(routine.name);
        setCadenceDays(routine.cadenceDays);
        setFriction(routine.friction);
        setTags(routine.tags?.join(', ') || '');
        setLink(routine.link || '');
    }, [routine]);

    if (!isOpen) return null;

    const handleSave = () => {
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
        onSave(routine.id, {
            name: name.trim(),
            cadenceDays: Number(cadenceDays),
            friction,
            tags: tagList,
            link: link.trim() || undefined,
        });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this routine? This action cannot be undone.')) {
            onDelete(routine.id);
            onClose();
        }
    };

    const handleArchive = () => {
        onArchive(routine.id);
        onClose();
    };

    const modalContent = (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Edit Routine</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="secondary-btn small"
                            onClick={handleArchive}
                            title={routine.isArchived ? "Restore to active list" : "Move to Idle list"}
                        >
                            {routine.isArchived ? 'Activate' : 'Pause'}
                        </button>
                        <button
                            className="secondary-btn small"
                            style={{ color: 'var(--color-accent-red)', borderColor: 'var(--color-accent-red)' }}
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <label className="modal-field">
                    Name
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                <div className="add-row">
                    <label className="modal-field" style={{ flex: 1 }}>
                        Every (days)
                        <input
                            type="number"
                            min="1"
                            value={cadenceDays}
                            onChange={(e) => setCadenceDays(Number(e.target.value))}
                        />
                    </label>

                    <label className="modal-field" style={{ flex: 1 }}>
                        Effort
                        <select
                            value={friction}
                            onChange={(e) => setFriction(e.target.value as FrictionLevel)}
                        >
                            {frictionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="modal-field">
                    Tags (comma separated)
                    <input
                        type="text"
                        value={tags}
                        placeholder="e.g. Face, PM"
                        onChange={(e) => setTags(e.target.value)}
                    />
                </label>

                <label className="modal-field">
                    Product Link
                    <input
                        type="text"
                        value={link}
                        placeholder="https://..."
                        onChange={(e) => setLink(e.target.value)}
                    />
                </label>

                <div className="modal-actions">
                    <button className="secondary-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="primary-btn" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
