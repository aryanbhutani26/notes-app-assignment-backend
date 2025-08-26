import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import './Layout.css';

const Layout = ({ children, className = '', showHeader = true }) => {
  const { user } = useAuth();

  return (
    <div className={`layout ${className}`}>
      {showHeader && user && <Header />}
      
      <main className={`main-content ${!showHeader || !user ? 'full-height' : ''}`}>
        <div className="container">
          {children}
        </div>
      </main>
      
      {user && (
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <p>&copy; 2024 Notes App. All rights reserved.</p>
              <div className="footer-links">
                <a href="#privacy" className="footer-link">Privacy Policy</a>
                <a href="#terms" className="footer-link">Terms of Service</a>
                <a href="#support" className="footer-link">Support</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;