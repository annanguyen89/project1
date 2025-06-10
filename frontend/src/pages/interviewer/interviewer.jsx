import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import Button from '../../components/common/button/button';
import './interviewer.css';

function InterviewerPage() {
  const navigate = useNavigate();
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcription, setTranscription] = useState('');
  const [messages, setMessages] = useState([]);

  const handleStart = () => {
    setIsInterviewStarted(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: "Hello! I'm your AI interviewer."
      }]);
    }, 1000);
  };

  return (
    <div className="interviewer-page-container">
      <Header />
      <main className="interviewer-main-content">
        <div className="interviewer-content">
          <div className="video-placeholder">
            <div className="video-feed">
              <div className="video-placeholder-text">User Video</div>
            </div>
          </div>
          
          {!isInterviewStarted ? (
            <Button 
              className="start-interview-button"
              onClick={handleStart}
            >
              Get Started
            </Button>
          ) : (
            <div className="interview-interface">
              <div className="conversation-section">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.type === 'ai' ? 'ai-message' : 'user-message'}`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
              <div className="voice-control-section">
                <div className="transcription-display">
                  <div className="question-text">{currentQuestion}</div>
                  {transcription ? (
                    <div className="answer-text">{transcription}</div>
                  ) : (
                    <div className="placeholder-text">Your speech will appear here...</div>
                  )}
                </div>
                <Button 
                  className="next-question-button"
                >
                  Next Question
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default InterviewerPage; 