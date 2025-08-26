import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({
  isOpen = false,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  isDestructive = false,
  showIcon = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  autoFocusConfirm = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onCancel]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the appropriate button
      const buttonToFocus = autoFocusConfirm ? confirmButtonRef.current : cancelButtonRef.current;
      buttonToFocus?.focus();

      // Trap focus within dialog
      const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen, autoFocusConfirm]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onCancel?.();
    }
  }, [closeOnOverlayClick, onCancel]);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    if (loading || disabled) return;
    await onConfirm?.();
  }, [onConfirm, loading, disabled]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (loading) return;
    onCancel?.();
  }, [onCancel, loading]);

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle size={24} />;
      case 'warning':
        return <AlertTriangle size={24} />;
      case 'info':
        return <Info size={24} />;
      case 'success':
        return <CheckCircle size={24} />;
      default:
        return <AlertTriangle size={24} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="confirmation-dialog-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div 
        ref={dialogRef}
        className={`confirmation-dialog ${type} ${isDestructive ? 'destructive' : ''} ${className}`}
        {...props}
      >
        <div className="dialog-header">
          {showIcon && (
            <div className="dialog-icon">
              {getIcon()}
            </div>
          )}
          
          <div className="dialog-title-container">
            <h2 id="dialog-title" className="dialog-title">
              {title}
            </h2>
            
            <button
              type="button"
              onClick={handleCancel}
              className="dialog-close"
              aria-label="Close dialog"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="dialog-body">
          <p id="dialog-message" className="dialog-message">
            {message}
          </p>
          
          {children && (
            <div className="dialog-content">
              {children}
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
            disabled={loading || disabled}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing confirmation dialogs
export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    type: 'warning',
    isDestructive: false,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showConfirmation = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        type: options.type || 'warning',
        isDestructive: options.isDestructive || false,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Predefined confirmation types
  const confirmDelete = useCallback((itemName = 'item') => {
    return showConfirmation({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
      type: 'danger',
      isDestructive: true,
      confirmText: 'Delete',
      cancelText: 'Keep'
    });
  }, [showConfirmation]);

  const confirmBulkDelete = useCallback((count, itemType = 'items') => {
    return showConfirmation({
      title: 'Bulk Delete Confirmation',
      message: `Are you sure you want to delete ${count} ${itemType}? This action cannot be undone.`,
      type: 'danger',
      isDestructive: true,
      confirmText: `Delete ${count} ${itemType}`,
      cancelText: 'Cancel'
    });
  }, [showConfirmation]);

  const confirmUnsavedChanges = useCallback(() => {
    return showConfirmation({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave without saving?',
      type: 'warning',
      confirmText: 'Leave',
      cancelText: 'Stay'
    });
  }, [showConfirmation]);

  const confirmLogout = useCallback(() => {
    return showConfirmation({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      type: 'info',
      confirmText: 'Logout',
      cancelText: 'Stay Logged In'
    });
  }, [showConfirmation]);

  return {
    dialogState,
    showConfirmation,
    hideConfirmation,
    confirmDelete,
    confirmBulkDelete,
    confirmUnsavedChanges,
    confirmLogout,
    ConfirmationDialog: (props) => (
      <ConfirmationDialog
        {...dialogState}
        {...props}
      />
    )
  };
};

// Quick confirmation component for inline use
export const QuickConfirm = ({ 
  onConfirm, 
  children, 
  confirmationProps = {},
  ...buttonProps 
}) => {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const handleClick = async () => {
    const confirmed = await showConfirmation(confirmationProps);
    if (confirmed) {
      onConfirm?.();
    }
  };

  return (
    <>
      <button {...buttonProps} onClick={handleClick}>
        {children}
      </button>
      <ConfirmationDialog />
    </>
  );
};

export default ConfirmationDialog;