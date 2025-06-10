import React from 'react';
import Button from '../common/button/button';
import './AuthForms.css'; 

function SignUpForm() {
  return (
    <div className="auth-form-card">
      <h2>Create Account</h2>
      <form className="auth-form">
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input type="text" id="firstName" name="firstName" placeholder=" " required />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input type="text" id="lastName" name="lastName" placeholder=" " required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder=" " required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder=" " required />
        </div>
        <Button type="submit" className="form-submit-button">Create Account</Button>
      </form>
    </div>
  );
}

export default SignUpForm;