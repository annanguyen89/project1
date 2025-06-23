const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

try {
    require('dotenv').config();
} catch (error) {
}

let bedrockClient = null;
try {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        bedrockClient = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
    } else {
    }
} catch (error) {
}

const cleanText = (text) => {
    return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
};

async function makeBedrockRequest(prompt, maxTokens = 2048, temperature = 0.7) {
    try {
        if (!bedrockClient) {
            throw new Error('Bedrock client not initialized - AWS credentials not configured');
        }

        const input = {
            modelId: "anthropic.claude-v2",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
                max_tokens_to_sample: maxTokens,
                temperature: temperature,
                stop_sequences: ["\n\nHuman:"]
            })
        };

        const command = new InvokeModelCommand(input);
        const response = await bedrockClient.send(command);
        
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        
        if (responseBody.error) {
            throw new Error(`Bedrock API error: ${responseBody.error.message}`);
        }
        
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