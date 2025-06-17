import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ChatInterface from './ChatInterface';
import { API_ENDPOINTS } from '../../config/api';

const UploadForm = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size should be less than 5MB');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resumeFile || !jobDescription.trim()) {
      setError('Please provide both a resume and job description');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resumeFile', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD_DOCUMENT, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      localStorage.setItem('interviewData', JSON.stringify({
        extractedText: data.extractedText,
        jobDescription: data.jobDescription,
        fileReferences: data.fileReferences
      }));

      setExtractedText(data.extractedText);
      setUploadComplete(true);
    } catch (err) {
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsLoading(false);
    }
  };

  if (uploadComplete) {
    return (
      <Box sx={{ p: 3 }}>
        <ChatInterface 
          resumeText={extractedText} 
          jobDescription={jobDescription} 
        />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: '600px', mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Upload Your Resume
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <input
            accept=".pdf"
            style={{ display: 'none' }}
            id="resume-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              {resumeFile ? resumeFile.name : 'Upload PDF Resume'}
            </Button>
          </label>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Job Description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Start Interview Prep'}
        </Button>
      </form>
    </Paper>
  );
};

export default UploadForm; 