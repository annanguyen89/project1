const config = {
    USE_EMBEDDINGS: process.env.USE_EMBEDDINGS !== 'false', 
    MAX_QUESTIONS: parseInt(process.env.MAX_QUESTIONS) || 2,
    FOLLOW_UP_PROBABILITY: parseFloat(process.env.FOLLOW_UP_PROBABILITY) || 0.3,
    
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_BEDROCK_MODEL: process.env.AWS_BEDROCK_MODEL || 'anthropic.claude-v2',
    AWS_EMBEDDING_MODEL: process.env.AWS_EMBEDDING_MODEL || 'amazon.titan-embed-text-v2:0',
    
    EMBEDDING_DIMENSIONS: parseInt(process.env.EMBEDDING_DIMENSIONS) || 1536,
    SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.5,
    MAX_EMBEDDING_TOKENS: parseInt(process.env.MAX_EMBEDDING_TOKENS) || 8192,
    
    CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'ai-interview-helper-e3b5b.firebasestorage.app',
    
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

const validateConfig = () => {
    const errors = [];
    
    if (config.MAX_QUESTIONS < 1 || config.MAX_QUESTIONS > 50) {
        errors.push('MAX_QUESTIONS must be between 1 and 50');
    }
    
    if (config.FOLLOW_UP_PROBABILITY < 0 || config.FOLLOW_UP_PROBABILITY > 1) {
        errors.push('FOLLOW_UP_PROBABILITY must be between 0 and 1');
    }
    
    if (config.SIMILARITY_THRESHOLD < 0 || config.SIMILARITY_THRESHOLD > 1) {
        errors.push('SIMILARITY_THRESHOLD must be between 0 and 1');
    }
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        errors.push('AWS credentials are required for production deployment');
    }
    
    return errors;
};

const getConfigStatus = () => {
    const validationErrors = validateConfig();
    
    return {
        embeddings: {
            enabled: config.USE_EMBEDDINGS,
            model: config.AWS_EMBEDDING_MODEL,
            dimensions: config.EMBEDDING_DIMENSIONS,
            similarityThreshold: config.SIMILARITY_THRESHOLD
        },
        interview: {
            maxQuestions: config.MAX_QUESTIONS,
            followUpProbability: config.FOLLOW_UP_PROBABILITY,
            bedrockModel: config.AWS_BEDROCK_MODEL
        },
        aws: {
            region: config.AWS_REGION,
            credentialsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        },
        firebase: {
            storageBucket: config.FIREBASE_STORAGE_BUCKET
        },
        validation: {
            valid: validationErrors.length === 0,
            errors: validationErrors
        },
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString()
    };
};

const logConfig = () => {
    return;
};

if (process.env.NODE_ENV === 'production') {
    config.LOG_LEVEL = 'warn';
}

module.exports = {
    ...config,
    validateConfig,
    getConfigStatus,
    logConfig
}; 