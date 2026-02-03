'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/lib/api';
import { useStore, Document } from '@/lib/store';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Trash2,
  Menu,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';

function DocumentsPage() {
  const router = useRouter();
  const { documents, setDocuments, addDocument, sidebarOpen, toggleSidebar } =
    useStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDocuments();
    loadStats();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentsApi.getAll();
      setDocuments(response.data.data || []);
    } catch (error: any) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await documentsApi.getStats();
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      if (files.length === 1) {
        const response = await documentsApi.upload(files[0]);
        addDocument(response.data.data);
        toast.success('Document uploaded successfully');
      } else {
        const fileArray = Array.from(files);
        const response = await documentsApi.uploadMultiple(fileArray);
        response.data.data.forEach((doc: Document) => addDocument(doc));
        toast.success(`${files.length} documents uploaded successfully`);
      }
      loadStats();
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to upload document';
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsApi.delete(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
      toast.success('Document deleted successfully');
      loadStats();
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };

  const handleReindexAll = async () => {
    if (!confirm('Re-index all documents? This will rebuild all vector embeddings.')) {
      return;
    }

    setReindexing(true);
    try {
      const response = await documentsApi.reindex();
      const result = response.data.data;
      
      if (result.failed > 0) {
        toast.success(
          `Re-indexed ${result.reindexed} documents, ${result.failed} failed`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Successfully re-indexed ${result.reindexed} documents!`);
      }
      
      loadDocuments();
      loadStats();
    } catch (error: any) {
      toast.error('Failed to re-index documents');
    } finally {
      setReindexing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documents
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReindexAll}
                disabled={reindexing || documents.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Re-index all documents"
              >
                <RefreshCw className={`w-4 h-4 ${reindexing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{reindexing ? 'Re-indexing...' : 'Re-index'}</span>
              </button>
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalDocuments || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Chunks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalChunks || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Processing
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {documents.filter((d) => d.status === 'processing').length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No documents yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Upload your first document to start building your knowledge base.
              </p>
              <label
                htmlFor="file-upload-empty"
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Document</span>
                <input
                  id="file-upload-empty"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="max-w-4xl space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-10 h-10 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.fileName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(doc.status)}
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {getStatusText(doc.status)}
                          </span>
                          {doc.uploadedAt && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <DocumentsPage />
    </ProtectedRoute>
  );
}
