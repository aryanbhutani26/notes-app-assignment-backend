// Export all custom hooks from a single file for easier imports
export { useAuth } from '../context/AuthContext';
export { useNotes } from '../context/NotesContext';
export { useApi, useApiGet, useApiPost, useApiPut, useApiDelete } from './useApi';
export { useLocalStorage } from './useLocalStorage';
export { useDebounce, useDebounceCallback } from './useDebounce';
export { useFormValidation } from './useFormValidation';