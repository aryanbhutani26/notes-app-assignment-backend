import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import App from '../../App';
import authService from '../../services/auth';
import notesService from '../../services/notes';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  },
  ToastContainer: () => null
}));

jest.mock('../../services/auth', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(),
  checkTokenExpiration: jest.fn()
}));

jest.mock('../../services/notes', () => ({
  getAllNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  getNoteById: jest.fn()
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Notes Management Flow Integration Tests', () => {
  const user = userEvent.setup();

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockNotes = [
    {
      id: 1,
      title: 'First Note',
      content: 'This is the first note content',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      version: 1,
      user_id: 1
    },
    {
      id: 2,
      title: 'Second Note',
      content: 'This is the second note content',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      version: 1,
      user_id: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up authenticated state
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockReturnValue(mockUser);
    authService.checkTokenExpiration.mockReturnValue(true);
    
    // Set up notes service defaults
    notesService.getAllNotes.mockResolvedValue(mockNotes);
  });

  describe('Notes Dashboard Flow', () => {
    it('displays notes dashboard with existing notes', async () => {
      render(<App />);

      // Should show notes dashboard
      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
      });

      // Should show user welcome message
      expect(screen.getByText(/welcome back, testuser/i)).toBeInTheDocument();
      
      // Should show notes count
      expect(screen.getByText(/you have 2 notes/i)).toBeInTheDocument();
    });

    it('handles empty notes state', async () => {
      notesService.getAllNotes.mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
        expect(screen.getByText(/create your first note/i)).toBeInTheDocument();
      });
    });

    it('handles notes loading error', async () => {
      const error = new Error('Failed to load notes');
      notesService.getAllNotes.mockRejectedValue(error);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load notes')).toBeInTheDocument();
      });
    });
  });

  describe('Create Note Flow', () => {
    it('completes full note creation workflow', async () => {
      const newNote = {
        id: 3,
        title: 'New Note',
        content: 'This is a new note',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        version: 1,
        user_id: 1
      };

      notesService.createNote.mockResolvedValue(newNote);

      render(<App />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });

      // Click create new note button
      const createButton = screen.getByRole('button', { name: /create new note/i });
      await user.click(createButton);

      // Should navigate to note editor
      await waitFor(() => {
        expect(screen.getByText(/create new note/i)).toBeInTheDocument();
      });

      // Fill out note form
      const titleInput = screen.getByLabelText(/title/i);
      const contentTextarea = screen.getByLabelText(/content/i);

      await user.type(titleInput, 'New Note');
      await user.type(contentTextarea, 'This is a new note');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create note/i });
      await user.click(submitButton);

      // Verify note creation was called
      await waitFor(() => {
        expect(notesService.createNote).toHaveBeenCalledWith({
          title: 'New Note',
          content: 'This is a new note'
        });
      });

      // Should show success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Note created successfully')
      );
    });

    it('handles note creation validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            errors: {
              title: ['Title is required'],
              content: ['Content is too long']
            }
          }
        }
      };

      notesService.createNote.mockRejectedValue(validationError);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });

      // Navigate to create note
      const createButton = screen.getByRole('button', { name: /create new note/i });
      await user.click(createButton);

      // Submit empty form
      await waitFor(() => {
        expect(screen.getByText(/create new note/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create note/i });
      await user.click(submitButton);

      // Should display validation errors
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Content is too long')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Note Flow', () => {
    it('completes full note editing workflow', async () => {
      const noteToEdit = mockNotes[0];
      const updatedNote = {
        ...noteToEdit,
        title: 'Updated First Note',
        content: 'This is the updated content',
        version: 2,
        updated_at: '2024-01-04T00:00:00Z'
      };

      notesService.getNoteById.mockResolvedValue(noteToEdit);
      notesService.updateNote.mockResolvedValue(updatedNote);

      render(<App />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Click edit button for first note
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Should navigate to note editor with existing data
      await waitFor(() => {
        expect(screen.getByText(/edit note/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('First Note')).toBeInTheDocument();
      });

      // Update the note
      const titleInput = screen.getByLabelText(/title/i);
      const contentTextarea = screen.getByLabelText(/content/i);

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated First Note');
      
      await user.clear(contentTextarea);
      await user.type(contentTextarea, 'This is the updated content');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /update note/i });
      await user.click(submitButton);

      // Verify note update was called
      await waitFor(() => {
        expect(notesService.updateNote).toHaveBeenCalledWith(1, {
          title: 'Updated First Note',
          content: 'This is the updated content',
          version: 1
        });
      });

      // Should show success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Note updated successfully')
      );
    });

    it('handles optimistic locking conflicts', async () => {
      const noteToEdit = mockNotes[0];
      const conflictError = {
        response: {
          status: 409,
          data: { message: 'Note was modified by another session' }
        }
      };

      notesService.getNoteById.mockResolvedValue(noteToEdit);
      notesService.updateNote.mockRejectedValue(conflictError);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Navigate to edit
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit note/i)).toBeInTheDocument();
      });

      // Make changes and submit
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Conflicted Update');

      const submitButton = screen.getByRole('button', { name: /update note/i });
      await user.click(submitButton);

      // Should show conflict error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('modified by another session')
        );
      });
    });
  });

  describe('Delete Note Flow', () => {
    it('completes single note deletion workflow', async () => {
      notesService.deleteNote.mockResolvedValue({ message: 'Note deleted' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Click delete button for first note
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Verify deletion was called
      await waitFor(() => {
        expect(notesService.deleteNote).toHaveBeenCalledWith(1);
      });

      // Should show success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Note deleted successfully')
      );
    });

    it('completes bulk deletion workflow', async () => {
      notesService.deleteNote.mockResolvedValue({ message: 'Note deleted' });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Select all notes
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      // Click bulk delete
      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
      await user.click(bulkDeleteButton);

      // Confirm deletion in modal
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      // Should delete all selected notes
      await waitFor(() => {
        expect(notesService.deleteNote).toHaveBeenCalledTimes(2);
        expect(notesService.deleteNote).toHaveBeenCalledWith(1);
        expect(notesService.deleteNote).toHaveBeenCalledWith(2);
      });

      // Should show success message
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('2 note(s) deleted successfully')
      );
    });

    it('handles delete note error', async () => {
      const deleteError = new Error('Failed to delete note');
      notesService.deleteNote.mockRejectedValue(deleteError);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Try to delete note
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Should show error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to delete note')
        );
      });
    });
  });

  describe('Search and Filter Flow', () => {
    it('completes search workflow', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
      });

      // Search for specific note
      const searchInput = screen.getByPlaceholderText(/search notes/i);
      await user.type(searchInput, 'First');

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      // Should show all notes again
      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
      });
    });

    it('handles empty search results', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Search for non-existent note
      const searchInput = screen.getByPlaceholderText(/search notes/i);
      await user.type(searchInput, 'nonexistent');

      // Should show no results message
      await waitFor(() => {
        expect(screen.getByText(/no notes found/i)).toBeInTheDocument();
        expect(screen.getByText(/no notes match your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Flow', () => {
    it('handles mobile view interactions', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
      });

      // Mobile-specific interactions would be tested here
      // This depends on your responsive implementation
    });
  });

  describe('Error Recovery Flow', () => {
    it('recovers from network errors', async () => {
      // Start with network error
      const networkError = new Error('Network Error');
      notesService.getAllNotes.mockRejectedValue(networkError);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });

      // Simulate network recovery
      notesService.getAllNotes.mockResolvedValue(mockNotes);

      // Retry loading notes
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should successfully load notes
      await waitFor(() => {
        expect(screen.getByText('First Note')).toBeInTheDocument();
        expect(screen.getByText('Second Note')).toBeInTheDocument();
      });
    });
  });
});