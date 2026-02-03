'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import ModelSelector from '@/components/ModelSelector';
import toast from 'react-hot-toast';
import { Menu, Bot } from 'lucide-react';

function ChatPage() {
  const {
    messages,
    setMessages,
    addMessage,
    currentSessionId,
    setCurrentSession,
    sidebarOpen,
    toggleSidebar,
    addSession,
    updateSession,
    user,
    selectedModel,
    setSelectedModel,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('📋 Current messages in state:', messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages();
    } else {
      // Clear messages when starting a new chat
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    // Listen for suggested question clicks
    const handleSuggestedQuestion = (event: any) => {
      if (!loading) {
        handleSendMessage(event.detail);
      }
    };
    
    window.addEventListener('suggestedQuestionClick', handleSuggestedQuestion);
    return () => {
      window.removeEventListener('suggestedQuestionClick', handleSuggestedQuestion);
    };
  }, [loading]);

  const loadSessionMessages = async () => {
    if (!currentSessionId) return;

    try {
      console.log('📂 Loading session:', currentSessionId);
      const response = await chatApi.getSession(currentSessionId);
      const session = response.data.data;
      console.log('📥 Session loaded:', session);
      console.log('💬 Messages in session:', session.messages);
      
      // Ensure each message has a unique ID
      const messagesWithIds = (session.messages || []).map((msg: any, index: number) => ({
        ...msg,
        id: msg.id || `loaded-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      }));
      
      setMessages(messagesWithIds);
      console.log('✅ Messages set to state');
    } catch (error: any) {
      console.error('❌ Failed to load session messages:', error);
      toast.error('Failed to load chat history');
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    // Find the message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Remove all messages after this one (including the AI response)
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // Resend the edited message
    await handleSendMessage(newContent);
  };

  const handleRegenerateResponse = async (messageId: string) => {
    // Find the assistant message index
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    // Find the previous user message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

    const userMessage = messages[userMessageIndex];

    // Remove the assistant message
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // Regenerate response with the same user message
    await handleSendMessage(userMessage.content);
  };

  const handleSendMessage = async (content: string, file?: File) => {
    // Generate unique IDs using timestamp + random string
    const userMessage: any = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };

    // Add file info to user message if present
    if (file) {
      userMessage.file = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };
    }

    addMessage(userMessage);
    setLoading(true);

    try {
      const response = await chatApi.ask({
        message: content,
        sessionId: currentSessionId || undefined,
        topK: 5,
        includeHistory: true,
        model: selectedModel,
        file: file,
      });

      console.log('📥 Full Response:', response.data);
      const data = response.data.data;
      console.log('📊 Response Data:', data);
      console.log('💬 Answer:', data.answer);

      // Update session ID if it's a new chat
      if (!currentSessionId && data.sessionId) {
        setCurrentSession(data.sessionId);
        
        // Add new session to the sidebar
        if (user) {
          addSession({
            id: data.sessionId,
            userId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [userMessage],
          });
        }
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant' as const,
        content: data.answer,
        timestamp: data.timestamp,
        suggestedQuestions: data.suggestedQuestions,
        fromCache: data.fromCache || false,
        cacheSimilarity: data.cacheSimilarity,
        responseSource: data.responseSource,
      };

      console.log('🤖 Assistant Message to Add:', assistantMessage);
      addMessage(assistantMessage);
      console.log('✅ Message added to store');
      
      // Update session with new messages
      if (data.sessionId) {
        const updatedMessages = [...messages, userMessage, assistantMessage];
        updateSession(data.sessionId, updatedMessages);
      }
    } catch (error: any) {
      console.error('Chat API Error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to get response';
      toast.error(errorMessage);

      const errorResponse = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant' as const,
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };

      addMessage(errorResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white rounded-xl transition-all duration-300 transform hover:scale-110"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Assistant
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Powered by AI</p>
                </div>
              </div>
            </div>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-3xl">
                {/* Animated Icon */}
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform transition-transform hover:rotate-12 hover:scale-110">
                    <Bot className="w-14 h-14 text-white" />
                  </div>
                </div>

                <h2 className="text-5xl font-extrabold mb-4">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    How can I help you today?
                  </span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
                  Ask me anything about your documents or start a conversation with AI
                </p>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <button
                    onClick={() =>
                      handleSendMessage('What documents do I have uploaded?')
                    }
                    className="group relative p-6 text-left bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border border-blue-200 dark:border-blue-700/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">📄</div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          My Documents
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          See what documents I have
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage('How does this AI assistant work?')
                    }
                    className="group relative p-6 text-left bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border border-purple-200 dark:border-purple-700/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">🤖</div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          How it works
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Learn about the AI
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  onEdit={handleEditMessage}
                  onRegenerate={handleRegenerateResponse}
                />
              ))}
              {loading && (
                <div className="flex gap-4 px-4 py-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 animate-pulse-slow">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                        <Bot className="w-6 h-6 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>AI is thinking</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full w-1/2 animate-pulse delay-75"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  );
}
