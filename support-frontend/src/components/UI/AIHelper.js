import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AIHelper = ({ ticket, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      content: `Hello! I'm your AI assistant. I see you have a ${ticket.priority} priority ${ticket.category} issue: "${ticket.subject}". I'm here to help while we find an available engineer. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/ai/message', {
        message: userMessage.content,
        ticketId: ticket._id,
        enableWebSearch: enableWebSearch
      });

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: response.data.response,
        timestamp: new Date(),
        webSearchUsed: response.data.webSearchUsed,
        sources: response.data.sources || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.status === 429) {
        errorMessage = 'You\'ve reached the rate limit. Please wait a moment before sending another message.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You don\'t have permission to access this ticket.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setError(errorMessage);
      
      const errorAiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: errorMessage,
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  const renderSources = (sources) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-1 mb-2">
          <LinkIcon className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium text-gray-600">Web Sources:</span>
        </div>
        <div className="space-y-1">
          {sources.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
              title={source.title}
            >
              {index + 1}. {source.title}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-[600px] w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600">Available 24/7 while you wait for an engineer</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="sr-only">Close AI Helper</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* No Engineer Warning */}
      <div className="p-3 bg-yellow-50 border-b border-yellow-100">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            No engineer assigned yet. Our AI can help with immediate assistance.
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl lg:max-w-3xl px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && !message.isError && (
                  <div className="flex flex-col items-center mt-0.5">
                    <SparklesIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    {message.webSearchUsed && (
                      <GlobeAltIcon className="h-3 w-3 text-green-600 mt-1" title="Web search used" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.sources && renderSources(message.sources)}
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-blue-200' 
                      : message.isError 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                    {message.webSearchUsed && (
                      <span className="ml-2 text-green-600">• Web enhanced</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-4 w-4 text-blue-600" />
                {enableWebSearch && (
                  <GlobeAltIcon className="h-4 w-4 text-green-600" />
                )}
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Web Search Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="web-search-toggle" className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  id="web-search-toggle"
                  type="checkbox"
                  checked={enableWebSearch}
                  onChange={(e) => setEnableWebSearch(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  enableWebSearch ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${
                    enableWebSearch ? 'translate-x-5' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <GlobeAltIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Web Search</span>
              </div>
            </label>
          </div>
          <span className="text-xs text-gray-500">
            {enableWebSearch ? 'Enhanced with web results' : 'AI knowledge only'}
          </span>
        </div>

        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask me anything about your issue..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to send. Max 2000 characters.
          {enableWebSearch && ' Web search enabled for current responses.'}
        </p>
      </div>
    </div>
  );
};

export default AIHelper;