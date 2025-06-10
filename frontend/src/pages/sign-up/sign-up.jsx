import React from 'react';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import SignUpForm from '../../components/auth/signup-form';
import './sign-up.css'; // Shared CSS for auth pages

function SignUpPage() {
  return (
    <div className="page-container">
      <Header />
      <main className="main-content">
        <SignUpForm />
      </main>
      <Footer />
    </div>
  );
}

export default SignUpPage;