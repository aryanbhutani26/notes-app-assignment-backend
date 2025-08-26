import { useEffect, useCallback, useRef } from 'react';

// Hook for managing keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts = {}, dependencies = []) => {
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifierKey = ctrlKey || metaKey; // Support both Ctrl and Cmd

    // Create a key combination string
    const combination = [
      modifierKey && 'mod',
      ctrlKey && 'ctrl',
      metaKey && 'meta',
      shiftKey && 'shift',
      altKey && 'alt',
      key.toLowerCase()
    ].filter(Boolean).join('+');

    // Check for exact matches first
    if (shortcutsRef.current[combination]) {
      event.preventDefault();
      shortcutsRef.current[combination](event);
      return;
    }

    // Check for partial matches (for flexibility)
    Object.keys(shortcutsRef.current).forEach(shortcut => {
      if (matchesShortcut(shortcut, { key, ctrlKey, metaKey, shiftKey, altKey })) {
        event.preventDefault();
        shortcutsRef.current[shortcut](event);
      }
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, ...dependencies]);

  return { handleKeyDown };
};

// Helper function to match shortcuts
const matchesShortcut = (shortcut, { key, ctrlKey, metaKey, shiftKey, altKey }) => {
  const parts = shortcut.split('+');
  const keyPart = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  // Check if key matches
  if (keyPart !== key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('mod');
  const hasMeta = modifiers.includes('meta') || modifiers.includes('mod');
  const hasShift = modifiers.includes('shift');
  const hasAlt = modifiers.includes('alt');

  return (
    (hasCtrl ? ctrlKey : !ctrlKey || hasMeta) &&
    (hasMeta ? metaKey : !metaKey || hasCtrl) &&
    (hasShift ? shiftKey : !shiftKey) &&
    (hasAlt ? altKey : !altKey)
  );
};

// Global keyboard shortcuts for the entire app
export const useGlobalShortcuts = () => {
  const shortcuts = {
    // Navigation shortcuts
    'mod+/': () => {
      // Focus search
      const searchInput = document.querySelector('input[placeholder*="search" i]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    
    'mod+n': () => {
      // Create new note
      const createButton = document.querySelector('a[href*="/notes/new"], button[aria-label*="create" i]');
      if (createButton) {
        createButton.click();
      }
    },

    'mod+s': (event) => {
      // Save current form
      event.preventDefault();
      const saveButton = document.querySelector('button[type="submit"], button[aria-label*="save" i]');
      if (saveButton && !saveButton.disabled) {
        saveButton.click();
      }
    },

    'escape': () => {
      // Close modals or cancel operations
      const modal = document.querySelector('.modal-overlay');
      const closeButton = document.querySelector('.modal .btn-secondary, .modal [aria-label*="close" i]');
      
      if (modal && closeButton) {
        closeButton.click();
      }
    },

    'mod+k': () => {
      // Command palette (if implemented)
      console.log('Command palette shortcut triggered');
    },

    'mod+shift+d': () => {
      // Toggle dark mode (if implemented)
      console.log('Dark mode toggle shortcut triggered');
    },

    'mod+shift+/': () => {
      // Show keyboard shortcuts help
      console.log('Keyboard shortcuts help triggered');
    }
  };

  useKeyboardShortcuts(shortcuts);
};

// Notes-specific keyboard shortcuts
export const useNotesShortcuts = ({ onCreateNote, onSearch, onSelectAll, onDeleteSelected }) => {
  const shortcuts = {
    'mod+n': (event) => {
      event.preventDefault();
      onCreateNote?.();
    },

    'mod+f': (event) => {
      event.preventDefault();
      onSearch?.();
    },

    'mod+a': (event) => {
      // Only if we're in the notes list context
      const notesList = document.querySelector('.notes-container');
      if (notesList && document.activeElement && notesList.contains(document.activeElement)) {
        event.preventDefault();
        onSelectAll?.();
      }
    },

    'delete': (event) => {
      // Delete selected notes if any are selected
      const selectedNotes = document.querySelectorAll('.note-card input[type="checkbox"]:checked');
      if (selectedNotes.length > 0) {
        event.preventDefault();
        onDeleteSelected?.();
      }
    },

    'backspace': (event) => {
      // Same as delete for Mac users
      const selectedNotes = document.querySelectorAll('.note-card input[type="checkbox"]:checked');
      if (selectedNotes.length > 0) {
        event.preventDefault();
        onDeleteSelected?.();
      }
    }
  };

  useKeyboardShortcuts(shortcuts);
};

// Editor-specific keyboard shortcuts
export const useEditorShortcuts = ({ onSave, onCancel, onPreview }) => {
  const shortcuts = {
    'mod+s': (event) => {
      event.preventDefault();
      onSave?.();
    },

    'escape': (event) => {
      event.preventDefault();
      onCancel?.();
    },

    'mod+shift+p': (event) => {
      event.preventDefault();
      onPreview?.();
    },

    'mod+b': (event) => {
      // Bold text (if in textarea)
      if (event.target.tagName === 'TEXTAREA') {
        event.preventDefault();
        insertTextAtCursor(event.target, '**', '**');
      }
    },

    'mod+i': (event) => {
      // Italic text (if in textarea)
      if (event.target.tagName === 'TEXTAREA') {
        event.preventDefault();
        insertTextAtCursor(event.target, '_', '_');
      }
    },

    'mod+shift+c': (event) => {
      // Code block (if in textarea)
      if (event.target.tagName === 'TEXTAREA') {
        event.preventDefault();
        insertTextAtCursor(event.target, '```\n', '\n```');
      }
    }
  };

  useKeyboardShortcuts(shortcuts);
};

// Helper function to insert text at cursor position
const insertTextAtCursor = (textarea, before, after) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const newText = before + selectedText + after;
  
  textarea.setRangeText(newText, start, end, 'end');
  textarea.focus();
  
  // Trigger input event for React
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
};

// Hook for showing keyboard shortcuts help
export const useShortcutsHelp = () => {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts = {
    'mod+shift+/': () => setShowHelp(true),
    'escape': () => setShowHelp(false)
  };

  useKeyboardShortcuts(shortcuts);

  const shortcutsList = [
    { key: 'Ctrl/Cmd + N', description: 'Create new note' },
    { key: 'Ctrl/Cmd + S', description: 'Save current note' },
    { key: 'Ctrl/Cmd + F', description: 'Search notes' },
    { key: 'Ctrl/Cmd + A', description: 'Select all notes' },
    { key: 'Ctrl/Cmd + /', description: 'Focus search' },
    { key: 'Delete/Backspace', description: 'Delete selected notes' },
    { key: 'Escape', description: 'Close modal or cancel' },
    { key: 'Ctrl/Cmd + Shift + ?', description: 'Show this help' }
  ];

  return { showHelp, setShowHelp, shortcutsList };
};

export default useKeyboardShortcuts;