import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { User, LogOut, Menu, X, FileText } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          {/* Logo/Brand */}
          <Link to="/dashboard" className="header-brand" onClick={closeMenu}>
            <FileText size={24} />
            <span className="brand-text">Notes</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav desktop-nav">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/notes/new" className="nav-link">
              New Note
            </Link>
          </nav>

          {/* User Menu */}
          <div className="header-user">
            {/* Desktop User Menu */}
            <div className="user-menu desktop-menu">
              <div className="user-info">
                <User size={20} />
                <span className="username">{user?.username}</span>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="mobile-nav">
            <div className="mobile-nav-content">
              <div className="mobile-user-info">
                <User size={20} />
                <span className="username">{user?.username}</span>
              </div>
              
              <div className="mobile-nav-links">
                <Link 
                  to="/dashboard" 
                  className="mobile-nav-link"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/notes/new" 
                  className="mobile-nav-link"
                  onClick={closeMenu}
                >
                  New Note
                </Link>
              </div>
              
              <button
                className="mobile-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;