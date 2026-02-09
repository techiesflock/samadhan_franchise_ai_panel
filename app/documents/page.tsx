'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi, foldersApi, searchApi } from '@/lib/api';
import { useStore, Document, Folder } from '@/lib/store';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import FolderTree from '@/components/FolderTree';
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
  Search,
  FolderPlus,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';

function DocumentsPage() {
  const router = useRouter();
  const {
    documents,
    setDocuments,
    addDocument,
    folders,
    setFolders,
    addFolder,
    currentFolderId,
    setCurrentFolderId,
    sidebarOpen,
    toggleSidebar,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    folders: Folder[];
    documents: Document[];
    aiSuggestions?: string[];
  } | null>(null);
  
  // Create folder modal
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [parentFolderForNew, setParentFolderForNew] = useState<string | undefined>();

  useEffect(() => {
    loadFolderContents(currentFolderId);
    loadStats();
  }, [currentFolderId]);

  const loadFolderContents = async (folderId: string | null) => {
    setLoading(true);
    try {
      const response = await foldersApi.getContents(folderId || undefined);
      const { folders: folderList, documents: docList, breadcrumbs: crumbs } = response.data.data;
      
      setFolders(folderList || []);
      setDocuments(docList || []);
      setBreadcrumbs(crumbs || []);
    } catch (error: any) {
      toast.error('Failed to load folder contents');
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
        const response = await documentsApi.upload(files[0], currentFolderId || undefined);
        addDocument(response.data.data);
        toast.success('Document uploaded successfully');
      } else {
        const fileArray = Array.from(files);
        const response = await documentsApi.uploadMultiple(fileArray, currentFolderId || undefined);
        response.data.data.forEach((doc: Document) => addDocument(doc));
        toast.success(`${files.length} documents uploaded successfully`);
      }
      loadFolderContents(currentFolderId);
      loadStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload document';
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = '';
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

      loadFolderContents(currentFolderId);
      loadStats();
    } catch (error: any) {
      toast.error('Failed to re-index documents');
    } finally {
      setReindexing(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const response = await foldersApi.create({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
        parentId: parentFolderForNew,
      });
      
      addFolder(response.data.data);
      toast.success('Folder created successfully');
      setShowCreateFolder(false);
      setNewFolderName('');
      setNewFolderDescription('');
      setParentFolderForNew(undefined);
      loadFolderContents(currentFolderId);
    } catch (error: any) {
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    // First try to delete normally
    try {
      await foldersApi.delete(folderId, false);
      toast.success('Folder deleted successfully');
      loadFolderContents(currentFolderId);
    } catch (error: any) {
      const message = error.response?.data?.message || '';
      
      // If folder is not empty, offer cascade delete
      if (message.includes('not empty')) {
        if (confirm('⚠️ This folder contains files or subfolders.\n\nDelete everything inside? This action cannot be undone!')) {
          try {
            await foldersApi.delete(folderId, true); // Force delete
            toast.success('Folder and all contents deleted successfully');
            loadFolderContents(currentFolderId);
          } catch (cascadeError: any) {
            toast.error('Failed to delete folder and contents');
          }
        }
      } else {
        toast.error(message || 'Failed to delete folder');
      }
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await foldersApi.update(folderId, { name: newName });
      toast.success('Folder renamed successfully');
      loadFolderContents(currentFolderId);
    } catch (error: any) {
      toast.error('Failed to rename folder');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const response = await searchApi.search({
        query: searchQuery.trim(),
        folderId: currentFolderId || undefined,
        includeSubfolders: true,
        limit: 20,
      });
      
      setSearchResults(response.data.data);
      toast.success(`Found ${response.data.data.documents.length} documents and ${response.data.data.folders.length} folders`);
    } catch (error: any) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const openCreateFolderModal = (parentId?: string) => {
    setParentFolderForNew(parentId);
    setShowCreateFolder(true);
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

  const displayFolders = searchResults ? searchResults.folders : folders;
  const displayDocuments = searchResults ? searchResults.documents : documents;

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Folder Tree Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto p-4">
          <div className="mb-4">
            <button
              onClick={() => openCreateFolderModal()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          </div>
          
          <FolderTree
            folders={folders}
            currentFolderId={currentFolderId}
            onFolderClick={(id) => {
              setCurrentFolderId(id);
              clearSearch();
            }}
            onCreateFolder={openCreateFolderModal}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
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

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <button
                  onClick={() => {
                    setCurrentFolderId(null);
                    clearSearch();
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Home
                </button>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id}>
                    <ChevronRight className="w-4 h-4" />
                    <button
                      onClick={() => {
                        setCurrentFolderId(crumb.id);
                        clearSearch();
                      }}
                      className={`hover:text-blue-600 dark:hover:text-blue-400 ${
                        index === breadcrumbs.length - 1 ? 'font-semibold text-gray-900 dark:text-white' : ''
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* AI Search Bar */}
            <div className="mt-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="AI-powered search (search by category, keywords, or content)..."
                  className="w-full pl-10 pr-24 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2">
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {searching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* AI Suggestions */}
              {searchResults?.aiSuggestions && searchResults.aiSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Suggestions:</span>
                  {searchResults.aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        handleSearch();
                      }}
                      className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalDocuments || 0}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Chunks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalChunks || 0}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Processing</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {documents.filter((d) => d.status === 'processing').length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : displayFolders.length === 0 && displayDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {searchResults ? 'No results found' : 'No documents yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  {searchResults
                    ? 'Try a different search query or browse folders'
                    : 'Upload your first document or create folders to organize your files.'}
                </p>
              </div>
            ) : (
              <div className="max-w-4xl space-y-6">
                {/* Folders */}
                {displayFolders.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      FOLDERS
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {displayFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => {
                            setCurrentFolderId(folder.id);
                            clearSearch();
                          }}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-8 h-8 text-yellow-500" />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {folder.name}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {folder.documentCount} files
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {displayDocuments.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      DOCUMENTS
                    </h2>
                    <div className="space-y-3">
                      {displayDocuments.map((doc) => (
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Folder
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Automobile"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="e.g., Documents related to automobile services"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  setNewFolderDescription('');
                  setParentFolderForNew(undefined);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
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
