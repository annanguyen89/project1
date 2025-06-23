import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/button/button';
import { signInWithEmail, resetPassword } from '../../services/authService';
import './AuthForms.css';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signInWithEmail(formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    const result = await resetPassword(formData.email);
    if (result.success) {
      setResetEmailSent(true);
      setError('');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-form-card">
      <h2>AI Interview Helper</h2>
      {resetEmailSent && (
        <div className="success-message">
          Password reset email sent! Check your inbox.
        </div>
      )}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email" 
            required 
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password" 
            required 
            disabled={loading}
          />
        </div>
        <button 
          type="button" 
          onClick={handleForgotPassword}
          className="forgot-password-link"
          disabled={loading}
        >
          Forgot your password?
        </button>
        <Button 
          type="submit" 
          className="form-submit-button"
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </Button>
        <div className="sign-up-link">
          <span>Don't have an account? </span>
          <Link to="/sign-up">Create a new account</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;