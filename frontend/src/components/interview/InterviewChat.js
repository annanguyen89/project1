import React, { useState, useEffect, useRef } from 'react';
import { Button, TextField, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { API_ENDPOINTS } from '../../config/api';

const InterviewChat = ({ cv, jobDescription }) => {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Start the interview when component mounts
    useEffect(() => {
        if (cv && jobDescription) {
            startInterview();
        }
    }, [cv, jobDescription]);

    const startInterview = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(API_ENDPOINTS.START_INTERVIEW, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cv, jobDescription }),
            });

            if (!response.ok) {
                throw new Error('Failed to start interview');
            }

            const data = await response.json();
            setMessages([{ role: 'assistant', content: data.message }]);
            setQuestionCount(data.questionCount);
        } catch (error) {
            console.error('Error starting interview:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage = userInput.trim();
        setUserInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.CONTINUE_INTERVIEW, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cv,
                    jobDescription,
                    userAnswer: userMessage,
                    questionCount,
                    previousMessages: messages,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to continue interview');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            setQuestionCount(data.questionCount);
            setIsComplete(data.isComplete);
        } catch (error) {
            console.error('Error continuing interview:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, there was an error processing your response. Please try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 2, maxWidth: 800, mx: 'auto', my: 4 }}>
            <Typography variant="h5" gutterBottom>
                Technical Interview {isComplete ? '(Complete)' : `(Question ${questionCount}/10)`}
            </Typography>

            {/* Chat Messages */}
            <Box sx={{ 
                height: '400px', 
                overflowY: 'auto', 
                mb: 2, 
                p: 2,
                backgroundColor: '#f5f5f5'
            }}>
                {messages.map((message, index) => (
                    <Box
                        key={index}
                        sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: message.role === 'assistant' ? '#fff' : '#1976d2',
                            color: message.role === 'assistant' ? 'text.primary' : '#fff',
                            borderRadius: 2,
                            maxWidth: '80%',
                            ml: message.role === 'assistant' ? 0 : 'auto',
                            mr: message.role === 'assistant' ? 'auto' : 0,
                        }}
                    >
                        <Typography>{message.content}</Typography>
                    </Box>
                ))}
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}
                <div ref={chatEndRef} />
            </Box>

            {/* Input Form */}
            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isLoading || isComplete}
                        placeholder={isComplete ? "Interview completed" : "Type your answer..."}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading || isComplete || !userInput.trim()}
                        sx={{ minWidth: 100 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : "Send"}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
};

export default InterviewChat; 