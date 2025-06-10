import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import Button from '../../components/common/button/button';
import aiInterviewerCristine from '../../assets/images/ai_interviewer_cristine.jpg';
import './home.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page-container">
      <Header />
      <main className="main-content">
        <section className="hero-section">
          <h1>Practice your interview with an AI coach</h1>
          <p>
            Our solution offers a personalized mock interview experience for any positions from different areas. By uploading your resume and job description, we generate tailored questions, and provide detailed feedback and actions based on your performance.
          </p>
          <Link to="/interviewer/upload" className="start-interview-button">
            Start Your Interview
          </Link>
          <div className="ai-interviewer-image-container">
            <img src={aiInterviewerCristine} alt="AI Interviewer Cristine" />
          </div>
          
          <div className="key-features-section">
            <div className="key-features-container">
              <h2>Key Features</h2>
              
              <div className="feature-item">
                <div className="feature-content">
                  <h3>Phone Interview</h3>
                  <p>Practice phone screens with personalized questions. Boost your confidence by getting real-time feedback.</p>
                </div>
                <div className="feature-preview">
                  <div className="video-placeholder">Video Preview</div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-preview">
                  <div className="video-placeholder">Video Preview</div>
                </div>
                <div className="feature-content">
                  <h3>Technical Interview</h3>
                  <p>Practice AI-generated technical questions tailored to your job description and the company's interview pattern.</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-content">
                  <h3>Behavioral Interview</h3>
                  <p>Practice STAR method for behavioral questions tailored to your resume. Get sample answers with your own story.</p>
                </div>
                <div className="feature-preview">
                  <div className="video-placeholder">Video Preview</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;