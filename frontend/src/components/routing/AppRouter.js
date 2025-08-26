import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ROUTES } from '../../config/routes';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../layout/Layout';

// Lazy load components for code splitting
const LoginPage = React.lazy(() => import('../../pages/LoginPage'));
const RegisterPage = React.lazy(() => import('../../pages/RegisterPage'));
const NotesPage = React.lazy(() => import('../../pages/NotesPage'));
const NoteEditor = React.lazy(() => import('../../pages/NoteEditor'));
const NotFound = React.lazy(() => import('../../pages/NotFound'));

// Public Route wrapper (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
};

// Root redirect component
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="root-loading">
        <LoadingSpinner />
        <p>Initializing application...</p>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />;
};

// Main App Router component
const AppRouter = () => {
  return (
    <Suspense fallback={
      <div className="app-loading">
        <LoadingSpinner />
        <p>Loading application...</p>
      </div>
    }>
      <Routes>
        {/* Root route - redirect based on auth status */}
        <Route 
          path={ROUTES.HOME} 
          element={<RootRedirect />} 
        />

        {/* Public routes */}
        <Route 
          path={ROUTES.LOGIN} 
          element={
            <Layout showHeader={false}>
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            </Layout>
          } 
        />
        <Route 
          path={ROUTES.REGISTER} 
          element={
            <Layout showHeader={false}>
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            </Layout>
          } 
        />

        {/* Protected routes */}
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            <Layout>
              <ProtectedRoute requireAuth={true} checkTokenExpiration={true}>
                <NotesPage />
              </ProtectedRoute>
            </Layout>
          } 
        />
        <Route 
          path={ROUTES.NOTE_NEW} 
          element={
            <Layout>
              <ProtectedRoute requireAuth={true} checkTokenExpiration={true}>
                <NoteEditor />
              </ProtectedRoute>
            </Layout>
          } 
        />
        <Route 
          path={ROUTES.NOTE_EDIT} 
          element={
            <Layout>
              <ProtectedRoute requireAuth={true} checkTokenExpiration={true}>
                <NoteEditor />
              </ProtectedRoute>
            </Layout>
          } 
        />

        {/* 404 route */}
        <Route path="*" element={
          <Layout showHeader={false}>
            <NotFound />
          </Layout>
        } />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;