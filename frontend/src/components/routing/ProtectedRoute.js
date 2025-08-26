import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ROUTES, routeHelpers } from '../../config/routes';
import './ProtectedRoute.css';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  fallbackRoute = ROUTES.LOGIN,
  checkTokenExpiration = true,
  showLoadingMessage = true 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  // Check token expiration on route access
  useEffect(() => {
    if (requireAuth && isAuthenticated && checkTokenExpiration) {
      setIsCheckingToken(true);
      
      // Simulate token validation (in real app, this would be an API call)
      const validateToken = async () => {
        try {
          // Add any token validation logic here
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
          setIsCheckingToken(false);
        } catch (error) {
          console.error('Token validation failed:', error);
          setIsCheckingToken(false);
        }
      };

      validateToken();
    }
  }, [requireAuth, isAuthenticated, checkTokenExpiration, location.pathname]);

  // Show loading spinner while checking authentication or token
  if (isLoading || isCheckingToken) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner />
        {showLoadingMessage && (
          <p>
            {isLoading ? 'Verifying authentication...' : 'Validating session...'}
          </p>
        )}
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Save the attempted location for redirect after login
    return (
      <Navigate 
        to={fallbackRoute} 
        state={{ 
          from: location,
          message: 'Please log in to access this page.'
        }} 
        replace 
      />
    );
  }

  // If authentication is not required but user is authenticated (public routes)
  if (!requireAuth && isAuthenticated) {
    // Redirect to appropriate route based on where they came from
    const redirectTo = routeHelpers.getPostLoginRoute(location.state?.from?.pathname);
    return <Navigate to={redirectTo} replace />;
  }

  // Render the protected component
  return (
    <div className="protected-route" data-authenticated={isAuthenticated}>
      {children}
    </div>
  );
};

// Higher-order component for protecting routes
export const withProtectedRoute = (Component, options = {}) => {
  const ProtectedComponent = (props) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};

// Hook for checking if current route is protected
export const useProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const isProtectedRoute = () => {
    return routeHelpers.isProtectedRoute(location.pathname);
  };

  const canAccessRoute = () => {
    if (isLoading) return null; // Still checking
    if (isProtectedRoute()) return isAuthenticated;
    return true; // Public route
  };

  const getRequiredPermissions = () => {
    // This could be extended to check specific permissions
    // For now, just return whether auth is required
    return {
      requiresAuth: isProtectedRoute(),
      permissions: [] // Could be extended for role-based access
    };
  };

  return {
    isProtectedRoute: isProtectedRoute(),
    canAccessRoute: canAccessRoute(),
    isLoading,
    user,
    currentPath: location.pathname,
    requiredPermissions: getRequiredPermissions()
  };
};

// Component for handling unauthorized access
export const UnauthorizedAccess = ({ 
  message = "You don't have permission to access this page.",
  showLoginButton = true,
  onLoginClick
}) => {
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      window.location.href = ROUTES.LOGIN;
    }
  };

  return (
    <div className="unauthorized-access">
      <div className="unauthorized-content">
        <h1>Access Denied</h1>
        <p>{message}</p>
        {showLoginButton && (
          <button 
            className="btn btn-primary" 
            onClick={handleLoginClick}
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};

// Route guard component for multiple protection levels
export const RouteGuard = ({ 
  children, 
  guards = [], 
  fallback = null 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="route-guard-loading">
        <LoadingSpinner />
        <p>Checking permissions...</p>
      </div>
    );
  }

  // Check all guards
  for (const guard of guards) {
    const result = guard({ isAuthenticated, user, location });
    if (!result.allowed) {
      if (result.redirect) {
        return <Navigate to={result.redirect} replace />;
      }
      return fallback || <UnauthorizedAccess message={result.message} />;
    }
  }

  return children;
};

// Common guard functions
export const authGuard = ({ isAuthenticated }) => ({
  allowed: isAuthenticated,
  redirect: isAuthenticated ? null : ROUTES.LOGIN,
  message: 'Authentication required'
});

export const guestGuard = ({ isAuthenticated }) => ({
  allowed: !isAuthenticated,
  redirect: isAuthenticated ? ROUTES.DASHBOARD : null,
  message: 'Already authenticated'
});

export default ProtectedRoute;