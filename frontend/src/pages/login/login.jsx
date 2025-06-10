import React from 'react';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import LoginForm from '../../components/auth/login-form';
import './login.css'; // Shared CSS for auth pages

function LoginPage() {
  return (
    <div className="auth-page-container">
      <Header />
      <main className="auth-main-content">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
}

export default LoginPage;