# AI Interview Helper

An intelligent interview preparation platform that provides realistic AI-powered mock interviews and detailed feedback.

## Project Structure

- `frontend/`: React application for the user interface
- `backend/`: Node.js backend with Firebase Cloud Functions
- `.github/`: GitHub Actions workflows for CI/CD

## Features

- AI-powered mock interviews
- Real-time feedback on responses
- Detailed performance analysis
- Personalized improvement recommendations
- Integration with AWS services (Bedrock, Transcribe, Rekognition)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI
- AWS Account with necessary services enabled

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/AI-Interview-Helper.git
cd AI-Interview-Helper
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd ../backend/functions
npm install
```

4. Set up environment variables
- Copy `.env.example` to `.env` in both frontend and backend directories
- Fill in the required environment variables

5. Start the development servers
```bash
# Frontend
cd frontend
npm start

# Backend (in a separate terminal)
cd backend/functions
npm run serve
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 