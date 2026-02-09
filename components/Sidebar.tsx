'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  FileText,
  LogOut,
  Settings,
  X,
  User,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const router = useRouter();
  const {
    user,
    token,
    logout,
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSession,
    clearMessages,
    sidebarOpen,
    toggleSidebar,
  } = useStore();

  useEffect(() => {
    // Only load sessions if user is authenticated
    if (token && user) {
      loadSessions();
      
      // Refresh sessions every 30 seconds
      const interval = setInterval(() => {
        // Double-check token still exists before each refresh
        const storage = localStorage.getItem('app-storage');
        if (storage) {
          try {
            const data = JSON.parse(storage);
            if (data?.state?.token) {
              loadSessions();
            }
          } catch (e) {
            console.error('Storage parse error:', e);
          }
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [token, user]);
  
  // Reload sessions when a new session is created
  useEffect(() => {
    if (currentSessionId && token) {
      loadSessions();
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    // Don't attempt to load if no token
    if (!token) {
      return;
    }
    
    try {
      const response = await chatApi.getSessions();
      const sessionsData = response.data.data || [];
      // Deduplicate sessions by ID before setting state
      const uniqueSessions = Array.from(new Map(sessionsData.map((s: any) => [s.id, s])).values());
      setSessions(uniqueSessions);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      // Don't show error toast on 401 - the interceptor handles redirect
      if (error.response?.status !== 401) {
        toast.error('Failed to load sessions');
      }
    }
  };

  const handleNewChat = () => {
    setCurrentSession(null);
    clearMessages();
    router.push('/chat');
  };

  const handleSessionClick = async (sessionId: string) => {
    try {
      setCurrentSession(sessionId);
      const response = await chatApi.getSession(sessionId);
      const session = response.data.data;
      
      // Don't navigate if already on chat page, just switch session
      if (window.location.pathname === '/chat') {
        // Session will be loaded by the chat component's useEffect
      } else {
        router.push('/chat');
      }
    } catch (error: any) {
      toast.error('Failed to load session');
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSession(null);
        clearMessages();
      }
      toast.success('Session deleted');
    } catch (error: any) {
      toast.error('Failed to delete session');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!sidebarOpen) {
    return null;
  }

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col h-screen shadow-2xl border-r border-gray-700/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Assistant
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-lg transition-all duration-300 transform hover:scale-110 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <h2 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">
          Recent Chats
        </h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          Array.from(new Map(sessions.map(s => [s.id, s])).values()).map((session) => (
            <div
              key={session.id}
              onClick={() => handleSessionClick(session.id)}
              className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                currentSessionId === session.id
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 text-white shadow-lg'
                  : 'hover:bg-gray-800/50 text-gray-300 border-2 border-transparent hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-blue-400' : ''}`} />
                <span className="text-sm truncate font-medium">
                  {session.messages?.[0]?.content?.substring(0, 40) || 'New conversation'}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-lg transition-all duration-300 transform hover:scale-110"
                title="Delete session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-700/50 p-4 space-y-2">
        <button
          onClick={() => router.push('/documents')}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 rounded-xl transition-all duration-300 text-sm font-medium border-2 border-transparent hover:border-blue-500/30 transform hover:scale-105"
        >
          <FileText className="w-4 h-4" />
          <span>Documents</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-700/50 p-4 bg-gray-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-gray-800/50 border border-gray-700/30">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-50"></div>
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.username}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-red-600/20 to-pink-600/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 text-sm font-semibold border-2 border-red-500/30 hover:border-red-500/50 transform hover:scale-105"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
