'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check, FileText, Image as ImageIcon, Edit2, RefreshCw, Database, Sparkles } from 'lucide-react';
import { Message } from '@/lib/store';

interface ChatMessageProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export default function ChatMessage({ message, onEdit, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSave = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit?.(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div
      className={`flex gap-4 px-4 py-6 group transition-all duration-300 ${
        message.role === 'assistant' 
          ? 'bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/10' 
          : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
      }`}
    >
      <div className="flex-shrink-0">
        <div className="relative">
          {message.role === 'assistant' && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-md opacity-30 animate-pulse"></div>
          )}
          {message.role === 'user' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-30"></div>
          )}
          <div
            className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                : 'bg-gradient-to-br from-green-400 to-blue-500'
            }`}
          >
            {message.role === 'user' ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {/* Response Source Indicator (only for assistant messages) */}
        {message.role === 'assistant' && (
          <div className="mb-3 flex items-center gap-2">
            {message.fromCache ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300">
                <Database className="w-3.5 h-3.5" />
                <span>Cached Response</span>
                {message.cacheSimilarity && (
                  <span className="text-purple-600 dark:text-purple-400 ml-1">
                    ({(message.cacheSimilarity * 100).toFixed(0)}% match)
                  </span>
                )}
              </div>
            ) : message.responseSource === 'knowledge_base' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                <FileText className="w-3.5 h-3.5" />
                <span>Knowledge Base</span>
              </div>
            ) : message.responseSource === 'ai_generated' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full text-xs font-medium text-green-700 dark:text-green-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Generated</span>
              </div>
            ) : message.responseSource === 'hybrid' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hybrid (KB + AI)</span>
              </div>
            ) : null}
          </div>
        )}
        
        {/* File Preview (only for user messages) */}
        {message.file && message.role === 'user' && (
          <div className="mb-3">
            {message.file.type.startsWith('image/') && message.file.url ? (
              <div className="relative group max-w-md">
                <img
                  src={message.file.url}
                  alt={message.file.name}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 object-contain"
                />
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ImageIcon className="w-4 h-4" />
                  <span className="truncate">{message.file.name}</span>
                  <span className="text-xs">
                    ({(message.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-md border border-gray-200 dark:border-gray-600">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {message.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(message.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode for User Messages */}
        {isEditing && message.role === 'user' ? (
          <div className="space-y-3">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Save & Send
              </button>
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                return !inline && match ? (
                  <div className="relative group">
                    <button
                      onClick={() => copyToClipboard(codeString)}
                      className="absolute right-2 top-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {message.role === 'user' && onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-all transform hover:scale-105 shadow-sm hover:shadow-md border border-blue-200 dark:border-blue-700/30"
                title="Edit message"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="font-medium">Edit</span>
              </button>
            )}
            {message.role === 'assistant' && onRegenerate && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 hover:from-green-200 hover:to-blue-200 dark:hover:from-green-900/50 dark:hover:to-blue-900/50 text-green-700 dark:text-green-300 rounded-lg transition-all transform hover:scale-105 shadow-sm hover:shadow-md border border-green-200 dark:border-green-700/30"
                title="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="font-medium">Regenerate</span>
              </button>
            )}
          </div>
        )}

        {/* Display suggested questions if available */}
        {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Suggested Questions:
            </h4>
            <div className="grid gap-3">
              {message.suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // This will be handled by parent component
                    const event = new CustomEvent('suggestedQuestionClick', { detail: question });
                    window.dispatchEvent(event);
                  }}
                  className="group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-700/30 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {question}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
