import { toast } from 'react-toastify';
import notesService from '../notes';
import apiService from '../api';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

describe('Notes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllNotes', () => {
    const mockNotes = [
      { id: 1, title: 'Note 1', content: 'Content 1', version: 1 },
      { id: 2, title: 'Note 2', content: 'Content 2', version: 1 }
    ];

    it('should fetch all notes successfully', async () => {
      const mockResponse = { data: mockNotes };
      apiService.get.mockResolvedValue(mockResponse);

      const result = await notesService.getAllNotes();

      expect(apiService.get).toHaveBeenCalledWith('/notes');
      expect(result).toBe(mockResponse.data);
    });

    it('should handle fetch notes error', async () => {
      const error = new Error('Failed to fetch notes');
      apiService.get.mockRejectedValue(error);

      await expect(notesService.getAllNotes()).rejects.toThrow('Failed to fetch notes');
    });
  });

  describe('getNoteById', () => {
    const mockNote = { id: 1, title: 'Test Note', content: 'Test Content', version: 1 };

    it('should fetch note by id successfully', async () => {
      const mockResponse = { data: mockNote };
      apiService.get.mockResolvedValue(mockResponse);

      const result = await notesService.getNoteById(1);

      expect(apiService.get).toHaveBeenCalledWith('/notes/1');
      expect(result).toBe(mockResponse.data);
    });

    it('should handle note not found error', async () => {
      const error = { response: { status: 404, data: { message: 'Note not found' } } };
      apiService.get.mockRejectedValue(error);

      await expect(notesService.getNoteById(999)).rejects.toEqual(error);
    });
  });

  describe('createNote', () => {
    const mockNoteData = {
      title: 'New Note',
      content: 'New Content'
    };

    const mockCreatedNote = {
      id: 1,
      ...mockNoteData,
      version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('should create note successfully', async () => {
      const mockResponse = { data: mockCreatedNote };
      apiService.post.mockResolvedValue(mockResponse);

      const result = await notesService.createNote(mockNoteData);

      expect(apiService.post).toHaveBeenCalledWith('/notes', mockNoteData);
      expect(toast.success).toHaveBeenCalledWith('Note created successfully!');
      expect(result).toBe(mockResponse.data);
    });

    it('should handle create note error', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid data' } } };
      apiService.post.mockRejectedValue(error);

      await expect(notesService.createNote(mockNoteData)).rejects.toEqual(error);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              title: ['Title is required'],
              content: ['Content is too long']
            }
          }
        }
      };
      apiService.post.mockRejectedValue(validationError);

      await expect(notesService.createNote({})).rejects.toEqual(validationError);
    });
  });

  describe('updateNote', () => {
    const mockNoteId = 1;
    const mockUpdateData = {
      title: 'Updated Note',
      content: 'Updated Content',
      version: 1
    };

    const mockUpdatedNote = {
      id: mockNoteId,
      ...mockUpdateData,
      version: 2,
      updated_at: '2024-01-01T01:00:00Z'
    };

    it('should update note successfully', async () => {
      const mockResponse = { data: mockUpdatedNote };
      apiService.put.mockResolvedValue(mockResponse);

      const result = await notesService.updateNote(mockNoteId, mockUpdateData);

      expect(apiService.put).toHaveBeenCalledWith(`/notes/${mockNoteId}`, mockUpdateData);
      expect(toast.success).toHaveBeenCalledWith('Note updated successfully!');
      expect(result).toBe(mockResponse.data);
    });

    it('should handle optimistic locking conflict', async () => {
      const conflictError = {
        response: {
          status: 409,
          data: { message: 'Note was modified by another session' }
        }
      };
      apiService.put.mockRejectedValue(conflictError);

      await expect(notesService.updateNote(mockNoteId, mockUpdateData)).rejects.toThrow('CONFLICT');
      expect(toast.error).toHaveBeenCalledWith('This note was modified by another session. Please refresh and try again.');
    });

    it('should handle other update errors', async () => {
      const error = { response: { status: 500, data: { message: 'Server error' } } };
      apiService.put.mockRejectedValue(error);

      await expect(notesService.updateNote(mockNoteId, mockUpdateData)).rejects.toEqual(error);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should handle note not found during update', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Note not found' }
        }
      };
      apiService.put.mockRejectedValue(notFoundError);

      await expect(notesService.updateNote(999, mockUpdateData)).rejects.toEqual(notFoundError);
    });
  });

  describe('deleteNote', () => {
    const mockNoteId = 1;

    it('should delete note successfully', async () => {
      const mockResponse = { data: { message: 'Note deleted successfully' } };
      apiService.delete.mockResolvedValue(mockResponse);

      const result = await notesService.deleteNote(mockNoteId);

      expect(apiService.delete).toHaveBeenCalledWith(`/notes/${mockNoteId}`);
      expect(toast.success).toHaveBeenCalledWith('Note deleted successfully!');
      expect(result).toBe(mockResponse.data);
    });

    it('should handle delete note error', async () => {
      const error = { response: { status: 404, data: { message: 'Note not found' } } };
      apiService.delete.mockRejectedValue(error);

      await expect(notesService.deleteNote(mockNoteId)).rejects.toEqual(error);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('should handle permission denied error', async () => {
      const permissionError = {
        response: {
          status: 403,
          data: { message: 'Permission denied' }
        }
      };
      apiService.delete.mockRejectedValue(permissionError);

      await expect(notesService.deleteNote(mockNoteId)).rejects.toEqual(permissionError);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      apiService.get.mockRejectedValue(networkError);

      await expect(notesService.getAllNotes()).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';
      apiService.get.mockRejectedValue(timeoutError);

      await expect(notesService.getAllNotes()).rejects.toThrow('Timeout');
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      apiService.get.mockRejectedValue(serverError);

      await expect(notesService.getAllNotes()).rejects.toEqual(serverError);
    });
  });

  describe('Data Validation', () => {
    it('should handle empty note data', async () => {
      const emptyData = { title: '', content: '' };
      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              title: ['Title is required']
            }
          }
        }
      };
      apiService.post.mockRejectedValue(validationError);

      await expect(notesService.createNote(emptyData)).rejects.toEqual(validationError);
    });

    it('should handle invalid note ID', async () => {
      const invalidIdError = {
        response: {
          status: 400,
          data: { message: 'Invalid note ID' }
        }
      };
      apiService.get.mockRejectedValue(invalidIdError);

      await expect(notesService.getNoteById('invalid')).rejects.toEqual(invalidIdError);
    });
  });
});