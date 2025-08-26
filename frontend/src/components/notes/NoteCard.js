import React from 'react';
import { Edit, Trash2, Calendar, Clock } from 'lucide-react';
import './NoteCard.css';

const NoteCard = ({ note, onEdit, onDelete }) => {
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Truncate content for preview
  const getContentPreview = (content) => {
    if (!content) return 'No content';
    const maxLength = 150;
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  };

  // Handle edit click
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(note.id);
  };

  // Handle delete click
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  // Handle card click (edit note)
  const handleCardClick = () => {
    onEdit(note.id);
  };

  return (
    <div className="note-card" onClick={handleCardClick}>
      <div className="note-card-header">
        <h3 className="note-title" title={note.title}>
          {note.title}
        </h3>
        <div className="note-actions">
          <button
            className="note-action-btn edit-btn"
            onClick={handleEdit}
            title="Edit note"
            aria-label="Edit note"
          >
            <Edit size={16} />
          </button>
          <button
            className="note-action-btn delete-btn"
            onClick={handleDelete}
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="note-content">
        <p className="note-preview">
          {getContentPreview(note.content)}
        </p>
      </div>

      <div className="note-card-footer">
        <div className="note-meta">
          <div className="note-date created">
            <Calendar size={14} />
            <span>Created {formatDate(note.created_at)}</span>
          </div>
          <div className="note-date updated">
            <Clock size={14} />
            <span>Updated {formatDate(note.updated_at)}</span>
          </div>
        </div>
        
        {note.version > 1 && (
          <div className="note-version">
            v{note.version}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCard;