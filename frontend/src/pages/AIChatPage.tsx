import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Phone, MessageCircle, User, Bot, RefreshCw, Trash2, FileText, Star } from 'lucide-react';
import StudentForm from '../components/StudentForm';
import ChatFeedbackModal from '../components/ChatFeedbackModal';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  prediction?: {
    prediction: number;
    probability: number;
    primary_probability?: number;
    confidence: string;
  };
  recommended_programs?: any[];
  show_programs?: boolean;
  show_callback_button?: boolean;
}

interface Conversation {
  student_id: string;
  timestamp: string;
  message: string;
  ai_response: string;
  prediction: any;
  callback_requested: boolean;
}

interface StudentFormData {
  name: string;
  email: string;
  gpa: string;
  family_income_level: string;
  academic_interests: string;
  fulltime_study: string;
  international_student: string;
  tuition_budget: string;
  completion_confidence: string;
  preferred_class_size: string;
  financial_aid_eligible: string;
  prefer_private: string;
  first_generation: string;
}

const AIChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentFormData | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showPrograms, setShowPrograms] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a new student ID for each session - start fresh every time
    const newStudentId = Date.now().toString();
    setStudentId(newStudentId);
    localStorage.setItem('studentId', newStudentId);
    
    // Clear any previous messages
    setMessages([]);
    setConversations([]);
  }, []);

  useEffect(() => {
    // Only scroll to bottom if there are no recommendation programs shown
    const hasRecommendations = messages.some(msg => msg.show_programs && msg.recommended_programs);
    const hasSelectionMessage = messages.some(msg => msg.show_callback_button);
    
    if (!hasRecommendations) {
      scrollToBottom();
    } else if (hasRecommendations && !hasSelectionMessage) {
      // Only scroll to top when recommendations are first shown (not when a program is selected)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Also scroll the chat container to top
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startFreshConversation = () => {
    const newStudentId = Date.now().toString();
    setStudentId(newStudentId);
    localStorage.setItem('studentId', newStudentId);
    setMessages([]);
    setConversations([]);
    setShowForm(true);
    setStudentProfile(null);
    setPrediction(null);
  };

  const handleFormSubmit = async (formData: StudentFormData) => {
    setIsLoading(true);
    try {
      // Submit form data to the standardized endpoint
      const response = await axios.post('/api/standardized/collect-data', {
        student_id: studentId,
        form_data: formData
      });

      if (response.data.success) {
        setStudentProfile(formData);
        setPrediction(response.data.prediction);
        setShowForm(false);

        // Add initial AI message with prediction results
        const predictionMessage: Message = {
          id: Date.now().toString(),
          text: `Thank you for providing your information, ${formData.name}! 

I've analyzed your academic profile and found some excellent program matches at Sunway University. Let me show you some recommended programs that would be a perfect fit based on your interests and background.`,
          sender: 'ai',
          timestamp: new Date(),
          prediction: response.data.prediction
        };

        // Add programs message if recommended programs are available
        const programsMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Based on your academic interests and profile, here are some recommended programs that would be a great fit for you:`,
          sender: 'ai',
          timestamp: new Date(),
          recommended_programs: response.data.recommendations || [],
          show_programs: true
        };

        setMessages([predictionMessage, programsMessage]);
        setShowPrograms(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm sorry, but I'm experiencing technical difficulties. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/chat', {
        message: inputMessage,
        student_id: studentId
      });

      if (response.data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.data.response,
          sender: 'ai',
          timestamp: new Date(),
          prediction: response.data.data.prediction
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, but I'm experiencing technical difficulties. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallbackRequest = async (conversationIndex: number) => {
    try {
      // First, record the model feedback
      if (prediction) {
        await axios.post('/api/admin/model-feedback', {
          student_id: studentId,
          prediction: prediction,
          actual_outcome: 'contact_requested'
        });
      }

      // Then handle the callback request
      const response = await axios.post('/api/ai/callback', {
        student_id: studentId,
        conversation_index: conversationIndex,
        callback_requested: true
      });

      if (response.data.success) {
        setShowCallbackModal(false);
        setSelectedConversation(null);
        
        // Show success message
        const successMessage: Message = {
          id: Date.now().toString(),
          text: "Thank you! We've recorded your interest and our team will contact you soon. Your feedback helps us improve our predictions!",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Error requesting callback:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm sorry, there was an issue processing your request. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPredictionColor = (prediction: any) => {
    const probability = prediction?.primary_probability || prediction?.probability || 0;
    if (probability >= 0.6) return 'text-green-600';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPredictionText = (prediction: any) => {
    const probability = prediction?.primary_probability || prediction?.probability || 0;
    if (probability >= 0.6) return 'Likely Admission';
    if (probability >= 0.4) return 'Moderate Chance';
    return 'Unlikely Admission';
  };

  const handleFeedbackSubmit = async (rating: number, review: string) => {
    setSubmittingFeedback(true);
    try {
      const conversationId = `conv_${studentId}_${Date.now()}`;
      const conversationSummary = messages
        .filter(msg => msg.sender === 'user')
        .slice(-3)
        .map(msg => msg.text)
        .join(' | ');

      const response = await axios.post('/api/chat-feedback', {
        student_id: studentId,
        conversation_id: conversationId,
        rating,
        review_text: review,
        conversation_summary: conversationSummary
      });

      if (response.data.success) {
        setFeedbackSubmitted(true);
        setShowFeedbackModal(false);
        
        // Add thank you message
        const thankYouMessage: Message = {
          id: Date.now().toString(),
          text: "Thank you for your feedback! It helps us improve the ENVO Chat Agent. Is there anything else you'd like to know about our programs?",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, thankYouMessage]);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const cleanProgramName = (name: string) => {
    if (!name) return '';
    
    // First, fix common spacing issues (like "MechatronicEngineering" -> "Mechatronic Engineering")
    let fixedName = name
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space between acronyms and words
      .replace(/([a-z])([A-Z][A-Z])/g, '$1 $2') // Add space between words and acronyms
      .replace(/([a-z])([A-Z])([A-Z])/g, '$1 $2$3') // Handle cases like "inComputer" -> "in Computer"
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
    
    // Handle specific cases with colons and repeated phrases
    // Pattern: "Something: Something: Something" -> "Something"
    const colonPattern = /^([^:]+):\s*\1:\s*\1$/;
    if (colonPattern.test(fixedName)) {
      const match = fixedName.match(colonPattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Pattern: "Something Something: Something Something: Something Something" -> "Something Something"
    const colonPattern2 = /^([^:]+):\s*\1:\s*\1$/;
    if (colonPattern2.test(fixedName)) {
      const match = fixedName.match(colonPattern2);
      if (match) {
        return match[1].trim();
      }
    }
    
    // More general colon pattern: if we have multiple colons, take the first part
    const colonParts = fixedName.split(':');
    if (colonParts.length >= 3) {
      // Check if the parts after colons are similar to the first part
      const firstPart = colonParts[0].trim();
      const secondPart = colonParts[1].trim();
      const thirdPart = colonParts[2].trim();
      
      // If second and third parts are similar to first part, return first part
      if (secondPart.includes(firstPart) || firstPart.includes(secondPart)) {
        return firstPart;
      }
      
      // If all parts are very similar (common pattern), return first part
      const similarityThreshold = 0.8;
      const firstWords = firstPart.split(' ').slice(0, 3).join(' ').toLowerCase();
      const secondWords = secondPart.split(' ').slice(0, 3).join(' ').toLowerCase();
      const thirdWords = thirdPart.split(' ').slice(0, 3).join(' ').toLowerCase();
      
      if (firstWords === secondWords && secondWords === thirdWords) {
        return firstPart;
      }
    }
    
    // Handle specific cases where the name is repeated with slight variations
    // Pattern: "Something (variant) Something (variant) Something (variant)"
    const parenthesisPattern = /^([^(]+)\s*\([^)]+\)\s*\1\s*\([^)]+\)\s*\1\s*\([^)]+\)$/;
    if (parenthesisPattern.test(fixedName)) {
      const match = fixedName.match(parenthesisPattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Split into words and remove consecutive duplicates
    const words = fixedName.split(' ').filter((word: string, index: number, arr: string[]) => {
      return index === 0 || word !== arr[index - 1];
    });
    
    // If we have very few words, return as is
    const totalWords = words.length;
    if (totalWords < 6) return words.join(' ');
    
    // Look for the most common pattern: exact repetition of the full program name
    const fullName = words.join(' ');
    
    // Check if the name is repeated exactly (common pattern in the data)
    const nameLength = fullName.length;
    if (nameLength > 20) {
      // Check for triple repetition
      const thirdLength = Math.floor(nameLength / 3);
      const firstThird = fullName.substring(0, thirdLength);
      const secondThird = fullName.substring(thirdLength, thirdLength * 2);
      const lastThird = fullName.substring(thirdLength * 2);
      
      if (firstThird === secondThird && secondThird === lastThird) {
        return firstThird;
      }
      
      // Check for double repetition
      const halfLength = Math.floor(nameLength / 2);
      const firstHalf = fullName.substring(0, halfLength);
      const secondHalf = fullName.substring(halfLength);
      
      if (firstHalf === secondHalf) {
        return firstHalf;
      }
    }
    
    // If no exact repetition found, try word-based pattern detection
    // Check for triple repetition (1/3 pattern)
    if (totalWords % 3 === 0) {
      const thirdLength = totalWords / 3;
      const firstThird = words.slice(0, thirdLength).join(' ');
      const secondThird = words.slice(thirdLength, thirdLength * 2).join(' ');
      const lastThird = words.slice(thirdLength * 2).join(' ');
      
      if (firstThird === secondThird && secondThird === lastThird) {
        return firstThird;
      }
    }
    
    // Check for double repetition (1/2 pattern)
    if (totalWords % 2 === 0) {
      const halfLength = totalWords / 2;
      const firstHalf = words.slice(0, halfLength).join(' ');
      const secondHalf = words.slice(halfLength).join(' ');
      
      if (firstHalf === secondHalf) {
        return firstHalf;
      }
    }
    
    // If no clear pattern, try to find the longest unique sequence
    for (let i = 1; i <= Math.floor(totalWords / 2); i++) {
      const pattern = words.slice(0, i).join(' ');
      const remainingWords = words.slice(i).join(' ');
      
      if (remainingWords.includes(pattern)) {
        // Found a repeating pattern, return the first occurrence
        return pattern;
      }
    }
    
    return words.join(' ');
  };

  const cleanDuration = (duration: string) => {
    if (!duration) return '4 years';
    
    // Handle "See website for details" case
    if (duration.toLowerCase().includes('see website') || duration.toLowerCase().includes('contact')) {
      return 'Contact for details';
    }
    
    // If duration contains multiple values separated by semicolons, take the first one
    const parts = duration.split(';');
    if (parts.length > 1) {
      // Clean up the first part and make it more readable
      let firstPart = parts[0].trim();
      
      // Standardize capitalization
      if (firstPart.toLowerCase().includes('year')) {
        firstPart = firstPart.replace(/year/i, 'Year');
      }
      if (firstPart.toLowerCase().includes('month')) {
        firstPart = firstPart.replace(/month/i, 'Month');
      }
      if (firstPart.toLowerCase().includes('week')) {
        firstPart = firstPart.replace(/week/i, 'Week');
      }
      
      return firstPart;
    }
    
    return duration.trim();
  };

  const cleanTuition = (tuition: any) => {
    if (!tuition) return 'Contact for details';
    
    // If tuition is a number, format it as currency
    if (typeof tuition === 'number') {
      return `RM${tuition.toLocaleString()}`;
    }
    
    // If tuition is a string
    if (typeof tuition === 'string') {
      // If it contains "See website for details" or similar, return a generic message
      if (tuition.toLowerCase().includes('see website') || tuition.toLowerCase().includes('contact')) {
        return 'Contact for details';
      }
      
      // If it contains multiple values separated by semicolons, take the first one
      const parts = tuition.split(';');
      if (parts.length > 1) {
        return parts[0].trim();
      }
      
      // If it contains currency symbols, return as is
      if (tuition.includes('RM') || tuition.includes('USD') || tuition.includes('$')) {
        return tuition.trim();
      }
      
      // Try to extract numeric value and format as RM
      const match = tuition.match(/[\d,]+/);
      if (match) {
        const value = parseInt(match[0].replace(/,/g, ''));
        return `RM${value.toLocaleString()}`;
      }
    }
    
    return 'Contact for details';
  };

  const cleanProgramDescription = (description: string) => {
    if (!description) return 'This program offers comprehensive education and practical experience in the field.';
    
    // Remove all the irrelevant content at the beginning
    let cleaned = description
      // Remove application-related content
      .replace(/^Apply Now.*?Image\s*/gi, '')
      .replace(/^An application form.*?Image\s*/gi, '')
      .replace(/^.*?Apply Online.*?Image\s*/gi, '')
      .replace(/^.*?Micro-credential Courses.*?Image\s*/gi, '')
      
      // Remove promotional content
      .replace(/^.*?A Fulfilling Career Journey.*?\.\s*/gi, '')
      .replace(/^.*?Image Scholarships.*?Image\s*/gi, '')
      .replace(/^.*?Innovation and Entrepreneurship.*?Image\s*/gi, '')
      .replace(/^.*?Sunway R&D.*?Image\s*/gi, '')
      
      // Remove contact information
      .replace(/^.*?If you'd like to know more.*?\.\s*/gi, '')
      .replace(/^.*?Submit an enquiry.*?\.\s*/gi, '')
      .replace(/^.*?Call one of our course specialists.*?\.\s*/gi, '')
      .replace(/^.*?Call \+\d+.*?\.\s*/gi, '')
      
      // Remove university address and legal info
      .replace(/^.*?Sunway University.*?Malaysia\s*/gi, '')
      .replace(/^.*?©\d{4}.*?\)\s*/gi, '')
      .replace(/^.*?Privacy Notice.*?\)\s*/gi, '')
      .replace(/^.*?Personal Data Request Form.*?\)\s*/gi, '')
      .replace(/^.*?Member of Sunway Education.*?\)\s*/gi, '')
      
      // Remove student type sections
      .replace(/^.*?For Local Students.*?For International Students\s*/gi, '')
      .replace(/^.*?For International Students.*?Sunway Intensive English Programme\s*/gi, '')
      .replace(/^.*?IELTS.*?English\s*/gi, '')
      
      // Remove specific course requirements
      .replace(/^.*?SPM.*?English\s*/gi, '')
      .replace(/^.*?UEC.*?English\s*/gi, '')
      .replace(/^.*?O-Level.*?English\s*/gi, '')
      .replace(/^.*?Sunway Intensive English Programme.*?English\s*/gi, '')
      
      // Remove additional requirements
      .replace(/^.*?Additional requirements.*?programmes\.\s*/gi, '')
      .replace(/^.*?For Malaysian students.*?programmes\.\s*/gi, '')
      
      .trim();
    
    // If we still have irrelevant content at the start, try to find the first meaningful sentence
    if (cleaned.startsWith('n ') || cleaned.startsWith('from ') || cleaned.startsWith('2 from ')) {
      // Find the first sentence that starts with a capital letter and contains meaningful content
      const sentences = cleaned.split('.');
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && 
            /^[A-Z]/.test(trimmed) && 
            !trimmed.includes('SPM') && 
            !trimmed.includes('UEC') && 
            !trimmed.includes('IELTS') &&
            !trimmed.includes('O-Level') &&
            !trimmed.includes('Sunway Intensive English')) {
          return trimmed + '.';
        }
      }
    }
    
    // If the cleaned description is too short or still contains irrelevant content
    if (cleaned.length < 50 || cleaned.startsWith('n ') || cleaned.startsWith('from ')) {
      return 'This program offers comprehensive education and practical experience in the field.';
    }
    
    // Take the first meaningful sentence or first 150 characters
    const firstSentence = cleaned.split('.')[0];
    if (firstSentence.length > 20 && firstSentence.length < 200) {
      return firstSentence + '.';
    }
    
    return cleaned.substring(0, 150) + (cleaned.length > 150 ? '...' : '');
  };

  const handleProgramSelection = (program: any) => {
    setSelectedProgram(program);
    
    // Clean program name by removing duplicates
    const cleanName = cleanProgramName(program.name);
    
    // Format tuition properly
    const formattedTuition = typeof program.tuition === 'number' 
      ? program.tuition.toLocaleString() 
      : program.tuition || 'TBD';
    
    // Add a message showing the selected program
    const selectionMessage: Message = {
      id: Date.now().toString(),
      text: `Excellent choice! You've selected the ${cleanName} at Sunway University. This program is offered by the ${program.department} and has a tuition of RM${formattedTuition}. Would you like to learn more about this program or request a callback to discuss your options?`,
      sender: 'ai',
      timestamp: new Date(),
      show_callback_button: true // Add flag to identify this specific message
    };
    
    setMessages(prev => [...prev, selectionMessage]);
    setShowPrograms(false);
    
    // Scroll to bottom to show the new message and callback option
    setTimeout(() => {
      // Only scroll the chat container to the bottom
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleProgramCallback = async () => {
    if (!selectedProgram) return;
    
    try {
      // Record the model feedback
      if (prediction) {
        await axios.post('/api/admin/model-feedback', {
          student_id: studentId,
          prediction: prediction,
          actual_outcome: 'contact_requested'
        });
      }

      // Add callback confirmation message
      const callbackMessage: Message = {
        id: Date.now().toString(),
        text: `Perfect! I've recorded your interest in the ${cleanProgramName(selectedProgram.name)} program. Our admissions team will contact you within 24 hours to discuss your application, financial aid options, and next steps. Thank you for your interest!`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, callbackMessage]);
      setSelectedProgram(null);
      
    } catch (error) {
      console.error('Error requesting callback:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm sorry, there was an issue processing your request. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <MessageCircle className="h-8 w-8 mr-3 text-neon-pink" />
                {showForm ? 'Get Personalized Recommendations' : 'AI Chat Assistant'}
              </h1>
              <p className="text-gray-300 mt-2">
                {showForm 
                  ? 'Fill out your profile to get personalized program recommendations from Sunway University'
                  : 'Chat with our AI assistant about programs, financial aid, and application requirements'
                }
              </p>
            </div>
            <div className="flex space-x-2">
              {!showForm && (
                <button
                  onClick={startFreshConversation}
                  className="bg-dark-700 text-white px-3 py-2 rounded-lg hover:bg-dark-600 flex items-center space-x-2"
                  title="Start a new conversation"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Form (shown initially) */}
        {showForm && (
          <div className="mb-8">
            <StudentForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        )}

        {/* Chat Container (only shown after form submission) */}
        {!showForm && (
          <div className="bg-dark-900 rounded-lg shadow-lg overflow-hidden border border-dark-700">
            {/* Messages */}
            <div ref={chatContainerRef} className="h-[600px] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <p>Start a conversation with our AI assistant!</p>
                  <p className="text-sm mt-2">Ask about programs, financial aid, or application requirements.</p>
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
                          ? 'bg-neon-pink text-white'
                          : 'bg-dark-800 text-white'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.sender === 'ai' && (
                          <Bot className="h-4 w-4 mt-1 text-neon-pink flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          
                          {/* Program Selection Interface */}
                          {message.show_programs && message.recommended_programs && (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm font-medium text-white mb-3">Here are your personalized program recommendations:</p>
                              <div className="grid grid-cols-1 gap-4">
                                {message.recommended_programs.map((program: any, index: number) => (
                                  <button
                                    key={`${program.program_id}-${index}`}
                                    onClick={() => handleProgramSelection(program)}
                                    className="text-left p-4 border-2 border-dark-600 rounded-lg hover:border-neon-pink hover:bg-dark-800 transition-all duration-200 shadow-sm hover:shadow-md w-full program-card-container"
                                  >
                                    <div className="space-y-3">
                                      {/* Program Header */}
                                      <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0 overflow-hidden">
                                          <h4 className="text-lg font-semibold text-white mb-1 program-card-text">{cleanProgramName(program.name)}</h4>
                                        </div>
                                        <div className="program-badge-container">
                                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-neon-pink/20 text-neon-pink border border-neon-pink/30">
                                            {program.level?.replace("'s Degree", "") || "Bachelor"} Level
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Program Details */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center space-x-2 program-details-container">
                                          <span className="text-gray-400 flex-shrink-0">Match Score:</span>
                                          <span className="font-medium text-neon-blue overflow-hidden">
                                            {Math.round((program.match_score || 0) * 100)}%
                                          </span>
                                        </div>
                                        <div className="flex items-start space-x-2 program-details-container">
                                          <span className="text-gray-400 flex-shrink-0">Interest:</span>
                                          <span className="font-medium text-neon-green program-interest-text">
                                            {program.interest}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Additional Program Info */}
                                      <div className="grid grid-cols-1 gap-2 text-xs text-gray-400">
                                        <div className="flex justify-between min-w-0">
                                          <span className="flex-shrink-0">Duration:</span>
                                          <span className="font-medium program-card-text text-right">{cleanDuration(program.duration)}</span>
                                        </div>
                                        <div className="flex justify-between min-w-0">
                                          <span className="flex-shrink-0">Tuition:</span>
                                          <span className="font-medium overflow-hidden text-right">{cleanTuition(program.tuition)}</span>
                                        </div>
                                        <div className="flex justify-between min-w-0">
                                          <span className="flex-shrink-0">Department:</span>
                                          <span className="font-medium program-card-text text-right">{program.department}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Call to Action */}
                                      <div className="text-center pt-2">
                                        <span className="text-neon-pink font-medium text-sm">Click to learn more about this program →</span>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Program Callback Button */}
                          {selectedProgram && message.show_callback_button && (
                            <div className="mt-3">
                              <button
                                onClick={handleProgramCallback}
                                className="bg-neon-green text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
                              >
                                <Phone className="h-4 w-4" />
                                <span>Request Callback for {cleanProgramName(selectedProgram.name)}</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {message.sender === 'user' && (
                          <User className="h-4 w-4 mt-1 text-white flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-neon-pink" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-dark-700 bg-dark-800 p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-2 border border-dark-600 bg-dark-700 text-white rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Callback Modal */}
        {showCallbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Request Callback</h3>
              <p className="text-gray-600 mb-6">
                Would you like to schedule a personalized consultation with our admissions team?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={async () => {
                    if (selectedConversation !== null) {
                      // Record positive feedback
                      if (prediction) {
                        try {
                          await axios.post('/api/admin/model-feedback', {
                            student_id: studentId,
                            prediction: prediction,
                            actual_outcome: 'contact_requested'
                          });
                        } catch (error) {
                          console.error('Error recording feedback:', error);
                        }
                      }
                      
                      await handleCallbackRequest(selectedConversation);
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Phone className="h-4 w-4" />
                  <span>Yes, Contact Me</span>
                </button>
                <button
                  onClick={async () => {
                    // Record negative feedback
                    if (prediction) {
                      try {
                        await axios.post('/api/admin/model-feedback', {
                          student_id: studentId,
                          prediction: prediction,
                          actual_outcome: 'no_contact'
                        });
                      } catch (error) {
                        console.error('Error recording feedback:', error);
                      }
                    }
                    
                    setShowCallbackModal(false);
                    setSelectedConversation(null);
                    
                    // Show feedback message
                    const feedbackMessage: Message = {
                      id: Date.now().toString(),
                      text: "Thank you for your feedback! This helps us improve our predictions. Feel free to ask any other questions!",
                      sender: 'ai',
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, feedbackMessage]);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  <span>No, Thanks</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Callback Button */}
        {messages.length > 0 && !isLoading && !showForm && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setSelectedConversation(messages.length - 1);
                setShowCallbackModal(true);
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 mx-auto"
            >
              <Phone className="h-4 w-4" />
              <span>Request Callback</span>
            </button>
          </div>
        )}

        {/* Feedback Button */}
        {messages.length > 0 && !isLoading && !showForm && !feedbackSubmitted && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="bg-neon-purple text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center space-x-2 mx-auto"
            >
              <Star className="h-4 w-4" />
              <span>Rate Your Experience</span>
            </button>
          </div>
        )}

        {/* Chat Feedback Modal */}
        <ChatFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
          isLoading={submittingFeedback}
        />
      </div>
    </div>
  );
};

export default AIChatPage; 