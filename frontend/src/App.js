import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/home/home';
import LoginPage from './pages/login/login';
import SignUpPage from './pages/sign-up/sign-up';
import InterviewerPage from './pages/interviewer/interviewer';
import UploadPage from './pages/interviewer/upload';
import AboutPage from './pages/about/about';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/interviewer" element={<InterviewerPage />} />
            <Route path="/interviewer/upload" element={<UploadPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<div>404 Not Found</div>} /> 
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;