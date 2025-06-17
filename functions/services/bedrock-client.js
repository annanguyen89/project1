const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
require('dotenv').config();

// Initialize Bedrock client with credentials from environment variables
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Helper function to clean and format text
const cleanText = (text) => {
    return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
};

// Generic function to make Bedrock requests
async function makeBedrockRequest(prompt, maxTokens = 2048, temperature = 0.7) {
    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not configured');
        }

        const input = {
            modelId: "anthropic.claude-v2",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: maxTokens,
                temperature: temperature,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await bedrockClient.send(command);
        
        // Parse the response
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        console.log('Raw Bedrock response:', responseBody);
        
        if (responseBody.error) {
            throw new Error(`Bedrock API error: ${responseBody.error.message}`);
        }
        
        // Extract the actual message text
        let messageText = '';
        if (responseBody.completion) {
            messageText = responseBody.completion;
        } else if (responseBody.content && Array.isArray(responseBody.content)) {
            messageText = responseBody.content[0]?.text || '';
        } else if (responseBody.content) {
            messageText = responseBody.content;
        }
        
        return messageText;
    } catch (error) {
        console.error('Error making Bedrock request:', error);
        throw new Error(`Bedrock request failed: ${error.message}`);
    }
}

module.exports = {
    bedrockClient,
    makeBedrockRequest,
    cleanText
}; 