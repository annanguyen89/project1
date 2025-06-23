const functions = require("firebase-functions");
const { handleUpload } = require("./uploadHandler");
const SpeechToText = require("./speechToText");
const config = require('./config');
const { USE_EMBEDDINGS } = config;
const embeddingService = require('./services/embedding-service');
const interviewService = require('./services/interview-service');
config.logConfig();
const cors = require('cors')({ origin: true });

exports.health = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        const configStatus = config.getConfigStatus();
        const interviewServiceStatus = interviewService.getServiceStatus();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            configuration: configStatus,
            services: {
                interview: interviewServiceStatus,
                embedding: {
                    enabled: USE_EMBEDDINGS
                }
            }
        });
    });
});

exports.uploadDocument = functions.https.onRequest(handleUpload);

exports.interviewChat = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (!req.is('application/json')) {
        return res.status(400).json({ 
          message: "Content-Type must be application/json",
          received: req.get('content-type')
        });
      }

      const { currentQuestionIndex, userAnswer, chatHistory } = req.body;
      const interviewData = req.body.interviewData || {};
      const { cv, jobDescription, interviewType = 'technical' } = interviewData;

      let response;
      if (currentQuestionIndex === 0) {
        const questionResult = await interviewService.generateQuestionWithEmbeddings(
          cv, 
          jobDescription, 
          [], 
          interviewType
        );
        response = {
          message: questionResult.question,
          isComplete: false,
          questionCount: 1,
          metadata: questionResult.metadata
        };
      } else {
        const conversationHistory = [];
        
        for (let i = 0; i < chatHistory.length; i += 2) {
          const questionItem = chatHistory[i];
          const answerItem = chatHistory[i + 1];
          
          if (questionItem && questionItem.role === 'assistant') {
            conversationHistory.push({
              question: questionItem.content || '',
              answer: answerItem ? answerItem.content || '' : ''
            });
          }
        }
        
        if (conversationHistory.length > 0 && userAnswer) {
          conversationHistory[conversationHistory.length - 1].answer = userAnswer;
        } else if (chatHistory.length > 0 && userAnswer) {
          const lastAiMessage = chatHistory.slice().reverse().find(msg => msg.role === 'assistant');
          conversationHistory.push({
            question: lastAiMessage ? lastAiMessage.content : '',
            answer: userAnswer
          });
        }
        
        const questionsAnswered = Math.floor((chatHistory.length + (userAnswer ? 1 : 0)) / 2);

        
        if (questionsAnswered >= config.MAX_QUESTIONS) {
          const feedbackResult = await interviewService.generateFeedbackWithEmbeddings(
            cv,
            jobDescription,
            conversationHistory,
            interviewType
          );
          response = {
            message: feedbackResult.feedback,
            isComplete: true,
            questionCount: questionsAnswered,
            metadata: feedbackResult.metadata
          };
        } else {
          const questionResult = await interviewService.generateQuestionWithEmbeddings(
            cv,
            jobDescription,
            conversationHistory,
            interviewType
          );
          response = {
            message: questionResult.question,
            isComplete: false,
            questionCount: questionsAnswered + 1,
            metadata: questionResult.metadata
          };
        }
      }

      if (response.bedrockResult) {
        res.status(200).json(response);
      } else {
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

exports.transcribe = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { audio } = req.body;
            if (!audio || typeof audio !== 'string') {
                return res.status(400).json({ 
                    error: 'Invalid audio data. Expected base64 string.' 
                });
            }

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

exports.generateQuestions = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { cv, jobDescription, interviewType = 'technical' } = req.body;
            
            if (!cv || !jobDescription) {
                return res.status(400).json({ 
                    error: 'Both CV and job description are required' 
                });
            }

            const questionResult = await interviewService.generateQuestionWithEmbeddings(
                cv, 
                jobDescription, 
                [], 
                interviewType
            );
            const questions = [questionResult.question];
            
            res.json({ questions });
        } catch (error) {
            console.error('Error in generate-questions endpoint:', error);
            res.status(500).json({ 
                error: 'Failed to generate interview questions',
                details: error.message 
            });
        }
    });
});

exports.startInterview = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { cv, jobDescription, interviewType = 'technical' } = req.body;
            
            if (!cv || !jobDescription) {
                return res.status(400).json({ 
                    error: 'Both CV and job description are required' 
                });
            }

            const questionResult = await interviewService.generateQuestionWithEmbeddings(
                cv, 
                jobDescription, 
                [], 
                interviewType
            );
            const response = {
                message: questionResult.question,
                isComplete: false,
                questionCount: 1,
                metadata: questionResult.metadata
            };
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

            const conversationHistory = previousMessages.map(msg => ({
                question: msg.question,
                answer: msg.answer
            }));
            
            conversationHistory.push({
                question: previousMessages[previousMessages.length - 1]?.question || '',
                answer: userAnswer
            });
            
            let response;
            if (questionCount >= config.MAX_QUESTIONS) {
                const feedbackResult = await interviewService.generateFeedbackWithEmbeddings(
                    cv,
                    jobDescription,
                    conversationHistory,
                    'technical' 
                );
                response = {
                    message: feedbackResult.feedback,
                    isComplete: true,
                    questionCount: questionCount,
                    metadata: feedbackResult.metadata
                };
            } else {
                const questionResult = await interviewService.generateQuestionWithEmbeddings(
                    cv,
                    jobDescription,
                    conversationHistory,
                    'technical' 
                );
                response = {
                    message: questionResult.question,
                    isComplete: false,
                    questionCount: questionCount + 1,
                    metadata: questionResult.metadata
                };
            }
            
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

exports.diagnosticBedrock = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { cv, jobDescription } = req.body;
            
            if (!cv || !jobDescription) {
                return res.status(400).json({ 
                    error: 'Both CV and job description are required' 
                });
            }

            const diagnostic = embeddingService.diagnosticDataFlow(cv, jobDescription);
            
            const sampleEmbeddingRequest = {
                modelId: "amazon.titan-embed-text-v1",
                contentType: "application/json",
                accept: "application/json",
                body: {
                    inputText: cv.substring(0, 200) + "..." 
                }
            };
            
            const sampleClaudeRequest = {
                modelId: "anthropic.claude-v2",
                contentType: "application/json", 
                accept: "application/json",
                body: {
                    prompt: "\\n\\nHuman: [Enhanced prompt with CV text, JD text, and similarity scores]\\n\\nAssistant:",
                    max_tokens_to_sample: 300,
                    temperature: 0.7,
                    stop_sequences: ["\\n\\nHuman:"]
                }
            };
            
            res.json({
                message: "Bedrock Data Flow Diagnostic",
                dataFlow: diagnostic,
                sampleRequests: {
                    embedding: sampleEmbeddingRequest,
                    claude: sampleClaudeRequest
                },
                explanation: {
                    step1: "CV and JD text sent as PLAIN TEXT to Titan Embedding model",
                    step2: "Titan returns 1536-dimensional vectors (not sent to Claude)",
                    step3: "Vectors processed locally to calculate similarity score",
                    step4: "Enhanced PLAIN TEXT prompt (with similarity data) sent to Claude v2",
                    step5: "Claude generates interview questions/feedback based on enhanced prompt"
                }
            });
            
        } catch (error) {
            console.error('Diagnostic error:', error);
            res.status(500).json({ 
                error: 'Failed to run diagnostic',
                details: error.message 
            });
        }
    });
});


