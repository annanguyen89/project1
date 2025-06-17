const { makeBedrockRequest, cleanText } = require('./bedrock-client');

class InterviewChatService {
    constructor() {
        this.MAX_QUESTIONS = 10;
    }

    async startInterview(cv, jobDescription) {
        try {
            const systemPrompt = this._createSystemPrompt(cv, jobDescription, 0);
            const userMessage = "Start the interview with a brief introduction and the first question based on the job description. Make the introduction welcoming but concise.";
            
            const response = await makeBedrockRequest(
                `${systemPrompt}\n\nHuman: ${userMessage}`,
                2048,
                0.7
            );

            return {
                bedrockResult: {
                    content: [{ text: response }],
                    isComplete: false,
                    questionCount: 1
                }
            };
        } catch (error) {
            console.error('Error starting interview:', error);
            throw new Error('Failed to start interview');
        }
    }

    async handleUserResponse(cv, jobDescription, userAnswer, questionCount, previousMessages = []) {
        try {
            if (questionCount >= this.MAX_QUESTIONS) {
                return await this._generateFinalSummary(previousMessages);
            }

            const systemPrompt = this._createSystemPrompt(cv, jobDescription, questionCount);
            const context = this._formatPreviousMessages(previousMessages);
            const userMessage = `The candidate's answer to the previous question: "${userAnswer}"\n\nPlease:\n1. Briefly evaluate this answer (1 sentence)\n2. Ask the next interview question (question #${questionCount + 1})`;

            const prompt = `${systemPrompt}\n\n${context}\n\nHuman: ${userMessage}`;
            const response = await makeBedrockRequest(prompt, 2048, 0.7);

            return {
                bedrockResult: {
                    content: [{ text: response }],
                    isComplete: questionCount + 1 >= this.MAX_QUESTIONS,
                    questionCount: questionCount + 1
                }
            };
        } catch (error) {
            console.error('Error processing response:', error);
            throw new Error('Failed to process response');
        }
    }

    async _generateFinalSummary(previousMessages) {
        try {
            const summaryPrompt = `Based on the following interview conversation, provide a comprehensive evaluation of the candidate. Include:\n
1. Key strengths demonstrated
2. Areas for improvement
3. Technical competency assessment
4. Communication skills assessment
5. Overall recommendation for next steps to improve interview skills\n\n
Interview conversation:\n${this._formatPreviousMessages(previousMessages)}`;

            const response = await makeBedrockRequest(summaryPrompt, 2048, 0.7);

            return {
                bedrockResult: {
                    content: [{ text: response }],
                    isComplete: true,
                    questionCount: this.MAX_QUESTIONS,
                    isFinalSummary: true
                }
            };
        } catch (error) {
            console.error('Error generating final summary:', error);
            throw new Error('Failed to generate interview summary');
        }
    }

    _createSystemPrompt(cv, jobDescription, currentQuestionCount) {
        return `You are conducting a technical interview. Here is the context:

CV:
${cleanText(cv)}

Job Description:
${cleanText(jobDescription)}

Your role:
1. You are a professional (technical) interviewer
2. Ask ONE question at a time
3. Questions should assess both technical skills and problem-solving abilities
4. After each candidate response, provide a brief evaluation before asking the next question
5. Keep your responses focused and professional
6. Questions should progressively build on previous answers
7. Mix technical and behavioral questions
8. Maximum number of questions: ${this.MAX_QUESTIONS}

Current interview progress: ${currentQuestionCount}/${this.MAX_QUESTIONS} questions`;
    }

    _formatPreviousMessages(messages) {
        if (!messages || messages.length === 0) return '';
        
        return messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
    }
}

module.exports = new InterviewChatService(); 