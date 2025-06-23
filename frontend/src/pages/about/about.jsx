import React from 'react';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import './about.css';

function AboutPage() {
  return (
    <div className="about-page-container">
      <Header />
      <main className="about-main-content">
        <div className="about-hero-section">
          <h1>About AI Interview Helper</h1>
          <p className="about-subtitle">
            AI Interview Helper is a platform that helps you prepare for your interviews
          </p>
        </div>

        <div className="about-content-sections">
          <section className="about-section">
            <h2>Our Motivation</h2>
            <p>
              Job interviews can be one of the most stressful experiences in anyone's career journey (including me). 
              Traditional interview preparation often relies on generic advice, outdated practice questions, 
              or expensive coaching sessions that may not be accessible to everyone. We developed this solution from the need for personalized and accessible interview preparation 
              that adapts to each individual's unique background and target role.
            </p>
            <p>
              The inspiration for this project came from observing talented professionals struggle 
              with interview anxiety, not because they lacked skills, but because they lacked proper preparation 
              tailored to their specific situation. We believe that everyone deserves the opportunity to present 
              their best self during interviews, regardless of their background or financial situation.
            </p>
          </section>

          <section className="about-section">
            <h2>Problems We Solve</h2>
            <p>
              Many job seekers face several challenges when preparing for interviews:
            </p>
            <ul className="problem-list">
              <li><strong>Generic Preparation:</strong> Most resources provide one-size-fits-all advice that doesn't consider individual experiences or target roles</li>
              <li><strong>Lack of Personalization:</strong> Traditional methods don't analyze your resume against specific job descriptions</li>
              <li><strong>Limited Feedback:</strong> Practice with friends or family often lacks the depth and objectivity needed for improvement</li>
              <li><strong>Accessibility:</strong> Professional coaching can be expensive and not available to everyone</li>
              <li><strong>Real-time Practice:</strong> Difficulty simulating actual interview conditions and pressure</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Our Solution</h2>
            <p>
              Our AI Interview Helper uses cutting-edge artificial intelligence technology to provide 
              a comprehensive, personalized interview preparation experience. Here's how we transform 
              the interview preparation process:
            </p>
            
            <div className="solution-features">
              <div className="feature-card">
                <h3>Personalized Question Generation</h3>
                <p>
                  Our AI analyzes your resume and the job description to generate relevant 
                  interview questions. This ensures that every practice session is tailored to your specific 
                  background and the position you're applying for.
                </p>
              </div>

              <div className="feature-card">
                <h3>Multi-Modal Interview Types</h3>
                <p>
                  We support various interview formats including technical coding challenges, behavioral 
                  questions using the STAR method, and phone screening simulations. Each type is designed 
                  to mirror real interview scenarios you'll encounter.
                </p>
              </div>

              <div className="feature-card">
                <h3>Advanced AI Feedback</h3>
                <p>
                  Powered by AWS Bedrock and Claude 2 model, our solution provides detailed, constructive 
                  feedback on your responses, helping you understand not just what to improve, but how to 
                  improve it.
                </p>
              </div>

              <div className="feature-card">
                <h3>Embedding-Optimized Performance</h3>
                <p>
                  We use embedding vectors to optimize token usage and ensure faster, more 
                  efficient AI responses while maintaining the highest quality of interaction.
                </p>
              </div>

              <div className="feature-card">
                <h3>Speech-to-Text Integration</h3>
                <p>
                  Practice speaking your answers aloud with our integrated speech recognition, simulating 
                  real interview conditions and helping you become more comfortable with verbal communication.
                </p>
              </div>

              <div className="feature-card">
                <h3>Accessible and Scalable</h3>
                <p>
                  Our web-based platform is accessible from anywhere, making professional-grade interview 
                  preparation available to job seekers regardless of their location or budget constraints.
                </p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Technology Behind the Solution</h2>
            <p>
              Our platform is built using modern, scalable technologies designed for optimal performance and user experience:
            </p>
            <ul className="tech-list">
              <li><strong>Frontend:</strong> React.js with responsive design for seamless cross-device experience</li>
              <li><strong>AI Engine:</strong> AWS Bedrock with Claude 2 model for intelligent question generation and feedback</li>
              <li><strong>Optimization:</strong> Advanced embedding vectors for efficient token usage and faster responses</li>
              <li><strong>Speech Processing:</strong> Integrated AWS Transcribe for speech-to-text capabilities</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Our Vision</h2>
            <p>
              We envision a world where interview preparation is no longer a barrier to career advancement. 
              Our goal is to democratize access to high-quality interview coaching, helping professionals 
              at all levels present their best selves and secure the opportunities they deserve.
            </p>
            <p>
              By combining artificial intelligence with deep understanding of interview dynamics, we're not 
              just creating a practice tool, but we're building a comprehensive career advancement platform that 
              evolves with the changing landscape of professional interviews.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AboutPage; 