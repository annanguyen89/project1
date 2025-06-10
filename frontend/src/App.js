import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/home';
import LoginPage from './pages/login/login';
import SignUpPage from './pages/sign-up/sign-up';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          {/* Add routes for About, FAQs, etc., as you create those pages */}
          <Route path="/about" element={<div>About Page Placeholder</div>} />
          <Route path="/faqs" element={<div>FAQs Page Placeholder</div>} />
          <Route path="*" element={<div>404 Not Found</div>} /> {/* Catch-all for unknown routes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;