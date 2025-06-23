const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const embeddingService = require('./embedding-service');

class InterviewService {
    constructor() {
        this.client = null;
        this.modelId = "anthropic.claude-v2";
        this.initializeClient();
    }

    initializeClient() {
        try {
            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
                this.client = new BedrockRuntimeClient({
                    region: process.env.AWS_REGION || 'us-east-1',
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                    }
                });
            } else {
            }
        } catch (error) {
            console.error('Failed to initialize interview client:', error.message);
        }
    }

    async generateQuestionWithEmbeddings(cvText, jobDescription, conversationHistory = [], interviewType = 'technical') {

        try {

            
            const embeddings = await embeddingService.generateCVAndJDEmbeddings(cvText, jobDescription);
            
            const vectorPrompt = embeddingService.getOptimizedPrompt(embeddings, interviewType, 'maximum');
            
            const conversationContext = conversationHistory.length > 0 
                ? `\n\nPREVIOUS Q&A:\n${conversationHistory.filter(item => item && typeof item === 'object').map((item, index) => {
                    const question = String(item.question || item.content || 'Question not available');
                    const answer = String(item.answer || item.response || 'Answer not available');
                    return `${index + 1}. Q: ${question}\n   A: ${answer}`;
                  }).join('\n')}`
                : '';

            const fullPrompt = `${vectorPrompt}${conversationContext}

CONTEXT: ${conversationHistory.length === 0 ? 'First question' : `Follow-up #${conversationHistory.length + 1}`}
TASK: Generate 1 specific interview question using vector analysis above.`;

            const input = {
                modelId: this.modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    prompt: `\n\nHuman: ${fullPrompt}\n\nAssistant:`,
                    max_tokens_to_sample: 500,
                    temperature: 0.7,
                    stop_sequences: ["\n\nHuman:"]
                })
            };


            const command = new InvokeModelCommand(input);
            const response = await this.client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const rawResponse = responseBody.completion.trim();
            const question = interviewType.toLowerCase() === 'technical' 
                ? this.extractTechnicalProblemFromResponse(rawResponse)
                : this.extractQuestionFromResponse(rawResponse);


            
            return {
                question,
                metadata: {
                    interviewType,
                    cvJdSimilarity: embeddings.similarity,
                    matchQuality: embeddingService.getMatchQuality(embeddings.similarity),
                    embeddingModel: embeddings.cv.metadata.model,
                    generatedAt: new Date().toISOString(),
                    rawResponse: rawResponse, 
                    tokenOptimization: {
                        originalTextLength: cvText.length + jobDescription.length,
                        optimizedPromptLength: fullPrompt.length,
                        tokensSaved: Math.ceil((cvText.length + jobDescription.length - fullPrompt.length) / 4),
                        optimizationLevel: 'maximum'
                    }
                }
            };

        } catch (error) {
            console.error('Question generation failed:', error);
            throw new Error(`Question generation failed: ${error.message}`);
        }
    }

    async generateFeedbackWithEmbeddings(cvText, jobDescription, conversationHistory, interviewType = 'technical') {

        try {

            
            const embeddings = await embeddingService.generateCVAndJDEmbeddings(cvText, jobDescription);
            
            const conversationSummary = conversationHistory.filter(item => item && typeof item === 'object').map((item, index) => {
                const question = String(item.question || item.content || 'Question not available');
                const answer = String(item.answer || item.response || 'Answer not available');
                const questionPreview = question.length > 100 ? question.substring(0, 100) + '...' : question;
                const answerPreview = answer.length > 150 ? answer.substring(0, 150) + '...' : answer;
                return `${index + 1}. ${questionPreview} → ${answerPreview}`;
            }).join('\n');

            const vectorPrompt = embeddingService.getOptimizedPrompt(embeddings, interviewType, 'balanced');
            
            const feedbackPrompt = `${vectorPrompt}

INTERVIEW SUMMARY:
Questions: ${conversationHistory.length}
${conversationSummary}

TASK: Generate comprehensive interview feedback covering:
1. Vector similarity analysis (${embeddings.similarity})
2. Strengths from responses  
3. Improvement areas
4. Technical assessment
5. Overall recommendation

Format: Structured sections with specific examples.`;

            const input = {
                modelId: this.modelId,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    prompt: `\n\nHuman: ${feedbackPrompt}\n\nAssistant:`,
                    max_tokens_to_sample: 2000,
                    temperature: 0.5,
                    stop_sequences: ["\n\nHuman:"]
                })
            };

            const conversationLength = conversationHistory.filter(item => item && typeof item === 'object').reduce((acc, item) => acc + String(item.question || '').length + String(item.answer || '').length, 0);

            const command = new InvokeModelCommand(input);
            const response = await this.client.send(command);
            
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const feedback = responseBody.completion.trim();


            
            return {
                feedback,
                metadata: {
                    interviewType,
                    questionsAnswered: conversationHistory.length,
                    cvJdSimilarity: embeddings.similarity,
                    matchQuality: embeddingService.getMatchQuality(embeddings.similarity),
                    embeddingModel: embeddings.cv.metadata.model,
                    generatedAt: new Date().toISOString(),
                    duration: this.calculateInterviewDuration(conversationHistory),
                    tokenOptimization: {
                        originalContentLength: cvText.length + jobDescription.length + conversationLength,
                        optimizedPromptLength: feedbackPrompt.length,
                        tokensSaved: Math.ceil((cvText.length + jobDescription.length + conversationLength - feedbackPrompt.length) / 4),
                        optimizationLevel: 'balanced'
                    }
                }
            };

        } catch (error) {
            console.error('Feedback generation failed:', error);
            throw new Error(`Feedback generation failed: ${error.message}`);
        }
    }

    calculateInterviewDuration(conversationHistory) {
        const avgTimePerQuestion = 3; // minutes
        return conversationHistory.length * avgTimePerQuestion;
    }

    async generateQuestion(cvText, jobDescription, conversationHistory = [], interviewType = 'technical') {

        return this.generateQuestionWithEmbeddings(cvText, jobDescription, conversationHistory, interviewType);
    }

    async generateFeedback(cvText, jobDescription, conversationHistory, interviewType = 'technical') {

        return this.generateFeedbackWithEmbeddings(cvText, jobDescription, conversationHistory, interviewType);
    }

    extractTechnicalSkills(cvText) {
        const commonSkills = [
            'JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes',
            'PostgreSQL', 'MongoDB', 'Express.js', 'Vue.js', 'Angular', 'TypeScript',
            'GraphQL', 'REST API', 'Microservices', 'CI/CD', 'Git', 'Linux'
        ];
        
        const foundSkills = commonSkills.filter(skill => 
            cvText.toLowerCase().includes(skill.toLowerCase())
        );
        
        return foundSkills.length > 0 ? foundSkills : ['programming'];
    }

    getServiceStatus() {
        return {
            initialized: !!this.client,
            modelId: this.modelId,
            embeddingServiceAvailable: !!embeddingService,
            timestamp: new Date().toISOString()
        };
    }

    extractTechnicalProblemFromResponse(response) {
        let cleanResponse = response.trim();
        
        const prefixPatterns = [
            /^.*?Here is a LeetCode-style.*?:/i,
            /^.*?Here is a coding problem.*?:/i,
            /^.*?Here is a technical question.*?:/i,
            /^.*?Based on.*?analysis.*?:/i,
        ];
        
        for (const pattern of prefixPatterns) {
            cleanResponse = cleanResponse.replace(pattern, '').trim();
        }
        
        if (cleanResponse.includes('**Problem:') || 
            cleanResponse.includes('Example') || 
            cleanResponse.includes('Input:') || 
            cleanResponse.includes('Output:') ||
            cleanResponse.includes('Constraints:')) {
            return cleanResponse;
        }
        
        const lines = cleanResponse.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            return lines.join('\n');
        }
        
        return cleanResponse;
    }

    extractQuestionFromResponse(response) {
        let cleanResponse = response.trim();
        
        const prefixPatterns = [
            /^.*?Here is.*?question.*?:/i,
            /^.*?Based on.*?analysis.*?:/i,
            /^.*?I would ask.*?:/i,
            /^.*?Sample question.*?:/i,
            /^.*?QUESTION:\s*/i,
            /^.*?Question:\s*/i,
            /^.*?Q:\s*/i
        ];
        
        for (const pattern of prefixPatterns) {
            cleanResponse = cleanResponse.replace(pattern, '').trim();
        }
        
        const lines = cleanResponse.split('\n').filter(line => line.trim());
        if (lines.length === 0) return cleanResponse;
        
        let questionText = '';
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.toLowerCase().includes('the idea is') ||
                trimmedLine.toLowerCase().includes('this question') ||
                trimmedLine.toLowerCase().includes('let me know') ||
                trimmedLine.toLowerCase().includes('the goal') ||
                trimmedLine.toLowerCase().includes('i\'m interested')) {
                continue;
            }
            
            if (trimmedLine.startsWith('The ') && !trimmedLine.endsWith('?')) {
                continue;
            }
            
            if (trimmedLine.length > 20) {
                questionText = trimmedLine;
                break;
            }
        }
        
        if (!questionText) {
            questionText = lines.find(line => line.trim().length > 20)?.trim() || cleanResponse;
        }
        
        questionText = questionText.replace(/^["']|["']$/g, '').trim();
        
        if (!questionText.endsWith('?') && !questionText.endsWith('.')) {
            if (questionText.toLowerCase().includes('how') || 
                questionText.toLowerCase().includes('what') || 
                questionText.toLowerCase().includes('why') ||
                questionText.toLowerCase().includes('when') ||
                questionText.toLowerCase().includes('where') ||
                questionText.toLowerCase().includes('can you') ||
                questionText.toLowerCase().includes('could you') ||
                questionText.toLowerCase().includes('would you') ||
                questionText.toLowerCase().includes('tell me') ||
                questionText.toLowerCase().includes('describe') ||
                questionText.toLowerCase().includes('explain')) {
                questionText += '?';
            } else {
                questionText += '.';
            }
        }
        
        return questionText;
    }
}

module.exports = new InterviewService(); 