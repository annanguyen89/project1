import React from 'react';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import ChatInterface from '../../components/interview/ChatInterface';
import './interviewer.css';

function InterviewerPage() {
  return (
    <div className="interviewer-page">
      <Header />
      <main className="interviewer-main">
        <ChatInterface />
      </main>
      <Footer />
    </div>
  );
}

export default InterviewerPage; 