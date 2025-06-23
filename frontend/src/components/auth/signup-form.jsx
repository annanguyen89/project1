import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../common/button/button';
import { signUpWithEmail } from '../../services/authService';
import './AuthForms.css'; 

function SignUpForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await signUpWithEmail(
      formData.email, 
      formData.password, 
      formData.firstName, 
      formData.lastName
    );
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-form-card">
      <h2>Create Account</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="name-group">
          <div className="form-group half">
            <label htmlFor="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              name="firstName" 
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name" 
              required 
              disabled={loading}
            />
          </div>
          <div className="form-group half">
            <label htmlFor="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              name="lastName" 
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name" 
              required 
              disabled={loading}
            />
          </div>
        </div>
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
            placeholder="Enter your password (min 6 characters)" 
            required 
            disabled={loading}
          />
        </div>
        <Button 
          type="submit" 
          className="form-submit-button"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      <div className="sign-up-link">
        <span>Already have an account? </span>
        <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}

export default SignUpForm;