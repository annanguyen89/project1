const functions = require("firebase-functions");
const admin = require("./firebase");  
const { handleUpload } = require("./uploadHandler");
const SpeechToText = require("./speechToText");
const multer = require('multer');
const path = require('path');
const { generateInterviewQuestions } = require('./bedrock-service');
const interviewChatService = require('./services/interview-chat-service');
const { onRequest } = require("firebase-functions/v2/https");
const cors = require('cors')({ origin: true });

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
}).single('resumeFile');

// Define the functions
exports.uploadDocument = functions.https.onRequest(handleUpload);

exports.interviewChat = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Check if the request is JSON
      if (!req.is('application/json')) {
        return res.status(400).json({ 
          message: "Content-Type must be application/json",
          received: req.get('content-type')
        });
      }

      const { currentQuestionIndex, userAnswer, chatHistory } = req.body;
      const interviewData = req.body.interviewData || {};
      const { cv, jobDescription } = interviewData;

      let response;
      if (currentQuestionIndex === 0) {
        // Start new interview
        response = await interviewChatService.startInterview(cv, jobDescription);
      } else {
        // Continue interview with user's answer
        response = await interviewChatService.handleUserResponse(
          cv,
          jobDescription,
          userAnswer,
          currentQuestionIndex,
          chatHistory
        );
      }

      // If response already has bedrockResult format, use it directly
      if (response.bedrockResult) {
        res.status(200).json(response);
      } else {
        // Otherwise, format it to match bedrockResult structure
        res.status(200).json({
          bedrockResult: {
            content: [{ text: response.message }],
            isComplete: response.isComplete,
            questionCount: response.questionCount
          }
        });
      }
    } catch (error) {
      console.error("Error in interviewChat:", error);
      res.status(500).json({ 
        message: "Error processing request", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});

const speechToText = new SpeechToText();

// Transcribe endpoint
exports.transcribe = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { audio } = req.body;
            if (!audio || typeof audio !== 'string') {
                return res.status(400).json({ 
                    error: 'Invalid audio data. Expected base64 string.' 
                });
            }

            // Remove data URL prefix if present
            const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
            
            const result = await speechToText.startTranscription(base64Data);
            res.json(result);
        } catch (error) {
            console.error('Transcription error:', error);
            res.status(500).json({ 
                error: 'Transcription failed', 
                details: error.message 
            });
        }
    });
});

// Generate interview questions endpoint
exports.generateQuestions = functions.https.onRequest(async (req, res) => {
    try {
        const { cv, jobDescription } = req.body;
        
        if (!cv || !jobDescription) {
            return res.status(400).json({ 
                error: 'Both CV and job description are required' 
            });
        }

        const questions = await generateInterviewQuestions(cv, jobDescription);
        res.json({ questions });
    } catch (error) {
        console.error('Error in generate-questions endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to generate interview questions',
            details: error.message 
        });
    }
});

// Start interview endpoint
exports.startInterview = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { cv, jobDescription } = req.body;
            
            if (!cv || !jobDescription) {
                return res.status(400).json({ 
                    error: 'Both CV and job description are required' 
                });
            }

            const response = await interviewChatService.startInterview(cv, jobDescription);
            res.json(response);
        } catch (error) {
            console.error('Error starting interview:', error);
            res.status(500).json({ 
                error: 'Failed to start interview',
                details: error.message 
            });
        }
    });
});

// Handle user response and get next question
exports.continueInterview = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { 
                cv, 
                jobDescription, 
                userAnswer, 
                questionCount,
                previousMessages 
            } = req.body;
            
            if (!cv || !jobDescription || !userAnswer) {
                return res.status(400).json({ 
                    error: 'CV, job description, and user answer are required' 
                });
            }

            const response = await interviewChatService.handleUserResponse(
                cv,
                jobDescription,
                userAnswer,
                questionCount,
                previousMessages
            );
            
            res.json(response);
        } catch (error) {
            console.error('Error continuing interview:', error);
            res.status(500).json({ 
                error: 'Failed to process response',
                details: error.message 
            });
        }
    });
});
