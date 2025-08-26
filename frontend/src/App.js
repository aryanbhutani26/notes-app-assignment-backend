import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toastConfig } from './config/toast';
import './App.css';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';

// Router
import AppRouter from './components/routing/AppRouter';

// Global styles
import './styles/globals.css';
import './styles/toast.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <Router>
          <AuthProvider>
            <NotesProvider>
              <AppRouter />
              
              {/* Toast notifications container */}
              <ToastContainer
                {...toastConfig}
                className="toast-container"
              />
            </NotesProvider>
          </AuthProvider>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;