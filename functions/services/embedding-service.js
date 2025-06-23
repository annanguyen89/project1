const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

class EmbeddingService {
    constructor() {
        this.client = null;
        this.embeddingModel = "amazon.titan-embed-text-v2:0";
        this.maxTokens = 8192; 
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
            console.error('Failed to initialize embedding client:', error.message);
        }
    }

    preprocessText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ') 
            .trim()
            .substring(0, this.maxTokens * 4);
    }

    async generateEmbedding(text) {
        if (!this.client) {
            return this.generateTextBasedEmbedding(text);
        }

        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty for embedding generation');
        }

        try {
            const cleanText = this.preprocessText(text);
            
            let requestBody;
            if (this.embeddingModel.includes('v2')) {
                requestBody = {
                    inputText: cleanText,
                    dimensions: 1024,  
                    normalize: true    
                };
            } else {
                requestBody = {
                    inputText: cleanText
                };
            }
            
            const input = {
                modelId: this.embeddingModel,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(requestBody)
            };


            
            const command = new InvokeModelCommand(input);
            const response = await this.client.send(command);
            
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            if (responseBody.embedding && Array.isArray(responseBody.embedding)) {
                return {
                    embedding: responseBody.embedding,
                    dimensions: responseBody.embedding.length,
                    model: this.embeddingModel,
                    inputLength: cleanText.length,
                    inputTokenCount: responseBody.inputTextTokenCount || Math.ceil(cleanText.length / 4)
                };
            } else {
                throw new Error('Invalid embedding response format');
            }
            
        } catch (error) {
            console.error('Embedding generation failed, using fallback:', error.message);

            return this.generateTextBasedEmbedding(text);
        }
    }

    generateTextBasedEmbedding(text) {
        const cleanText = this.preprocessText(text);
        const vector = new Array(1536).fill(0);
        const words = cleanText.toLowerCase().split(/\s+/);
        const techTerms = ['javascript', 'react', 'node', 'python', 'aws', 'docker', 'api', 'sql', 'git'];
        
        for (let i = 0; i < Math.min(words.length, 1536); i++) {
            const word = words[i];
            const isTechTerm = techTerms.some(term => word.includes(term));
            vector[i] = isTechTerm ? 0.8 + Math.random() * 0.2 : Math.random() * 0.6;
        }
        
        return {
            embedding: vector,
            dimensions: 1536,
            model: 'text-based-fallback',
            inputLength: cleanText.length,
            fallback: true
        };
    }



    async generateCVAndJDEmbeddings(cvText, jobDescription) {

        
        try {
            const [cvEmbedding, jdEmbedding] = await Promise.all([
                this.generateEmbedding(cvText),
                this.generateEmbedding(jobDescription)
            ]);

            const similarity = this.calculateCosineSimilarity(cvEmbedding.embedding, jdEmbedding.embedding);
            
            let finalSimilarity = similarity;
            if (cvEmbedding.fallback || jdEmbedding.fallback) {
                const textSimilarity = this.calculateTextBasedSimilarity(cvText, jobDescription);
                finalSimilarity = (similarity * 0.7) + (textSimilarity * 0.3);

            }

            return {
                cv: {
                    text: cvText,
                    embedding: cvEmbedding.embedding,
                    metadata: {
                        dimensions: cvEmbedding.dimensions,
                        model: cvEmbedding.model,
                        inputLength: cvEmbedding.inputLength,
                        type: 'cv',
                        fallback: cvEmbedding.fallback || false
                    }
                },
                jobDescription: {
                    text: jobDescription,
                    embedding: jdEmbedding.embedding,
                    metadata: {
                        dimensions: jdEmbedding.dimensions,
                        model: jdEmbedding.model,
                        inputLength: jdEmbedding.inputLength,
                        type: 'job_description',
                        fallback: jdEmbedding.fallback || false
                    }
                },
                similarity: finalSimilarity
            };
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }

    calculateCosineSimilarity(vectorA, vectorB) {
        if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
            return 0;
        }

        try {
            let dotProduct = 0;
            let normA = 0;
            let normB = 0;

            for (let i = 0; i < vectorA.length; i++) {
                dotProduct += vectorA[i] * vectorB[i];
                normA += vectorA[i] * vectorA[i];
                normB += vectorB[i] * vectorB[i];
            }

            const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            return Math.round(similarity * 10000) / 10000; 
        } catch (error) {
            console.error('Similarity calculation failed:', error);
            return 0;
        }
    }

    calculateTextBasedSimilarity(cvText, jobDescription) {
        const cvTerms = this.extractKeyTerms(cvText);
        const jdTerms = this.extractKeyTerms(jobDescription);
        
        if (cvTerms.length === 0 || jdTerms.length === 0) {
            return 0.1;
        }
        
        const matchingTerms = this.findMatchingTerms(cvTerms, jdTerms);
        const jaccardSimilarity = matchingTerms.length / (cvTerms.length + jdTerms.length - matchingTerms.length);
        
        return Math.min(0.9, jaccardSimilarity * 1.5 + 0.1);
    }

    createEmbeddingEnhancedPrompt(embeddings, interviewType = 'technical') {
        const { cv, jobDescription, similarity } = embeddings;
        const isFallback = cv.metadata.fallback || jobDescription.metadata.fallback;
        
        if (isFallback) {
            return this.createTextBasedOptimizedPrompt(cv.text, jobDescription.text, similarity, interviewType);
        }
        
        if (interviewType.toLowerCase() === 'technical') {
            return `You are conducting a technical interview. 

Based on the candidate's background and the job requirements, generate a LeetCode-style coding problem that:
- Tests relevant programming concepts for this role
- Matches the candidate's experience level (similarity score: ${similarity.toFixed(2)})
- Includes a clear problem statement
- Provides 2-3 examples with inputs and outputs
- Lists constraints
- Allows discussion of different approaches and time complexity

Create an original coding problem now.`;
        } else {
            return `You are conducting a ${interviewType} interview.`;
        }
    }

    createCompactVectorPrompt(embeddings, interviewType = 'technical') {
        const { cv, jobDescription, similarity } = embeddings;
        const cvTerms = this.extractKeyTerms(cv.text);
        const jdTerms = this.extractKeyTerms(jobDescription.text);
        const matchingSkills = this.findMatchingTerms(cvTerms, jdTerms);
        
        let prompt = `You are conducting a ${interviewType} interview.

CANDIDATE SKILLS: ${cvTerms.slice(0, 6).join(', ')}
JOB REQUIREMENTS: ${jdTerms.slice(0, 6).join(', ')}
SKILL MATCH: ${matchingSkills.slice(0, 4).join(', ')}`;

        if (interviewType.toLowerCase() === 'technical') {
            if (similarity > 0.6) {
                prompt += `

Generate a LeetCode-style coding problem that tests ${matchingSkills.slice(0, 2).join(' and ')} skills specifically. The problem should:
- Be tailored to their ${matchingSkills.slice(0, 2).join(' and ')} background
- Include a clear problem statement
- Provide 2-3 examples with inputs and outputs
- List any constraints
- Test algorithms/data structures relevant to the job requirements
- Be solvable in multiple ways to assess problem-solving approach`;
            } else {
                prompt += `

Generate a LeetCode-style coding problem that bridges the skill gap between candidate and job requirements. The problem should:
- Test fundamental programming concepts needed for this role
- Include a clear problem statement
- Provide 2-3 examples with inputs and outputs
- List any constraints
- Focus on areas where the candidate can demonstrate learning ability
- Allow discussion of different approaches and time complexity`;
            }
        } else if (interviewType.toLowerCase() === 'behavioral') {
            prompt += `

Tell me about a challenging project you've worked on recently.`;
        } else {
            prompt += `

What interests you most about this ${interviewType} role?`;
        }

        return prompt;
    }

    createTextBasedOptimizedPrompt(cvText, jobDescription, similarity, interviewType) {
        const cvKeyTerms = this.extractKeyTerms(cvText);
        const jdKeyTerms = this.extractKeyTerms(jobDescription);
        const matchingSkills = this.findMatchingTerms(cvKeyTerms, jdKeyTerms);
        const gapSkills = this.findGapTerms(cvKeyTerms, jdKeyTerms);

        let prompt = `You are conducting a ${interviewType} interview.

CANDIDATE BACKGROUND: ${cvKeyTerms.slice(0, 6).join(', ')}
JOB REQUIREMENTS: ${jdKeyTerms.slice(0, 6).join(', ')}
SKILLS OVERLAP: ${matchingSkills.slice(0, 4).join(', ')}
SKILL GAPS: ${gapSkills.slice(0, 3).join(', ')}`;

        if (interviewType.toLowerCase() === 'technical') {
            if (similarity > 0.6) {
                prompt += `

Create a LeetCode-style coding problem that leverages the candidate's ${matchingSkills.slice(0, 2).join(' and ')} experience. Requirements:
- Tailor the problem to their ${matchingSkills.slice(0, 2).join(' and ')} expertise
- Include problem statement, 2-3 examples, and constraints
- Test algorithms/data structures relevant to this job role
- Design problem difficulty to match their experience level
- Allow for multiple solution approaches to assess problem-solving depth`;
            } else {
                prompt += `

Generate a LeetCode-style coding problem that addresses the skill gaps: ${gapSkills.slice(0, 2).join(', ')}. Requirements:
- Clear problem statement with examples and constraints
- Focus on fundamental concepts needed for this role
- Difficulty appropriate for bridging skill gaps
- Test areas where candidate can demonstrate adaptability
- Include complexity discussion to assess analytical thinking`;
            }
        } else {
            prompt += `

What draws you to this ${interviewType} role?`;
        }

        return prompt;
    }

    extractKeyTerms(text) {
        const words = text.toLowerCase().match(/\w+/g) || [];
        const techTerms = ['javascript', 'react', 'node', 'python', 'aws', 'docker', 'api', 'sql', 'git', 'html', 'css', 'angular', 'vue', 'express', 'mongodb', 'postgresql', 'kubernetes', 'ci/cd', 'devops', 'agile', 'scrum', 'java', 'c++', 'golang', 'rust', 'typescript', 'redux', 'graphql', 'rest', 'microservices', 'redis', 'elasticsearch', 'terraform', 'jenkins', 'algorithms', 'datastructures'];
        
        const foundTerms = [];
        const textLower = text.toLowerCase();
        
        techTerms.forEach(term => {
            if (textLower.includes(term)) {
                foundTerms.push(term);
            }
        });
        
        const expMatch = text.match(/(\d+)\s*(years?|yrs?)/i);
        if (expMatch) {
            foundTerms.push(`${expMatch[1]} years experience`);
        }
        
        return [...new Set(foundTerms)]; 
    }

    findMatchingTerms(cvTerms, jdTerms) {
        return cvTerms.filter(term => jdTerms.some(jdTerm => 
            jdTerm.toLowerCase().includes(term.toLowerCase()) || 
            term.toLowerCase().includes(jdTerm.toLowerCase())
        ));
    }

    findGapTerms(cvTerms, jdTerms) {
        return jdTerms.filter(term => !cvTerms.some(cvTerm => 
            cvTerm.toLowerCase().includes(term.toLowerCase()) || 
            term.toLowerCase().includes(cvTerm.toLowerCase())
        ));
    }

    summarizeVector(vector) {
        const positive = vector.filter(v => v > 0).length;
        const negative = vector.filter(v => v < 0).length;
        const maxVal = Math.max(...vector);
        const minVal = Math.min(...vector);
        const avgVal = vector.reduce((a, b) => a + b, 0) / vector.length;
        
        return `Pos:${positive}, Neg:${negative}, Range:[${minVal.toFixed(3)}, ${maxVal.toFixed(3)}], Avg:${avgVal.toFixed(3)}`;
    }

    analyzeVectorOverlap(vector1, vector2) {
        let strongPositive = 0;
        let strongNegative = 0;
        let aligned = 0;
        
        for (let i = 0; i < vector1.length; i++) {
            const product = vector1[i] * vector2[i];
            if (product > 0.1) strongPositive++;
            if (product < -0.1) strongNegative++;
            if (Math.abs(vector1[i] - vector2[i]) < 0.1) aligned++;
        }
        
        return `Strong+:${strongPositive}, Strong-:${strongNegative}, Aligned:${aligned}`;
    }

    getMatchQuality(similarity) {
        if (similarity >= 0.8) return "Excellent match - Strong alignment between CV and job requirements";
        if (similarity >= 0.6) return "Good match - Solid alignment with some gaps to explore";
        if (similarity >= 0.4) return "Moderate match - Some alignment but significant gaps to discuss";
        if (similarity >= 0.2) return "Low match - Limited alignment, focus on transferable skills";
        return "Poor match - Significant misalignment, explore adaptability and learning ability";
    }

    getOptimizedPrompt(embeddings, interviewType = 'technical', optimizationLevel = 'standard') {
        switch(optimizationLevel) {
            case 'maximum': 
                return this.createCompactVectorPrompt(embeddings, interviewType, false);
            case 'balanced':
                return this.createCompactVectorPrompt(embeddings, interviewType, true);
            case 'standard':
            default:
                return this.createEmbeddingEnhancedPrompt(embeddings, interviewType);
        }
    }
}

module.exports = new EmbeddingService(); 