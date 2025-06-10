import React from 'react';
import { Link } from 'react-router-dom';
import './header.css'; 

function Header() {
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
            <Link to="/faqs" className="nav-link">FAQs</Link>
          </nav>
          <div className="header-right">
            <Link to="/login" className="login-button">Log In</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;