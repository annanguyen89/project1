import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import Button from '../../components/common/button/button';
import './upload.css';

const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_JOB_DESC_LENGTH = 5000;

function UploadPage() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef();

  const handleResumeChange = (event) => {
    setError('');
    setSuccess('');
    const file = event.target.files[0];
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (
      !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
    ) {
      setError('Please upload a PDF or Word document');
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setResumeFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!resumeFile) {
      setError('Please upload your resume (PDF, DOC, DOCX, <8MB)');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }
    if (jobDescription.length > MAX_JOB_DESC_LENGTH) {
      setError('Job description is too long (max 5000 characters).');
      return;
    }

    console.log('Resume file before submit:', resumeFile);
    console.log('Job description before submit:', jobDescription);

    setIsLoading(true);
    const formData = new FormData();
    formData.append('resumeFile', resumeFile);
    formData.append('jobDescription', jobDescription);

    // Timeout logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

    try {
      const response = await fetch(
        process.env.REACT_APP_API_URL + '/uploadDocument',
        {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setSuccess('Files uploaded successfully! Ready for the interview...');
      localStorage.setItem('interviewData', JSON.stringify({
        extractedText: data.extractedText || '',
        jobDescription: jobDescription
      }));

      setTimeout(() => {
        navigate('/interviewer');
      }, 1500);
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
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
                  accept=".pdf"
                  onChange={handleResumeChange}
                  className="file-input"
                  ref={fileInputRef}
                  aria-label="Upload your resume as PDF, max 8MB"
                />
                <label htmlFor="resume-upload" className="file-upload-label">
                  {resumeFile ? resumeFile.name : 'Choose a file or drag it here'}
                </label>
                <p className="file-upload-hint">Supported formats: PDF &lt;8MB</p>
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
                maxLength={MAX_JOB_DESC_LENGTH}
                aria-label="Paste the job description here"
              />
              <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
                {jobDescription.length}/{MAX_JOB_DESC_LENGTH}
              </div>
            </div>

            <div aria-live="polite" style={{ minHeight: '32px' }}>
              {error && (
                <p className="error-message" style={{
                  color: 'red',
                  background: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  padding: '8px',
                  marginTop: '15px',
                }}>{error}</p>
              )}
              {success && (
                <p style={{
                  color: 'green',
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  padding: '8px',
                  marginTop: '15px',
                }}>{success}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="start-interview-button"
              disabled={isLoading}
              aria-busy={isLoading}
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