import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes, useAuth } from '../hooks';
import { validateNoteTitle, validateNoteContent } from '../utils/validation';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay, { FieldError } from '../components/ui/ErrorDisplay';
import Header from '../components/layout/Header';
import { Save, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import './NoteEditor.css';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: 1
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [conflictData, setConflictData] = useState(null);

  const { 
    currentNote, 
    isLoading, 
    error, 
    loadNote, 
    createNote, 
    updateNote, 
    clearError,
    handleConflict
  } = useNotes();

  const { user } = useAuth();

  // Load note data if editing
  useEffect(() => {
    if (isEditing && id) {
      loadNote(parseInt(id));
    }
  }, [isEditing, id, loadNote]);

  // Set form data when note is loaded
  useEffect(() => {
    if (isEditing && currentNote && currentNote.id === parseInt(id)) {
      setFormData({
        title: currentNote.title,
        content: currentNote.content || '',
        version: currentNote.version
      });
      setLastSaved(new Date(currentNote.updated_at));
    }
  }, [isEditing, currentNote, id]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const titleError = validateNoteTitle(formData.title);
    const contentError = validateNoteContent(formData.content);

    const newErrors = {};
    if (titleError) {
      newErrors.title = titleError;
    }
    if (contentError) {
      newErrors.content = contentError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save note
  const saveNote = useCallback(async (showSuccessMessage = true) => {
    if (!validateForm()) {
      return false;
    }

    setIsSaving(true);
    
    try {
      if (isEditing) {
        await updateNote(parseInt(id), formData);
        setLastSaved(new Date());
      } else {
        const newNote = await createNote(formData);
        // Redirect to edit mode for the new note
        navigate(`/notes/${newNote.id}/edit`, { replace: true });
        setLastSaved(new Date());
      }
      
      setHasUnsavedChanges(false);
      return true;
    } catch (err) {
      if (err.message === 'CONFLICT') {
        // Handle optimistic locking conflict
        setConflictData({
          localNote: formData,
          serverNote: null // Will be fetched by handleConflict
        });
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, id, updateNote, createNote, navigate, validateForm]);

  // Handle save button click
  const handleSave = useCallback(() => {
    saveNote();
  }, [saveNote]);

  // Handle cancel/back
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmLeave) {
        return;
      }
    }
    navigate('/dashboard');
  }, [hasUnsavedChanges, navigate]);

  // Handle conflict resolution
  const handleConflictResolution = async (useServerVersion = false) => {
    if (!conflictData) return;

    if (useServerVersion) {
      // Reload the note from server
      try {
        await loadNote(parseInt(id));
        setConflictData(null);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Failed to reload note:', err);
      }
    } else {
      // Keep local changes and try to save again
      // First, we need to get the latest version from server
      try {
        const serverNote = await handleConflict(parseInt(id), formData);
        setFormData(prev => ({
          ...prev,
          version: serverNote.version
        }));
        setConflictData(null);
        // Try saving again with updated version
        saveNote();
      } catch (err) {
        console.error('Failed to resolve conflict:', err);
      }
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || isSaving) {
      return;
    }

    const autoSaveTimer = setTimeout(() => {
      if (formData.title.trim()) {
        saveNote(false); // Don't show success message for auto-save
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [formData, hasUnsavedChanges, autoSaveEnabled, isSaving, saveNote]);

  // Prevent accidental navigation away
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleCancel]);

  if (isLoading) {
    return (
      <div className="note-editor-page">
        <Header />
        <div className="note-editor-loading">
          <LoadingSpinner message={isEditing ? "Loading note..." : "Preparing editor..."} />
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor-page">
      <Header />
      
      <main className="note-editor-main">
        <div className="container">
          {/* Editor Header */}
          <div className="editor-header">
            <div className="editor-title">
              <button
                className="back-btn"
                onClick={handleCancel}
                title="Back to dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <h1>{isEditing ? 'Edit Note' : 'Create New Note'}</h1>
            </div>

            <div className="editor-actions">
              {/* Auto-save toggle */}
              <label className="auto-save-toggle">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                />
                <span>Auto-save</span>
              </label>

              {/* Save status */}
              {lastSaved && !hasUnsavedChanges && (
                <span className="save-status saved">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="save-status unsaved">
                  Unsaved changes
                </span>
              )}

              {/* Action buttons */}
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X size={18} />
                Cancel
              </button>
              
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving || !formData.title.trim()}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="small" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {isEditing ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && !conflictData && (
            <ErrorDisplay 
              error={error} 
              onDismiss={clearError}
              className="editor-error"
            />
          )}

          {/* Conflict Resolution */}
          {conflictData && (
            <div className="conflict-resolution">
              <div className="conflict-header">
                <AlertTriangle size={24} />
                <div>
                  <h3>Conflict Detected</h3>
                  <p>This note was modified by another session. Choose how to proceed:</p>
                </div>
              </div>
              <div className="conflict-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleConflictResolution(true)}
                >
                  Use Server Version
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleConflictResolution(false)}
                >
                  Keep My Changes
                </button>
              </div>
            </div>
          )}

          {/* Editor Form */}
          <div className="editor-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`form-control title-input ${errors.title ? 'error' : ''}`}
                placeholder="Enter note title..."
                disabled={isSaving}
                autoFocus={!isEditing}
              />
              <FieldError error={errors.title} />
              <div className="character-count">
                {formData.title.length}/200
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className={`form-control content-textarea ${errors.content ? 'error' : ''}`}
                placeholder="Start writing your note..."
                disabled={isSaving}
                rows={20}
              />
              <FieldError error={errors.content} />
              <div className="character-count">
                {formData.content.length}/10,000
              </div>
            </div>
          </div>

          {/* Editor Footer */}
          <div className="editor-footer">
            <div className="editor-info">
              {isEditing && currentNote && (
                <>
                  <span>Version {formData.version}</span>
                  <span>•</span>
                  <span>Created {new Date(currentNote.created_at).toLocaleDateString()}</span>
                  {currentNote.updated_at !== currentNote.created_at && (
                    <>
                      <span>•</span>
                      <span>Last modified {new Date(currentNote.updated_at).toLocaleDateString()}</span>
                    </>
                  )}
                </>
              )}
            </div>
            
            <div className="keyboard-shortcuts">
              <small>
                <kbd>Ctrl+S</kbd> to save • <kbd>Esc</kbd> to cancel
              </small>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteEditor;