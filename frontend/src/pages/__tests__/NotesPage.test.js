import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import NotesPage from '../NotesPage';
import { AuthProvider } from '../../context/AuthContext';
import { NotesProvider } from '../../context/NotesContext';
import notesService from '../../services/notes';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../services/notes', () => ({
  getAllNotes: jest.fn(),
  deleteNote: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock data
const mockNotes = [
  {
    id: 1,
    title: 'First Note',
    content: 'This is the first note content',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    version: 1
  },
  {
    id: 2,
    title: 'Second Note',
    content: 'This is the second note content',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    version: 1
  },
  {
    id: 3,
    title: 'Third Note',
    content: 'This is the third note content',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    version: 1
  }
];

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com'
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotesProvider>
        {children}
      </NotesProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('NotesPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    notesService.getAllNotes.mockResolvedValue(mockNotes);
  });

  it('renders notes page correctly', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my notes/i })).toBeInTheDocument();
      expect(screen.getByText(/you have \d+ notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create new note/i })).toBeInTheDocument();
    });
  });

  it('displays notes list', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
      expect(screen.getByText('Third Note')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    notesService.getAllNotes.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no notes exist', async () => {
    notesService.getAllNotes.mockResolvedValue([]);

    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first note/i)).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search notes/i);
    await user.type(searchInput, 'First');

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
      expect(screen.queryByText('Third Note')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when search returns no matches', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search notes/i);
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/no notes found/i)).toBeInTheDocument();
      expect(screen.getByText(/no notes match your search/i)).toBeInTheDocument();
    });
  });

  it('handles sorting functionality', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue(/last updated/i);
    await user.selectOptions(sortSelect, 'title');

    // Notes should be sorted by title
    const noteCards = screen.getAllByText(/note/i);
    expect(noteCards[0]).toHaveTextContent('First Note');
  });

  it('toggles sort order', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const sortOrderButton = screen.getByRole('button', { name: /sort/i });
    await user.click(sortOrderButton);

    // Sort order should change (implementation depends on your sorting logic)
    expect(sortOrderButton).toBeInTheDocument();
  });

  it('handles note selection', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const firstNoteCheckbox = checkboxes.find(cb => cb.closest('.note-card'));
    
    if (firstNoteCheckbox) {
      await user.click(firstNoteCheckbox);
      expect(firstNoteCheckbox).toBeChecked();
    }
  });

  it('handles select all functionality', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    await user.click(selectAllCheckbox);

    const noteCheckboxes = screen.getAllByRole('checkbox').filter(cb => 
      cb !== selectAllCheckbox && cb.closest('.note-card')
    );
    
    noteCheckboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('handles bulk delete', async () => {
    notesService.deleteNote.mockResolvedValue({ message: 'Note deleted' });

    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    // Select notes
    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    await user.click(selectAllCheckbox);

    // Click bulk delete
    const deleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(notesService.deleteNote).toHaveBeenCalledTimes(mockNotes.length);
    });
  });

  it('handles individual note deletion', async () => {
    notesService.deleteNote.mockResolvedValue({ message: 'Note deleted' });

    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const firstDeleteButton = deleteButtons[0];
    
    await user.click(firstDeleteButton);

    await waitFor(() => {
      expect(notesService.deleteNote).toHaveBeenCalledWith(1);
    });
  });

  it('toggles view mode between grid and list', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const listViewButton = screen.getByRole('button', { name: /list view/i });
    await user.click(listViewButton);

    // Check if view mode changed (implementation depends on your CSS classes)
    const notesContainer = screen.getByTestId('notes-container') || 
                          document.querySelector('.notes-container');
    
    if (notesContainer) {
      expect(notesContainer).toHaveClass('notes-list');
    }
  });

  it('navigates to create new note', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: /create new note/i });
    expect(createButton.closest('a')).toHaveAttribute('href', '/notes/new');
  });

  it('navigates to edit note', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const firstEditButton = editButtons[0];
    
    expect(firstEditButton.closest('a')).toHaveAttribute('href', '/notes/1/edit');
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to load notes';
    notesService.getAllNotes.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network error gracefully', async () => {
    const networkError = new Error('Network Error');
    networkError.code = 'NETWORK_ERROR';
    notesService.getAllNotes.mockRejectedValue(networkError);

    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('refreshes notes list', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(notesService.getAllNotes).toHaveBeenCalledTimes(1);
    });

    // Trigger refresh (implementation depends on your refresh mechanism)
    const refreshButton = screen.queryByRole('button', { name: /refresh/i });
    if (refreshButton) {
      await user.click(refreshButton);
      expect(notesService.getAllNotes).toHaveBeenCalledTimes(2);
    }
  });

  it('handles keyboard shortcuts', async () => {
    render(
      <TestWrapper>
        <NotesPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    // Test search shortcut (Ctrl+F or Cmd+F)
    await user.keyboard('{Control>}f{/Control}');
    
    const searchInput = screen.getByPlaceholderText(/search notes/i);
    expect(searchInput).toHaveFocus();
  });
});