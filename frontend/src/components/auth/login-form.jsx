import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/button/button';
import './AuthForms.css'; // Create a shared CSS file for auth forms

function LoginForm() {
  return (
    <div className="auth-form-card">
      <h2>AI Interview Helper</h2>
      <form className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="Enter your email" 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            placeholder="Enter your password" 
            required 
          />
        </div>
        <a href="/forgot-password" className="forgot-password-link">Forgot your password?</a>
        <Button type="submit" className="form-submit-button">Log In</Button>
        <div className="sign-up-link">
          <span>Don't have an account? </span>
          <Link to="/sign-up">Create a new account</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;