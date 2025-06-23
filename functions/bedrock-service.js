const { makeBedrockRequest, cleanText } = require('./services/bedrock-client');

// Generate interview questions based on CV and JD
async function generateInterviewQuestions(cv, jobDescription) {
    try {
        const prompt = `As a professional interviewer, generate 10 relevant interview questions based on the following CV and job description:

CV:
${cleanText(cv)}

Job Description:
${cleanText(jobDescription)}

Generate questions that:
1. Are specific to the candidate's experience and the job requirements
2. Test both technical knowledge and problem-solving abilities
3. Allow the candidate to demonstrate their expertise
4. Are open-ended and encourage detailed responses

Format the response as a JSON array of questions.`;

        return await makeBedrockRequest(prompt, 2048, 0.7);
    } catch (error) {
        throw new Error(`Failed to generate questions: ${error.message}`);
    }
}

module.exports = {
    generateInterviewQuestions
}; 