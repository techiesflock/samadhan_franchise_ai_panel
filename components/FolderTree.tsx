'use client';

import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';
import { Folder as FolderType } from '@/lib/store';

interface FolderTreeProps {
  folders: FolderType[];
  currentFolderId: string | null;
  onFolderClick: (folderId: string | null) => void;
  onCreateFolder?: (parentId?: string) => void;
  onRenameFolder?: (folderId: string, name: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

interface FolderNodeProps {
  folder: FolderType;
  level: number;
  isSelected: boolean;
  onClick: () => void;
  onCreateSubfolder?: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  level,
  isSelected,
  onClick,
  onCreateSubfolder,
  onRename,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showActions, setShowActions] = useState(false);

  const hasChildren = folder.children && folder.children.length > 0;

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name && onRename) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        <Folder className="w-4 h-4 flex-shrink-0 text-yellow-500" />
        
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setNewName(folder.name);
              }
            }}
            className="flex-1 px-2 py-0.5 text-sm border border-blue-500 rounded outline-none bg-white dark:bg-gray-800"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            onClick={onClick}
          >
            {folder.name}
          </span>
        )}
        
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {folder.documentCount || 0}
        </span>

        {showActions && !isRenaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onCreateSubfolder && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateSubfolder();
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Create subfolder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Rename"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              isSelected={false}
              onClick={() => {}}
              onCreateSubfolder={onCreateSubfolder ? () => onCreateSubfolder() : undefined}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  currentFolderId,
  onFolderClick,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}) => {
  return (
    <div className="space-y-1">
      {/* Root folder */}
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          currentFolderId === null
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onFolderClick(null)}
      >
        <Folder className="w-4 h-4 text-yellow-500" />
        <span className="flex-1 text-sm font-medium">All Documents</span>
        {onCreateFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder();
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100"
            title="Create folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Folder tree */}
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          level={0}
          isSelected={currentFolderId === folder.id}
          onClick={() => onFolderClick(folder.id)}
          onCreateSubfolder={
            onCreateFolder ? () => onCreateFolder(folder.id) : undefined
          }
          onRename={
            onRenameFolder
              ? (name) => onRenameFolder(folder.id, name)
              : undefined
          }
          onDelete={
            onDeleteFolder ? () => onDeleteFolder(folder.id) : undefined
          }
        />
      ))}
    </div>
  );
};

export default FolderTree;
