import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedQuestions?: string[];
  fromCache?: boolean;
  cacheSimilarity?: number;
  responseSource?: 'cached' | 'knowledge_base' | 'ai_generated' | 'hybrid';
  file?: {
    name: string;
    size: number;
    type: string;
    url?: string; // For displaying images
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Document {
  id: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  uploadedAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;

  // Chat
  currentSessionId: string | null;
  messages: Message[];
  sessions: ChatSession[];
  selectedModel: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite';
  setCurrentSession: (sessionId: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setSessions: (sessions: ChatSession[]) => void;
  clearMessages: () => void;
  addSession: (session: ChatSession) => void;
  updateSession: (sessionId: string, messages: Message[]) => void;
  setSelectedModel: (model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite') => void;

  // Documents
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, currentSessionId: null, messages: [] });
      },

      // Chat state
      currentSessionId: null,
      messages: [],
      sessions: [],
      selectedModel: 'gemini-2.5-flash',
      setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setMessages: (messages) => set({ messages }),
      setSessions: (sessions) => set({ sessions }),
      clearMessages: () => set({ messages: [] }),
      addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),
      updateSession: (sessionId, messages) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messages, updatedAt: new Date().toISOString() } : s
          ),
        })),
      setSelectedModel: (model) => set({ selectedModel: model }),

      // Documents state
      documents: [],
      setDocuments: (documents) => set({ documents }),
      addDocument: (document) =>
        set((state) => ({ documents: [...state.documents, document] })),

      // UI state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        currentSessionId: state.currentSessionId,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
