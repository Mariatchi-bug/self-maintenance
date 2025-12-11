// src/LogCompletionModal.tsx
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import type { LogData } from './types';

interface Props {
    isOpen: boolean;
    routineName: string;
    onClose: () => void;
    onSave: (data: LogData) => void;
}

export const LogCompletionModal: React.FC<Props> = ({
    isOpen,
    routineName,
    onClose,
    onSave,
}) => {
    const [note, setNote] = useState('');
    const [duration, setDuration] = useState<number | ''>('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize logic
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setPhoto(dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        onSave({
            note: note.trim() || undefined,
            durationMinutes: duration === '' ? undefined : Number(duration),
            photo,
        });
        // Reset
        setNote('');
        setDuration('');
        setPhoto(undefined);
    };

    const modalContent = (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Log {routineName}</h3>

                <label className="modal-field">
                    Note
                    <textarea
                        placeholder="How did it go? Products used?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                    />
                </label>

                <label className="modal-field">
                    Duration (minutes)
                    <input
                        type="number"
                        min="1"
                        placeholder="e.g. 15"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                </label>

                <label className="modal-field">
                    Photo
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="secondary-btn small"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {photo ? 'Change Photo' : 'Attach Photo 📷'}
                    </button>
                </label>

                {photo && (
                    <div className="photo-preview">
                        <img src={photo} alt="Preview" />
                        <button
                            className="remove-photo-btn"
                            onClick={() => setPhoto(undefined)}
                            title="Remove photo"
                            aria-label="Remove attached photo"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="modal-actions">
                    <button className="secondary-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="primary-btn" onClick={handleSave}>
                        Save Log
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
