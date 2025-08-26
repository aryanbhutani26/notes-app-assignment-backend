import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { notesService } from '../services/notes';

// Initial state
const initialState = {
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  sortBy: 'updated_at',
  sortOrder: 'desc'
};

// Action types
const NOTES_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_NOTES_SUCCESS: 'LOAD_NOTES_SUCCESS',
  SET_CURRENT_NOTE: 'SET_CURRENT_NOTE',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_SORT: 'SET_SORT',
  CLEAR_NOTES: 'CLEAR_NOTES'
};

// Reducer function
const notesReducer = (state, action) => {
  switch (action.type) {
    case NOTES_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case NOTES_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case NOTES_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case NOTES_ACTIONS.LOAD_NOTES_SUCCESS:
      return {
        ...state,
        notes: action.payload,
        isLoading: false,
        error: null
      };

    case NOTES_ACTIONS.SET_CURRENT_NOTE:
      return {
        ...state,
        currentNote: action.payload
      };

    case NOTES_ACTIONS.ADD_NOTE:
      return {
        ...state,
        notes: [action.payload, ...state.notes],
        isLoading: false,
        error: null
      };

    case NOTES_ACTIONS.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.payload.id ? action.payload : note
        ),
        currentNote: state.currentNote?.id === action.payload.id ? action.payload : state.currentNote,
        isLoading: false,
        error: null
      };

    case NOTES_ACTIONS.DELETE_NOTE:
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload),
        currentNote: state.currentNote?.id === action.payload ? null : state.currentNote,
        isLoading: false,
        error: null
      };

    case NOTES_ACTIONS.SET_SEARCH_TERM:
      return {
        ...state,
        searchTerm: action.payload
      };

    case NOTES_ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder
      };

    case NOTES_ACTIONS.CLEAR_NOTES:
      return {
        ...initialState
      };

    default:
      return state;
  }
};

// Create context
const NotesContext = createContext();

// Notes provider component
export const NotesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  // Load all notes
  const loadNotes = useCallback(async () => {
    dispatch({ type: NOTES_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const notes = await notesService.getNotes();
      dispatch({
        type: NOTES_ACTIONS.LOAD_NOTES_SUCCESS,
        payload: notes
      });
    } catch (error) {
      dispatch({
        type: NOTES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load notes'
      });
    }
  }, []);

  // Load a specific note
  const loadNote = useCallback(async (noteId) => {
    dispatch({ type: NOTES_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const note = await notesService.getNote(noteId);
      dispatch({
        type: NOTES_ACTIONS.SET_CURRENT_NOTE,
        payload: note
      });
      dispatch({ type: NOTES_ACTIONS.SET_LOADING, payload: false });
      return note;
    } catch (error) {
      dispatch({
        type: NOTES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load note'
      });
      throw error;
    }
  }, []);

  // Create a new note
  const createNote = useCallback(async (noteData) => {
    dispatch({ type: NOTES_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const newNote = await notesService.createNote(noteData);
      dispatch({
        type: NOTES_ACTIONS.ADD_NOTE,
        payload: newNote
      });
      return newNote;
    } catch (error) {
      dispatch({
        type: NOTES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to create note'
      });
      throw error;
    }
  }, []);

  // Update an existing note
  const updateNote = useCallback(async (noteId, noteData) => {
    dispatch({ type: NOTES_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const updatedNote = await notesService.updateNote(noteId, noteData);
      dispatch({
        type: NOTES_ACTIONS.UPDATE_NOTE,
        payload: updatedNote
      });
      return updatedNote;
    } catch (error) {
      if (error.message === 'CONFLICT') {
        // Handle optimistic locking conflict
        dispatch({
          type: NOTES_ACTIONS.SET_ERROR,
          payload: 'This note was modified by another session. Please refresh and try again.'
        });
      } else {
        dispatch({
          type: NOTES_ACTIONS.SET_ERROR,
          payload: error.message || 'Failed to update note'
        });
      }
      throw error;
    }
  }, []);

  // Delete a note
  const deleteNote = useCallback(async (noteId) => {
    dispatch({ type: NOTES_ACTIONS.SET_LOADING, payload: true });
    
    try {
      await notesService.deleteNote(noteId);
      dispatch({
        type: NOTES_ACTIONS.DELETE_NOTE,
        payload: noteId
      });
    } catch (error) {
      dispatch({
        type: NOTES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to delete note'
      });
      throw error;
    }
  }, []);

  // Set current note
  const setCurrentNote = useCallback((note) => {
    dispatch({
      type: NOTES_ACTIONS.SET_CURRENT_NOTE,
      payload: note
    });
  }, []);

  // Set search term
  const setSearchTerm = useCallback((searchTerm) => {
    dispatch({
      type: NOTES_ACTIONS.SET_SEARCH_TERM,
      payload: searchTerm
    });
  }, []);

  // Set sort options
  const setSortOptions = useCallback((sortBy, sortOrder) => {
    dispatch({
      type: NOTES_ACTIONS.SET_SORT,
      payload: { sortBy, sortOrder }
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: NOTES_ACTIONS.CLEAR_ERROR });
  }, []);

  // Clear all notes (for logout)
  const clearNotes = useCallback(() => {
    dispatch({ type: NOTES_ACTIONS.CLEAR_NOTES });
  }, []);

  // Get filtered and sorted notes
  const getFilteredNotes = useCallback(() => {
    let filteredNotes = state.notes;

    // Apply search filter
    if (state.searchTerm) {
      filteredNotes = notesService.searchNotes(filteredNotes, state.searchTerm);
    }

    // Apply sorting
    filteredNotes = notesService.sortNotes(filteredNotes, state.sortBy, state.sortOrder);

    return filteredNotes;
  }, [state.notes, state.searchTerm, state.sortBy, state.sortOrder]);

  // Handle optimistic locking conflict
  const handleConflict = useCallback(async (noteId, localNote, onConflictResolved) => {
    try {
      const serverNote = await notesService.handleConflict(noteId, localNote, onConflictResolved);
      dispatch({
        type: NOTES_ACTIONS.UPDATE_NOTE,
        payload: serverNote
      });
      return serverNote;
    } catch (error) {
      dispatch({
        type: NOTES_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to resolve conflict'
      });
      throw error;
    }
  }, []);

  // Context value
  const value = {
    // State
    notes: state.notes,
    currentNote: state.currentNote,
    isLoading: state.isLoading,
    error: state.error,
    searchTerm: state.searchTerm,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    
    // Actions
    loadNotes,
    loadNote,
    createNote,
    updateNote,
    deleteNote,
    setCurrentNote,
    setSearchTerm,
    setSortOptions,
    clearError,
    clearNotes,
    getFilteredNotes,
    handleConflict
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

// Custom hook to use notes context
export const useNotes = () => {
  const context = useContext(NotesContext);
  
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  
  return context;
};

export default NotesContext;