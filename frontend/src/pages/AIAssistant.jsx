import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, AlertCircle, Film, X } from 'lucide-react';

const SYSTEM_PROMPT = `You are a specialized Movie AI Assistant. Your only purpose is to provide data, answers, and discussions related to movies, TV shows, directors, actors, and the film industry. 
CRITICAL RULE: If the user asks about anything other than movies or the film industry, you MUST politely decline to answer and remind them of your purpose. Do NOT provide answers to general knowledge, coding, math, or other non-movie related questions.`;

// API key is provided here directly in code.
// Replace "YOUR_GEMINI_API_KEY" with your actual key, or use a .env file with VITE_GEMINI_API_KEY
const API_KEY ="AIzaSyCcDHUXHhsW6uuBLKBLzUKwxBx9FPgUkVc";

import chatBg from '../assets/chat_bg.png';

const AIAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  
  // For the chat instance
  const [chatSession, setChatSession] = useState(null);

  useEffect(() => {
    initializeChat(API_KEY);
    // Add an initial greeting message
    setMessages([{ role: 'model', content: 'Hello! I am your Movie AI Assistant. I can only answer questions about movies, TV shows, and the film industry. What would you like to know?' }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = (key) => {
    if (!key || key === "YOUR_GEMINI_API_KEY") {
      setError("Please put your valid Gemini API key in the AIAssistant.jsx file (API_KEY variable).");
      return;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT
      });
      
      const chat = model.startChat({
        history: [],
      });
      setChatSession(chat);
      setError('');
    } catch (err) {
      setError('Failed to initialize AI. Please check your API key.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    if (!chatSession) {
      setError("Chat is not initialized. Please ensure your API_KEY is correct in the code.");
      return;
    }

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setError('');

    try {
      const result = await chatSession.sendMessage(userMsg);
      const response = await result.response;
      const text = response.text();
      
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (err) {
      console.error(err);
      if (API_KEY === "YOUR_GEMINI_API_KEY") {
        setError('Error: Please provide a valid Gemini API Key in the code (AIAssistant.jsx line 12) or in your .env file.');
      } else {
        setError(`API Error: ${err.message || "Failed to get response"}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-16 right-0 bottom-0 w-full md:w-[450px] z-50 transform transition-transform duration-300 ease-in-out border-l border-white/10 flex flex-col bg-cover bg-center shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.95)), url(${chatBg})` }}
      >
        {/* Chat Header */}
        <div className="border-b border-gray-800 p-4 flex justify-between items-center bg-gray-900/60 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.6)]">
              <Film className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-extrabold text-xl flex items-center tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 drop-shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 mr-2.5 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse"></span>
              AI Assistant
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                }`}
              >
                {/* Simple text formatting for newlines. */}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-none px-5 py-3 flex space-x-2 items-center text-gray-400">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center text-red-500 text-sm mt-4 p-3 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 rounded-b-xl">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about a movie..."
              className="w-full bg-gray-800/80 border border-gray-700/50 rounded-full pl-5 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner backdrop-blur-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-1.5 p-1.5 bg-primary hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
