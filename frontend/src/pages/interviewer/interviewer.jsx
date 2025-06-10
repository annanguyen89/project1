import React, { useState } from 'react';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import Button from '../../components/common/button/button';
import './interviewer.css';

function InterviewerPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcription, setTranscription] = useState('');

  const handleStart = () => {
    setIsStarted(true);
    setIsRecording(true);
    setCurrentQuestion("Hello! I'm your AI interviewer.");
  };

  return (
    <div className="interviewer-page-container">
      <Header />
      <main className="interviewer-main-content">
        <div className="interviewer-content">
          <div className="video-placeholder">
            {!isStarted ? (
              <div className="video-feed">
                <div className="video-placeholder-text">User Video</div>
              </div>
            ) : (
              <div className="video-feed">
                <div className="video-placeholder-text">User Video</div>
              </div>
            )}
          </div>
          
          {!isStarted ? (
            <Button 
              className="start-interview-button"
              onClick={handleStart}
            >
              Get Started
            </Button>
          ) : (
            <div className="interview-interface">
              <div className="voice-control-section">
                <div className="transcription-display">
                  <div className="question-text">{currentQuestion}</div>
                  {transcription ? (
                    <div className="answer-text">{transcription}</div>
                  ) : (
                    <div className="placeholder-text">Your answer will appear here...</div>
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