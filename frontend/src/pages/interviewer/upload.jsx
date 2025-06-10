import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import Button from '../../components/common/button/button';
import './upload.css';

function UploadPage() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResumeChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setResumeFile(file);
    } else {
      alert('Please upload a PDF or Word document');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resumeFile || !jobDescription.trim()) {
      alert('Please upload your resume and provide a job description');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/interviewer');
    }, 2000);
  };

  return (
    <div className="upload-page-container">
      <Header />
      <main className="upload-main-content">
        <div className="upload-content">
          <h1>Prepare for Your Interview</h1>
          <p className="upload-description">
            Upload your resume and provide the job description to help us tailor the interview questions to your needs.
          </p>

          <form className="upload-form" onSubmit={handleSubmit}>
            <div className="upload-section">
              <h2>Upload Your Resume</h2>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  className="file-input"
                />
                <label htmlFor="resume-upload" className="file-upload-label">
                  {resumeFile ? resumeFile.name : 'Choose a file or drag it here'}
                </label>
                <p className="file-upload-hint">Supported formats: PDF, DOC, DOCX</p>
              </div>
            </div>

            <div className="upload-section">
              <h2>Job Description</h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="job-description-input"
                rows="6"
              />
            </div>

            <Button 
              type="submit" 
              className="start-interview-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Start Interview'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default UploadPage; 