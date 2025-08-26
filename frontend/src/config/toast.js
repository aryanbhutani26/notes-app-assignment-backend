import { toast } from 'react-toastify';

// Toast configuration
export const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "light"
};

// Custom toast methods with consistent styling
export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, {
      ...toastConfig,
      ...options,
      className: 'toast-success'
    });
  },

  error: (message, options = {}) => {
    toast.error(message, {
      ...toastConfig,
      autoClose: 5000, // Longer for errors
      ...options,
      className: 'toast-error'
    });
  },

  warning: (message, options = {}) => {
    toast.warning(message, {
      ...toastConfig,
      autoClose: 4000,
      ...options,
      className: 'toast-warning'
    });
  },

  info: (message, options = {}) => {
    toast.info(message, {
      ...toastConfig,
      ...options,
      className: 'toast-info'
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastConfig,
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      ...options,
      className: 'toast-loading'
    });
  },

  update: (toastId, message, type = 'success', options = {}) => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      autoClose: 3000,
      closeOnClick: true,
      draggable: true,
      ...options
    });
  },

  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
};

// Utility functions for common toast patterns
export const toastUtils = {
  // For async operations
  async withToast(promise, messages = {}) {
    const {
      loading = 'Processing...',
      success = 'Operation completed successfully!',
      error = 'Operation failed. Please try again.'
    } = messages;

    const toastId = showToast.loading(loading);

    try {
      const result = await promise;
      showToast.update(toastId, success, 'success');
      return result;
    } catch (err) {
      const errorMessage = err.message || error;
      showToast.update(toastId, errorMessage, 'error');
      throw err;
    }
  },

  // For form validation errors
  showValidationErrors(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      showToast.error(`${field}: ${message}`, {
        toastId: `validation-${field}` // Prevent duplicate toasts
      });
    });
  },

  // For network errors
  showNetworkError(error) {
    const message = error.response?.data?.message || 
                   error.message || 
                   'Network error. Please check your connection.';
    
    showToast.error(message, {
      toastId: 'network-error',
      autoClose: 5000
    });
  },

  // For authentication errors
  showAuthError(error) {
    const message = error.response?.data?.message || 
                   'Authentication failed. Please try again.';
    
    showToast.error(message, {
      toastId: 'auth-error',
      autoClose: 4000
    });
  }
};

export default showToast;