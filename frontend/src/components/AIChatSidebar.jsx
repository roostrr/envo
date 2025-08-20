import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Bot, User, RefreshCw } from 'lucide-react';

const AIChatSidebar = ({ isOpen, onClose, selectedProgram = null }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedProgram) {
      // Auto-generate a welcome message for the selected program
      const welcomeMessage = {
        id: Date.now(),
        text: `Hello! I can help you learn more about ${selectedProgram.name}. What would you like to know about this program?`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedProgram]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response based on the message content and selected program
      const aiResponse = generateAIResponse(inputMessage, selectedProgram);
      
      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, but I'm experiencing technical difficulties. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const generateAIResponse = (message, program) => {
    const lowerMessage = message.toLowerCase();
    
    if (!program) {
      return "I'm here to help you with program information. Please select a program to get started!";
    }

    // Program-specific responses
    if (lowerMessage.includes('duration') || lowerMessage.includes('how long')) {
      return `The ${program.name} program typically takes ${program.duration} to complete. This includes all coursework, projects, and any required internships or practical components.`;
    }

    if (lowerMessage.includes('tuition') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
      return `The tuition for the ${program.name} program is ${program.tuition}. This covers your academic fees, but you may also need to budget for additional expenses like books, materials, and living costs.`;
    }

    if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('employment')) {
      return `Graduates of the ${program.name} program typically find careers in ${program.department} related fields. The program is designed to prepare you for industry demands and includes practical training to enhance your employability.`;
    }

    if (lowerMessage.includes('requirement') || lowerMessage.includes('entry') || lowerMessage.includes('admission')) {
      return `For admission to the ${program.name} program, you'll typically need to meet academic requirements and demonstrate relevant skills. The specific requirements may vary, so I'd recommend checking with our admissions team for the most current information.`;
    }

    if (lowerMessage.includes('course') || lowerMessage.includes('curriculum') || lowerMessage.includes('subject')) {
      return `The ${program.name} curriculum covers essential topics in ${program.department}. The program is structured to provide both theoretical knowledge and practical skills through a combination of lectures, workshops, and hands-on projects.`;
    }

    if (lowerMessage.includes('campus') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return `The ${program.name} program is offered at our main campus. We have state-of-the-art facilities and dedicated spaces for ${program.department} students to enhance their learning experience.`;
    }

    if (lowerMessage.includes('scholarship') || lowerMessage.includes('financial aid') || lowerMessage.includes('funding')) {
      return `We offer various scholarships and financial aid options for eligible students. The availability and criteria may vary, so I'd recommend contacting our financial aid office for personalized guidance on funding opportunities.`;
    }

    if (lowerMessage.includes('international') || lowerMessage.includes('foreign') || lowerMessage.includes('visa')) {
      return `We welcome international students! The ${program.name} program is open to international applicants. You'll need to meet visa requirements and may need to provide additional documentation. Our international student office can help with the application process.`;
    }

    // Default responses
    const defaultResponses = [
      `That's a great question about the ${program.name} program! I'd be happy to help you with more specific information.`,
      `The ${program.name} program is designed to provide comprehensive training in ${program.department}. Is there a particular aspect you'd like to know more about?`,
      `I can help you learn more about ${program.name}. What specific information are you looking for?`,
      `The ${program.name} program offers excellent opportunities in ${program.department}. Would you like to know about admission requirements, career prospects, or something else?`
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-white shadow-lg border border-gray-200 rounded-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center">
          <Bot className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedProgram ? `AI Assistant - ${selectedProgram.name}` : 'AI Assistant'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Clear chat"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Start a conversation about the program!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the program..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatSidebar; 