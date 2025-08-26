import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Eye } from 'lucide-react';
import './NoteCard.css';

const NoteCard = memo(({ 
  note, 
  onDelete, 
  onSelect, 
  isSelected = false,
  viewMode = 'grid',
  showActions = true,
  className = ''
}) => {
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(note.id);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(note.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`note-card ${viewMode} ${className} ${isSelected ? 'selected' : ''}`}>
      {showActions && (
        <div className="note-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            aria-label={`Select ${note.title}`}
          />
        </div>
      )}
      
      <div className="note-header">
        <h3 className="note-title">{note.title}</h3>
        <div className="note-meta">
          <span className="note-date" title={new Date(note.updated_at).toLocaleString()}>
            {formatDate(note.updated_at)}
          </span>
        </div>
      </div>
      
      <div className="note-content">
        {truncateContent(note.content)}
      </div>
      
      {showActions && (
        <div className="note-actions">
          <Link 
            to={`/notes/${note.id}`}
            className="btn btn-sm btn-secondary"
            title="View note"
            aria-label={`View ${note.title}`}
          >
            <Eye size={16} />
            <span>View</span>
          </Link>
          <Link 
            to={`/notes/${note.id}/edit`} 
            className="btn btn-sm btn-secondary"
            title="Edit note"
            aria-label={`Edit ${note.title}`}
          >
            <Edit size={16} />
            <span>Edit</span>
          </Link>
          <button 
            onClick={handleDelete}
            className="btn btn-sm btn-danger"
            title="Delete note"
            aria-label={`Delete ${note.title}`}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.title === nextProps.note.title &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.updated_at === nextProps.note.updated_at &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.showActions === nextProps.showActions
  );
});

NoteCard.displayName = 'NoteCard';

export default NoteCard;