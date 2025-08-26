import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  INITIALIZE_AUTH: 'INITIALIZE_AUTH',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        error: null
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        isLoading: false
      };

    case AUTH_ACTIONS.INITIALIZE_AUTH:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app startup
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const user = authService.initializeAuth();
        const token = authService.getToken();
        const isAuthenticated = authService.isAuthenticated();

        dispatch({
          type: AUTH_ACTIONS.INITIALIZE_AUTH,
          payload: {
            user,
            token,
            isAuthenticated
          }
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({
          type: AUTH_ACTIONS.INITIALIZE_AUTH,
          payload: {
            user: null,
            token: null,
            isAuthenticated: false
          }
        });
      }
    };

    initializeAuth();
  }, []);

  // Check token expiration periodically
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        const isValid = authService.checkTokenExpiration();
        if (!isValid) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  // Login function
  const login = async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await authService.login(username, password);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: result
      });
      
      return result;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || 'Login failed'
      });
      throw error;
    }
  };

  // Register function
  const register = async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const result = await authService.register(username, password);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: result
      });
      
      return result;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || 'Registration failed'
      });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    try {
      authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Set loading function
  const setLoading = (loading) => {
    dispatch({ 
      type: AUTH_ACTIONS.SET_LOADING, 
      payload: loading 
    });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    clearError,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;