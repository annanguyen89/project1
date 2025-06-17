import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, CircularProgress, Button } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import './ChatInterface.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractMessageContent = (content) => {
    let messageContent = '';
    
    if (Array.isArray(content)) {
      const firstItem = content[0];
      if (typeof firstItem === 'string') {
        messageContent = firstItem;
      } else if (firstItem && typeof firstItem === 'object' && 'text' in firstItem) {
        messageContent = firstItem.text;
      }
    } else if (typeof content === 'string') {
      messageContent = content;
    } else if (content && typeof content === 'object' && 'text' in content) {
      messageContent = content.text;
    }
    
    return String(messageContent || '').trim() || 'No response received';
  };

  // Load initial interview data
  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        const interviewData = JSON.parse(localStorage.getItem('interviewData') || '{}');
        if (interviewData.extractedText && messages.length === 0) {
          setIsLoading(true);
          const response = await fetch(`${process.env.REACT_APP_API_URL}/interviewChat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              currentQuestionIndex: 0,
              userAnswer: null,
              chatHistory: [],
              interviewData: {
                cv: interviewData.extractedText,
                jobDescription: interviewData.jobDescription
              }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to get initial question');
          }

          const data = await response.json();
          if (data.bedrockResult?.content) {
            const messageContent = extractMessageContent(data.bedrockResult.content);
            setMessages([{ type: 'ai', content: messageContent }]);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading interview data:', error);
        setError('Failed to load interview data');
        setIsLoading(false);
      }
    };
    loadInterviewData();
  }, []);

  const getNextQuestion = async (userAnswer = null) => {
    setIsLoading(true);
    try {
      const interviewData = JSON.parse(localStorage.getItem('interviewData') || '{}');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/interviewChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          currentQuestionIndex: messages.length / 2,
          userAnswer,
          chatHistory: messages.map(msg => ({
            role: msg.type === 'ai' ? 'assistant' : 'user',
            content: msg.content
          })),
          interviewData: {
            cv: interviewData.extractedText,
            jobDescription: interviewData.jobDescription
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get next question');
      }

      const data = await response.json();
      if (data.bedrockResult) {
        const messageContent = extractMessageContent(data.bedrockResult.content);
        setMessages(prev => [...prev, { type: 'ai', content: messageContent }]);

        if (data.bedrockResult.isComplete) {
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      setError('Failed to get next question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading || isComplete) return;

    const userMessage = currentMessage.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setCurrentMessage('');
    await getNextQuestion(userMessage);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(8192, 1, 1);
      
      mediaRecorderRef.current = {
        stream,
        audioContext,
        source,
        processor,
        audioBuffer: [],
        lastTranscriptionTime: 0
      };
      
      audioChunksRef.current = [];

      processor.onaudioprocess = async (e) => {
        if (!mediaRecorderRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        if (!mediaRecorderRef.current?.audioBuffer) return;
        
        mediaRecorderRef.current.audioBuffer.push(pcmData);
        
        const now = Date.now();
        if (now - mediaRecorderRef.current.lastTranscriptionTime > 1000) {
          const totalLength = mediaRecorderRef.current.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
          const MAX_BUFFER_SIZE = 16384;
          
          if (totalLength > 0) {
            const combinedBuffer = new Int16Array(Math.min(totalLength, MAX_BUFFER_SIZE));
            let offset = 0;
            
            const chunks = totalLength > MAX_BUFFER_SIZE 
              ? mediaRecorderRef.current.audioBuffer.slice(-Math.ceil(MAX_BUFFER_SIZE / 8192))
              : mediaRecorderRef.current.audioBuffer;

            for (const chunk of chunks) {
              if (offset + chunk.length <= MAX_BUFFER_SIZE) {
                combinedBuffer.set(chunk, offset);
                offset += chunk.length;
              }
            }
            
            if (combinedBuffer.some(sample => Math.abs(sample) > 1000)) {
              await sendAudioForTranscription(combinedBuffer.buffer);
            }
          }
          
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.lastTranscriptionTime = now;
            mediaRecorderRef.current.audioBuffer = [];
          }
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsRecording(true);
      setError('');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      const { stream, audioContext, source, processor, audioBuffer } = mediaRecorderRef.current;
      
      if (audioBuffer?.length > 0) {
        const totalLength = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedBuffer = new Int16Array(totalLength);
        let offset = 0;
        
        for (const chunk of audioBuffer) {
          combinedBuffer.set(chunk, offset);
          offset += chunk.length;
        }
        
        if (combinedBuffer.some(sample => Math.abs(sample) > 1000)) {
          sendAudioForTranscription(combinedBuffer.buffer);
        }
      }
      
      source.disconnect();
      processor.disconnect();
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  const sendAudioForTranscription = async (audioBuffer) => {
    try {
      const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(audioBuffer)));
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      if (data.transcription?.trim()) {
        setCurrentMessage(prev => {
          const newText = prev + (prev ? ' ' : '') + data.transcription.trim();
          return newText;
        });
      }
    } catch (error) {
      console.error('Error sending audio for transcription:', error);
      setError('Failed to transcribe audio');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 800, mx: 'auto', my: 4, fontFamily: 'SairaCondensed' }}>
      <Typography variant="h5" gutterBottom sx={{ fontFamily: 'Saira', fontWeight: 'bold' }}>
        Interview Section {isComplete ? '(Complete)' : `(Question ${Math.floor(messages.length / 2) + 1})`}
      </Typography>

      {/* Chat Messages */}
      <Box sx={{ 
        height: '400px', 
        overflowY: 'auto', 
        mb: 2, 
        p: 2,
        backgroundColor: '#f5f5f5',
        fontFamily: 'Saira'
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: message.type === 'ai' ? '#fff' : '#000000',
              color: message.type === 'ai' ? 'text.primary' : '#fff',
              borderRadius: 2,
              maxWidth: '80%',
              ml: message.type === 'ai' ? 0 : 'auto',
              mr: message.type === 'ai' ? 'auto' : 0,
              fontFamily: 'Saira'
            }}
          >
            <Typography sx={{ fontFamily: 'Saira' }}>
              {typeof message.content === 'object' ? JSON.stringify(message.content) : message.content}
            </Typography>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ textAlign: 'center', my: 2 }}>
            {error}
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={isRecording ? stopRecording : startRecording}
            color={isRecording ? "error" : "primary"}
            disabled={isComplete || isLoading}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            disabled={isLoading || isComplete}
            placeholder={isComplete ? "Interview completed" : "Record or type your answer..."}
            sx={{ fontFamily: 'Saira', '& .MuiInputBase-root': { fontFamily: 'Saira' } }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || isComplete || !currentMessage.trim()}
            sx={{ minWidth: 100 }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ChatInterface; 