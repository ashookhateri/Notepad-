import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { WorkspaceNode } from '../types/editor';

interface FolderWorkspaceProps {
  nodes: WorkspaceNode[];
  onOpenNode: (node: WorkspaceNode) => void;
  onToggleExpand: (nodeId: string) => void;
  onCreateFile: (parentId: string | null, name: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onImportFiles: () => void;
  onClosePanel: () => void;
}

export const FolderWorkspace: React.FC<FolderWorkspaceProps> = ({
  nodes,
  onOpenNode,
  onToggleExpand,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onImportFiles,
  onClosePanel,
}) => {
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingName, setCreatingName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('ws-folder-root');

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = creatingName.trim();
    if (!trimmed) return;
    if (creatingType === 'file') {
      onCreateFile(selectedFolderId, trimmed);
    } else if (creatingType === 'folder') {
      onCreateFolder(selectedFolderId, trimmed);
    }
    setCreatingName('');
    setCreatingType(null);
  };

  const renderTree = (parentId: string | null, depth = 0) => {
    const children = nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));

    return children.map((node) => {
      const isFolder = node.type === 'folder';
      return (
        <div key={node.id}>
          <div
            onClick={() => {
              if (isFolder) {
                setSelectedFolderId(node.id);
                onToggleExpand(node.id);
              } else {
                onOpenNode(node);
              }
            }}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            className={`group flex items-center justify-between pr-1.5 py-1.5 sm:py-1 text-xs cursor-pointer hover:bg-[#e5f3ff] dark:hover:bg-[#2a2d2e] ${
              isFolder && selectedFolderId === node.id ? 'bg-[#edf5ff] dark:bg-[#252a30]' : ''
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              {isFolder ? (
                <>
                  {node.expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                  )}
                  {node.expanded ? (
                    <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" />
                  <FileCode2 className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                </>
              )}
              <span className="truncate">{node.name}</span>
            </span>

            {node.id !== 'ws-folder-root' && (
              <button
                type="button"
                title="Delete"
                aria-label={`Delete ${node.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          {isFolder && node.expanded && renderTree(node.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <aside className="w-56 sm:w-60 shrink-0 flex flex-col bg-[#f6f6f6] dark:bg-[#252526] border-r border-[#d0d0d0] dark:border-[#3c3c3c] text-[#1a1a1a] dark:text-[#d4d4d4] select-none npp-no-print">
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#eaeaea] dark:bg-[#2d2d2d] border-b border-[#d0d0d0] dark:border-[#3c3c3c]">
        <span className="text-xs font-semibold truncate">Folder as Workspace</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="New File in Workspace"
            onClick={() => {
              setCreatingType('file');
              setCreatingName('');
            }}
            className="p-1 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="New Folder"
            onClick={() => {
              setCreatingType('folder');
              setCreatingName('');
            }}
            className="p-1 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Import Files from Device"
            onClick={onImportFiles}
            className="p-1 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Close Panel"
            onClick={onClosePanel}
            className="p-1 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {creatingType && (
        <form onSubmit={handleConfirmCreate} className="p-1.5 border-b border-[#d0d0d0] dark:border-[#3c3c3c] bg-white dark:bg-[#1e1e1e]">
          <input
            autoFocus
            type="text"
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            placeholder={creatingType === 'file' ? 'filename.js' : 'folder name'}
            className="w-full px-2 py-1 text-xs border border-blue-500 rounded bg-white dark:bg-[#252526] outline-none"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              type="button"
              onClick={() => setCreatingType(null)}
              className="px-2 py-0.5 text-[11px] rounded bg-neutral-200 dark:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 text-[11px] rounded bg-blue-600 text-white"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto npp-scroll py-1">{renderTree(null)}</div>
    </aside>
  );
};
