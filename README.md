# AI Interview Helper

A mock interview platform powered by AWS Bedrock Claude 2, AWS Transcribe, and Firebase that provides personalized interview questions and detailed feedback based on your resume and job description.

## Our website
** Start practicing:** [https://ai-interview-helper-d2407.web.app](https://ai-interview-helper-d2407.web.app)

### **Multi-Modal Interview Experience**
- **Voice Recording**: Real-time speech-to-text transcription using AWS Transcribe
- **Text Input**: Traditional typing interface for responses
- **Interactive Chat**: Dynamic conversation flow with AI interviewer

### **AI-Powered Intelligence**
- **AWS Bedrock Claude 2**: Advanced language model for question generation and feedback
- **Titan Text Embeddings V2**: Vector-based CV and job description analysis
- **Personalized Questions**: Tailored to your experience and target role
- **Comprehensive Feedback**: Detailed performance analysis and improvement suggestions

### **Interview Types**
- **Technical Interviews**: LeetCode-style coding problems
- **Behavioral Interviews**: STAR method practice
- **Phone Screens**: Conversational interview simulation

## Project Structure

```
ai-interview-helper/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API and Firebase services
│   │   ├── contexts/       # React contexts for state management
│   │   └── config/         # Configuration files
│   └── public/             # Static assets
├── functions/               # Firebase Cloud Functions (Backend)
│   ├── services/           # Business logic services
│   │   ├── bedrock-client.js      # AWS Bedrock integration
│   │   ├── embedding-service.js   # Titan embeddings service
│   │   ├── interview-service.js   # Interview logic
│   │   └── interview-chat-service.js
│   ├── index.js            # Main functions entry point
│   ├── uploadHandler.js    # File upload management
│   └── config.js          # Backend configuration
└── package.json           # Root dependencies
```

## Tech Stack

### Frontend
- **React 18.2.0** - UI framework
- **Material-UI 5.13.0** - Component library
- **React Router 6.30.1** - Navigation
- **Firebase 9.22.0** - Authentication and storage
- **Axios 1.4.0** - HTTP client

### Backend
- **Firebase Cloud Functions** - Serverless backend
- **Node.js 20** - Runtime environment
- **AWS Bedrock** - AI model access
- **AWS Transcribe** - Speech-to-text service
- **Firebase Admin SDK** - Backend services

### AI & ML
- **AWS Bedrock Claude 2** - Language model
- **Amazon Titan Text Embeddings V2** - Vector embeddings
