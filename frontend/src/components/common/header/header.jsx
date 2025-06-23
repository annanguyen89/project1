import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { signOutUser } from '../../../services/authService';
import './header.css'; 

function Header() {
  const { currentUser, userData } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <div className="header-left">
            <Link to="/" className="app-title">AI Interview Helper</Link>
          </div>
          <nav className="header-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About</Link>
          </nav>
          <div className="header-right">
            {currentUser ? (
              <div className="user-menu">
                <span className="user-greeting">
                  Hello, {userData?.firstName || currentUser.displayName || 'User'}!
                </span>
                <button onClick={handleSignOut} className="logout-button">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button">Log In</Link>
                <Link to="/sign-up" className="signup-button">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;