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
  register: jest.fn(),
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

describe('End-to-End User Journey Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Start with unauthenticated state
    authService.isAuthenticated.mockReturnValue(false);
    authService.getCurrentUser.mockReturnValue(null);
    authService.checkTokenExpiration.mockReturnValue(false);
  });

  describe('Complete User Journey: Registration to Note Management', () => {
    it('completes full user journey from registration to note management', async () => {
      // Mock user data
      const newUser = {
        id: 1,
        username: 'journeyuser',
        email: 'journey@example.com'
      };

      const loginResponse = {
        user: newUser,
        token: 'mock-jwt-token'
      };

      const initialNotes = [];
      const createdNote = {
        id: 1,
        title: 'My First Note',
        content: 'This is my first note content',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1,
        user_id: 1
      };

      const updatedNote = {
        ...createdNote,
        title: 'My Updated First Note',
        content: 'This is my updated note content',
        version: 2,
        updated_at: '2024-01-01T01:00:00Z'
      };

      // Set up service mocks
      authService.register.mockResolvedValue(newUser);
      authService.login.mockResolvedValue(loginResponse);
      authService.logout.mockResolvedValue(true);
      notesService.getAllNotes.mockResolvedValue(initialNotes);
      notesService.createNote.mockResolvedValue(createdNote);
      notesService.updateNote.mockResolvedValue(updatedNote);
      notesService.deleteNote.mockResolvedValue({ message: 'Note deleted' });
      notesService.getNoteById.mockResolvedValue(createdNote);

      render(<App />);

      // STEP 1: Start at login page (redirected from root)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // STEP 2: Navigate to registration
      const registerLink = screen.getByRole('link', { name: /sign up/i });
      await user.click(registerLink);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      });

      // STEP 3: Complete registration
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(usernameInput, 'journeyuser');
      await user.type(emailInput, 'journey@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');

      const registerButton = screen.getByRole('button', { name: /create account/i });
      await user.click(registerButton);

      // Verify registration
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          username: 'journeyuser',
          email: 'journey@example.com',
          password: 'Password123!'
        });
      });

      // STEP 4: Navigate back to login after successful registration
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // STEP 5: Login with new account
      const loginUsernameInput = screen.getByLabelText(/username/i);
      const loginPasswordInput = screen.getByLabelText(/password/i);

      await user.type(loginUsernameInput, 'journeyuser');
      await user.type(loginPasswordInput, 'Password123!');

      // Mock authenticated state after login
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(newUser);
      authService.checkTokenExpiration.mockReturnValue(true);

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Verify login
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          username: 'journeyuser',
          password: 'Password123!'
        });
      });

      // STEP 6: Should now be on notes dashboard (empty state)
      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
        expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
        expect(screen.getByText(/welcome back, journeyuser/i)).toBeInTheDocument();
      });

      // STEP 7: Create first note
      const createNoteButton = screen.getByRole('button', { name: /create new note/i });
      await user.click(createNoteButton);

      await waitFor(() => {
        expect(screen.getByText(/create new note/i)).toBeInTheDocument();
      });

      const noteTitleInput = screen.getByLabelText(/title/i);
      const noteContentTextarea = screen.getByLabelText(/content/i);

      await user.type(noteTitleInput, 'My First Note');
      await user.type(noteContentTextarea, 'This is my first note content');

      const createButton = screen.getByRole('button', { name: /create note/i });
      await user.click(createButton);

      // Verify note creation
      await waitFor(() => {
        expect(notesService.createNote).toHaveBeenCalledWith({
          title: 'My First Note',
          content: 'This is my first note content'
        });
      });

      // STEP 8: Should return to dashboard with new note
      // Update mock to return the created note
      notesService.getAllNotes.mockResolvedValue([createdNote]);

      await waitFor(() => {
        expect(screen.getByText('My First Note')).toBeInTheDocument();
        expect(screen.getByText(/you have 1 notes/i)).toBeInTheDocument();
      });

      // STEP 9: Edit the note
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText(/edit note/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('My First Note')).toBeInTheDocument();
      });

      const editTitleInput = screen.getByLabelText(/title/i);
      const editContentTextarea = screen.getByLabelText(/content/i);

      await user.clear(editTitleInput);
      await user.type(editTitleInput, 'My Updated First Note');
      
      await user.clear(editContentTextarea);
      await user.type(editContentTextarea, 'This is my updated note content');

      const updateButton = screen.getByRole('button', { name: /update note/i });
      await user.click(updateButton);

      // Verify note update
      await waitFor(() => {
        expect(notesService.updateNote).toHaveBeenCalledWith(1, {
          title: 'My Updated First Note',
          content: 'This is my updated note content',
          version: 1
        });
      });

      // STEP 10: Should return to dashboard with updated note
      // Update mock to return the updated note
      notesService.getAllNotes.mockResolvedValue([updatedNote]);

      await waitFor(() => {
        expect(screen.getByText('My Updated First Note')).toBeInTheDocument();
      });

      // STEP 11: Test search functionality
      const searchInput = screen.getByPlaceholderText(/search notes/i);
      await user.type(searchInput, 'Updated');

      await waitFor(() => {
        expect(screen.getByText('My Updated First Note')).toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      // STEP 12: Delete the note
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Verify note deletion
      await waitFor(() => {
        expect(notesService.deleteNote).toHaveBeenCalledWith(1);
      });

      // STEP 13: Should return to empty state
      // Update mock to return empty array
      notesService.getAllNotes.mockResolvedValue([]);

      await waitFor(() => {
        expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
      });

      // STEP 14: Logout
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Mock unauthenticated state after logout
      authService.isAuthenticated.mockReturnValue(false);
      authService.getCurrentUser.mockReturnValue(null);

      // Verify logout
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      // STEP 15: Should return to login page
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      });

      // Verify all success messages were shown
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Registration successful')
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Login successful')
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Note created successfully')
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Note updated successfully')
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Note deleted successfully')
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Logged out successfully')
      );
    });
  });

  describe('Error Recovery Journey', () => {
    it('handles and recovers from various error scenarios', async () => {
      const mockUser = {
        id: 1,
        username: 'erroruser',
        email: 'error@example.com'
      };

      // Start with authenticated state
      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);

      render(<App />);

      // SCENARIO 1: Network error when loading notes
      const networkError = new Error('Network Error');
      notesService.getAllNotes.mockRejectedValue(networkError);

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });

      // Recovery: Network comes back
      const mockNotes = [
        {
          id: 1,
          title: 'Test Note',
          content: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version: 1,
          user_id: 1
        }
      ];
      notesService.getAllNotes.mockResolvedValue(mockNotes);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Note')).toBeInTheDocument();
      });

      // SCENARIO 2: Create note fails, then succeeds
      const createError = new Error('Server error');
      notesService.createNote.mockRejectedValue(createError);

      const createButton = screen.getByRole('button', { name: /create new note/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/create new note/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const contentTextarea = screen.getByLabelText(/content/i);

      await user.type(titleInput, 'Error Test Note');
      await user.type(contentTextarea, 'This will fail first');

      const submitButton = screen.getByRole('button', { name: /create note/i });
      await user.click(submitButton);

      // Should show error
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Server error')
        );
      });

      // Recovery: Try again with service working
      const newNote = {
        id: 2,
        title: 'Error Test Note',
        content: 'This will fail first',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1,
        user_id: 1
      };
      notesService.createNote.mockResolvedValue(newNote);

      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Note created successfully')
        );
      });
    });
  });

  describe('Accessibility Journey', () => {
    it('supports keyboard navigation throughout the application', async () => {
      const mockUser = {
        id: 1,
        username: 'keyboarduser',
        email: 'keyboard@example.com'
      };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);
      notesService.getAllNotes.mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      });

      // Test keyboard navigation
      const createButton = screen.getByRole('button', { name: /create new note/i });
      
      // Focus should be manageable via keyboard
      createButton.focus();
      expect(createButton).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/create new note/i)).toBeInTheDocument();
      });

      // Test form keyboard navigation
      const titleInput = screen.getByLabelText(/title/i);
      titleInput.focus();
      expect(titleInput).toHaveFocus();

      await user.keyboard('{Tab}');
      const contentTextarea = screen.getByLabelText(/content/i);
      expect(contentTextarea).toHaveFocus();
    });
  });

  describe('Performance Journey', () => {
    it('handles large datasets efficiently', async () => {
      const mockUser = {
        id: 1,
        username: 'perfuser',
        email: 'perf@example.com'
      };

      // Create a large dataset
      const largeNotesList = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        title: `Note ${index + 1}`,
        content: `Content for note ${index + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        version: 1,
        user_id: 1
      }));

      authService.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(mockUser);
      authService.checkTokenExpiration.mockReturnValue(true);
      notesService.getAllNotes.mockResolvedValue(largeNotesList);

      const startTime = performance.now();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Note 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(5000); // 5 seconds

      // Test search performance with large dataset
      const searchInput = screen.getByPlaceholderText(/search notes/i);
      
      const searchStartTime = performance.now();
      await user.type(searchInput, 'Note 50');
      
      await waitFor(() => {
        expect(screen.getByText('Note 50')).toBeInTheDocument();
      });
      
      const searchEndTime = performance.now();
      const searchTime = searchEndTime - searchStartTime;

      // Search should be responsive
      expect(searchTime).toBeLessThan(1000); // 1 second
    });
  });
});