import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/button/button';
import './AuthForms.css';

function SignUpForm() {
  return (
    <div className="auth-form-card">
      <h2>Create Account</h2>
      <form className="auth-form">
        <div className="name-group">
          <div className="form-group half">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" name="firstName" placeholder="Enter your first name" required />
          </div>
          <div className="form-group half">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" id="lastName" name="lastName" placeholder="Enter your last name" required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" required />
        </div>
      </form>
      <Button type="submit" className="form-submit-button">Create Account</Button>
      <div className="sign-up-link">
        <span>Already have an account? </span>
        <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}

export default SignUpForm;