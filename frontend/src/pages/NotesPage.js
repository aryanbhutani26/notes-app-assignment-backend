import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes, useAuth, useDebounce } from '../hooks';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import NoteCard from '../components/notes/NoteCard';
import Header from '../components/layout/Header';
import { Plus, Search, SortAsc, SortDesc } from 'lucide-react';
// import { toast } from 'react-toastify'; // Will be used for notifications
import './NotesPage.css';

const NotesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSearch, setShowSearch] = useState(false);

  const { 
    /* notes, */ // Will be used when implementing the list
    isLoading, 
    error, 
    loadNotes, 
    deleteNote, 
    clearError,
    getFilteredNotes,
    setSearchTerm: setNotesSearchTerm,
    setSortOptions
  } = useNotes();

  const { user } = useAuth();
  const navigate = useNavigate();

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Update search term in notes context when debounced value changes
  useEffect(() => {
    setNotesSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setNotesSearchTerm]);

  // Update sort options in notes context
  useEffect(() => {
    setSortOptions(sortBy, sortOrder);
  }, [sortBy, sortOrder, setSortOptions]);

  // Get filtered and sorted notes
  const filteredNotes = getFilteredNotes();

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default desc order
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // Handle note edit
  const handleEditNote = (noteId) => {
    navigate(`/notes/${noteId}/edit`);
  };

  // Handle note delete
  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await deleteNote(noteId);
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  // Handle create new note
  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setShowSearch(false);
  };

  return (
    <div className="notes-page">
      <Header />
      
      <main className="notes-main">
        <div className="container">
          {/* Page Header */}
          <div className="notes-header">
            <div className="notes-title">
              <h1>My Notes</h1>
              <p>Welcome back, {user?.username}!</p>
            </div>
            
            <div className="notes-actions">
              <button
                className="btn btn-secondary search-toggle"
                onClick={() => setShowSearch(!showSearch)}
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>
              
              <button
                className="btn btn-primary create-btn"
                onClick={handleCreateNote}
              >
                <Plus size={20} />
                New Note
              </button>
            </div>
          </div>

          {/* Search and Sort Controls */}
          {(showSearch || searchTerm) && (
            <div className="notes-controls">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                    autoFocus={showSearch}
                  />
                  {searchTerm && (
                    <button
                      className="clear-search"
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="sort-controls">
                <label>Sort by:</label>
                <div className="sort-buttons">
                  <button
                    className={`sort-btn ${sortBy === 'updated_at' ? 'active' : ''}`}
                    onClick={() => handleSortChange('updated_at')}
                  >
                    Modified
                    {sortBy === 'updated_at' && (
                      sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
                    )}
                  </button>
                  <button
                    className={`sort-btn ${sortBy === 'created_at' ? 'active' : ''}`}
                    onClick={() => handleSortChange('created_at')}
                  >
                    Created
                    {sortBy === 'created_at' && (
                      sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
                    )}
                  </button>
                  <button
                    className={`sort-btn ${sortBy === 'title' ? 'active' : ''}`}
                    onClick={() => handleSortChange('title')}
                  >
                    Title
                    {sortBy === 'title' && (
                      sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              error={error} 
              onDismiss={clearError}
              className="notes-error"
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="notes-loading">
              <LoadingSpinner message="Loading your notes..." />
            </div>
          )}

          {/* Notes Content */}
          {!isLoading && (
            <>
              {/* Search Results Info */}
              {searchTerm && (
                <div className="search-results-info">
                  {filteredNotes.length === 0 ? (
                    <p>No notes found for "{searchTerm}"</p>
                  ) : (
                    <p>
                      {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found for "{searchTerm}"
                    </p>
                  )}
                </div>
              )}

              {/* Notes Grid */}
              {filteredNotes.length > 0 ? (
                <div className="notes-grid">
                  {filteredNotes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              ) : !searchTerm ? (
                /* Empty State */
                <div className="empty-state">
                  <div className="empty-state-content">
                    <div className="empty-state-icon">📝</div>
                    <h2>No notes yet</h2>
                    <p>Start capturing your thoughts and ideas by creating your first note.</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateNote}
                    >
                      <Plus size={20} />
                      Create Your First Note
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotesPage;