import React, { Suspense, lazy } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../common/ErrorFallback';

// Lazy load page components
const LoginPage = lazy(() => 
  import('../../pages/LoginPage').then(module => ({
    default: module.default
  }))
);

const RegisterPage = lazy(() => 
  import('../../pages/RegisterPage').then(module => ({
    default: module.default
  }))
);

const NotesPage = lazy(() => 
  import('../../pages/NotesPage').then(module => ({
    default: module.default
  }))
);

const NoteEditor = lazy(() => 
  import('../../pages/NoteEditor').then(module => ({
    default: module.default
  }))
);

const NotFound = lazy(() => 
  import('../../pages/NotFound').then(module => ({
    default: module.default
  }))
);

// Lazy load feature components
const NoteCard = lazy(() => 
  import('../notes/NoteCard').then(module => ({
    default: module.default
  }))
);

const Header = lazy(() => 
  import('../layout/Header').then(module => ({
    default: module.default
  }))
);

// Higher-order component for lazy loading with error boundary
const withLazyLoading = (Component, fallback = null) => {
  const LazyComponent = React.forwardRef((props, ref) => (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Lazy loading error:', error, errorInfo);
      }}
    >
      <Suspense 
        fallback={
          fallback || (
            <div className="lazy-loading">
              <LoadingSpinner message="Loading..." />
            </div>
          )
        }
      >
        <Component {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));

  LazyComponent.displayName = `LazyLoaded(${Component.displayName || Component.name})`;
  return LazyComponent;
};

// Custom loading fallbacks for different components
const PageLoadingFallback = () => (
  <div className="page-loading">
    <LoadingSpinner size="large" message="Loading page..." />
  </div>
);

const ComponentLoadingFallback = () => (
  <div className="component-loading">
    <LoadingSpinner size="small" />
  </div>
);

// Export lazy-loaded components with appropriate fallbacks
export const LazyLoginPage = withLazyLoading(LoginPage, <PageLoadingFallback />);
export const LazyRegisterPage = withLazyLoading(RegisterPage, <PageLoadingFallback />);
export const LazyNotesPage = withLazyLoading(NotesPage, <PageLoadingFallback />);
export const LazyNoteEditor = withLazyLoading(NoteEditor, <PageLoadingFallback />);
export const LazyNotFound = withLazyLoading(NotFound, <PageLoadingFallback />);

export const LazyNoteCard = withLazyLoading(NoteCard, <ComponentLoadingFallback />);
export const LazyHeader = withLazyLoading(Header, <ComponentLoadingFallback />);

// Preload functions for better UX
export const preloadRoutes = {
  login: () => import('../../pages/LoginPage'),
  register: () => import('../../pages/RegisterPage'),
  notes: () => import('../../pages/NotesPage'),
  editor: () => import('../../pages/NoteEditor'),
  notFound: () => import('../../pages/NotFound')
};

// Preload critical routes on app initialization
export const preloadCriticalRoutes = () => {
  // Preload login and notes pages as they're most commonly used
  preloadRoutes.login();
  preloadRoutes.notes();
};

// Preload routes based on user interaction
export const preloadOnHover = (routeName) => {
  if (preloadRoutes[routeName]) {
    preloadRoutes[routeName]();
  }
};

// Hook for preloading routes
export const useRoutePreloader = () => {
  const preload = React.useCallback((routeName) => {
    if (preloadRoutes[routeName]) {
      preloadRoutes[routeName]();
    }
  }, []);

  const preloadAll = React.useCallback(() => {
    Object.values(preloadRoutes).forEach(preloadFn => preloadFn());
  }, []);

  return { preload, preloadAll };
};

export default {
  LazyLoginPage,
  LazyRegisterPage,
  LazyNotesPage,
  LazyNoteEditor,
  LazyNotFound,
  LazyNoteCard,
  LazyHeader,
  withLazyLoading,
  preloadRoutes,
  preloadCriticalRoutes,
  preloadOnHover,
  useRoutePreloader
};