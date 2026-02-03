import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand persisted storage
    try {
      const storage = localStorage.getItem('app-storage');
      if (storage) {
        const data = JSON.parse(storage);
        const token = data?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to get token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear entire Zustand storage on 401
      localStorage.removeItem('app-storage');
      // Only redirect if not already on login page to prevent loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Documents APIs
export const documentsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/documents/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAll: () => api.get('/documents'),
  getStats: () => api.get('/documents/stats'),
  getById: (id: string) => api.get(`/documents/${id}`),
  delete: (id: string) => api.delete(`/documents/${id}`),
  reindex: () => api.post('/documents/reindex'),
};

// Chat APIs
export const chatApi = {
  ask: (data: {
    message: string;
    sessionId?: string;
    topK?: number;
    includeHistory?: boolean;
    model?: string;
    file?: File;
  }) => {
    // If file is present, use FormData
    if (data.file) {
      const formData = new FormData();
      formData.append('message', data.message);
      formData.append('file', data.file);
      if (data.sessionId) formData.append('sessionId', data.sessionId);
      if (data.includeHistory !== undefined) formData.append('includeHistory', String(data.includeHistory));
      if (data.topK) formData.append('topK', String(data.topK));
      if (data.model) formData.append('model', data.model);
      
      return api.post('/chat/ask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    
    // Otherwise use JSON
    return api.post('/chat/ask', data);
  },
  createSession: () => api.post('/chat/sessions'),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (id: string) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id: string) => api.delete(`/chat/sessions/${id}`),
  clearHistory: (id: string) => api.post(`/chat/sessions/${id}/clear`),
  getHealth: () => api.get('/chat/health'),
};
