import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-icon">404</div>
          <h1>Page Not Found</h1>
          <p>
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
          
          <div className="not-found-actions">
            <Link to="/dashboard" className="btn btn-primary">
              <Home size={20} />
              Go to Dashboard
            </Link>
            <button 
              className="btn btn-secondary"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;