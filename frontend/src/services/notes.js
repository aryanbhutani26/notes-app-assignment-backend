import { apiService } from './api';
import { toast } from 'react-toastify';

// Notes service for CRUD operations
export const notesService = {
  // Get all notes for the current user
  getNotes: async () => {
    try {
      const response = await apiService.get('/notes/');
      return response.data.notes || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  // Get a specific note by ID
  getNote: async (noteId) => {
    try {
      const response = await apiService.get(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching note ${noteId}:`, error);
      throw error;
    }
  },

  // Create a new note
  createNote: async (noteData) => {
    try {
      const { title, content = '' } = noteData;
      
      if (!title || title.trim().length === 0) {
        throw new Error('Note title is required');
      }

      if (title.length > 200) {
        throw new Error('Note title must be 200 characters or less');
      }

      const response = await apiService.post('/notes/', {
        title: title.trim(),
        content: content.trim()
      });

      toast.success('Note created successfully!');
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    try {
      const { title, content = '', version } = noteData;
      
      if (!title || title.trim().length === 0) {
        throw new Error('Note title is required');
      }

      if (title.length > 200) {
        throw new Error('Note title must be 200 characters or less');
      }

      if (version === undefined || version === null) {
        throw new Error('Version is required for optimistic locking');
      }

      const response = await apiService.put(`/notes/${noteId}`, {
        title: title.trim(),
        content: content.trim(),
        version: version
      });

      toast.success('Note updated successfully!');
      return response.data;
    } catch (error) {
      console.error(`Error updating note ${noteId}:`, error);
      
      // Handle optimistic locking conflict
      if (error.status === 409) {
        toast.error('This note was modified by another session. Please refresh and try again.');
        throw new Error('CONFLICT');
      }
      
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId) => {
    try {
      const response = await apiService.delete(`/notes/${noteId}`);
      toast.success('Note deleted successfully!');
      return response.data;
    } catch (error) {
      console.error(`Error deleting note ${noteId}:`, error);
      throw error;
    }
  },

  // Validate note data
  validateNote: (noteData) => {
    const errors = {};
    const { title, content } = noteData;

    // Title validation
    if (!title || title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (title.length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }

    // Content validation (optional, but check length if provided)
    if (content && content.length > 10000) {
      errors.content = 'Content must be 10,000 characters or less';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Search notes (client-side filtering)
  searchNotes: (notes, searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return notes;
    }

    const term = searchTerm.toLowerCase().trim();
    return notes.filter(note => 
      note.title.toLowerCase().includes(term) ||
      (note.content && note.content.toLowerCase().includes(term))
    );
  },

  // Sort notes by different criteria
  sortNotes: (notes, sortBy = 'updated_at', sortOrder = 'desc') => {
    const sortedNotes = [...notes];
    
    sortedNotes.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sortedNotes;
  },

  // Format note for display
  formatNote: (note) => {
    return {
      ...note,
      formattedCreatedAt: new Date(note.created_at).toLocaleDateString(),
      formattedUpdatedAt: new Date(note.updated_at).toLocaleDateString(),
      contentPreview: note.content 
        ? note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '')
        : 'No content',
      wordCount: note.content ? note.content.split(/\s+/).filter(word => word.length > 0).length : 0
    };
  },

  // Handle optimistic locking conflicts
  handleConflict: async (noteId, localNote, onConflictResolved) => {
    try {
      // Fetch the latest version from server
      const serverNote = await notesService.getNote(noteId);
      
      // Call conflict resolution callback with both versions
      if (onConflictResolved) {
        onConflictResolved(localNote, serverNote);
      }
      
      return serverNote;
    } catch (error) {
      console.error('Error handling conflict:', error);
      throw error;
    }
  }
};

export default notesService;