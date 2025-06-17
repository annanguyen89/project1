const API_BASE_URL = 'https://us-central1-ai-interview-helper-d2407.cloudfunctions.net';

export const API_ENDPOINTS = {
    UPLOAD_DOCUMENT: `${API_BASE_URL}/uploadDocument`,
    START_INTERVIEW: `${API_BASE_URL}/startInterview`,
    CONTINUE_INTERVIEW: `${API_BASE_URL}/continueInterview`,
    TRANSCRIBE: `${API_BASE_URL}/transcribe`,
    GENERATE_QUESTIONS: `${API_BASE_URL}/generateQuestions`,
    INTERVIEW_CHAT: `${API_BASE_URL}/interviewChat`
};

export default API_ENDPOINTS; 