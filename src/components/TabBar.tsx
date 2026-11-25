import React, { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { EditorDocument } from '../types/editor';
import { FloppyReadOnlyIcon, FloppySavedIcon, FloppyUnsavedIcon } from './NppIcons';

interface TabBarProps {
  documents: EditorDocument[];
  activeDocId: string | null;
  paneNumber: 1 | 2;
  onSelectTab: (docId: string, pane: 1 | 2) => void;
  onCloseTab: (docId: string) => void;
  onNewTab: (pane: 1 | 2) => void;
  onTabContextAction: (docId: string, action: 'close' | 'closeOthers' | 'closeLeft' | 'closeRight' | 'rename' | 'movePane' | 'toggleReadOnly') => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  documents,
  activeDocId,
  paneNumber,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTabContextAction,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ docId: string; x: number; y: number } | null>(null);

  return (
    <div className="relative flex items-end bg-[#e4e4e4] dark:bg-[#2b2b2b] border-b border-[#c8c8c8] dark:border-[#3c3c3c] select-none npp-no-print">
      {/* Scrollable Tabs */}
      <div className="flex items-end overflow-x-auto no-scrollbar flex-1 pt-0.5 px-1 gap-0.5">
        {documents.map((doc) => {
          const isActive = doc.id === activeDocId;
          return (
            <div
              key={doc.id}
              onClick={() => onSelectTab(doc.id, paneNumber)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY });
              }}
              className={`group relative flex items-center gap-1.5 px-2.5 h-[32px] sm:h-[27px] max-w-[180px] shrink-0 cursor-pointer border-x border-t text-xs transition-colors ${
                isActive
                  ? 'bg-white dark:bg-[#1e1e1e] text-black dark:text-white border-[#c8c8c8] dark:border-[#3c3c3c] font-medium z-10 -mb-[1px] pb-[1px]'
                  : 'bg-[#dcdcdc] dark:bg-[#2d2d2d] text-[#444444] dark:text-[#aaaaaa] border-[#cccccc] dark:border-[#383838] hover:bg-[#eeeeee] dark:hover:bg-[#353535]'
              }`}
            >
              {/* Classic Notepad++ Orange-Gold Top Accent Bar on Active Tab */}
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#f59e0b]" />
              )}

              {/* Classic Floppy Disk Icon (Red = Unsaved, Blue = Saved, Gray = ReadOnly) */}
              <span className="shrink-0 flex items-center">
                {doc.isReadOnly ? (
                  <FloppyReadOnlyIcon className="w-3.5 h-3.5" />
                ) : doc.isDirty ? (
                  <FloppyUnsavedIcon className="w-3.5 h-3.5" />
                ) : (
                  <FloppySavedIcon className="w-3.5 h-3.5" />
                )}
              </span>

              <span className="truncate whitespace-nowrap">{doc.title}</span>

              <button
                type="button"
                aria-label={`Close ${doc.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(doc.id);
                }}
                className="ml-0.5 p-0.5 rounded hover:bg-red-500 hover:text-white text-neutral-500 dark:text-neutral-400 transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New Tab (+) Button */}
        <button
          type="button"
          title="New Document (Ctrl+N)"
          aria-label="New Document"
          onClick={() => onNewTab(paneNumber)}
          className="shrink-0 flex items-center justify-center w-7 h-[28px] sm:h-[25px] text-neutral-600 dark:text-neutral-300 hover:bg-[#d5d5d5] dark:hover:bg-[#3a3a3a] rounded-t"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Switcher List Button */}
      <div className="relative shrink-0 border-l border-[#cccccc] dark:border-[#3c3c3c]">
        <button
          type="button"
          title="Open Documents List"
          aria-label="Open Documents List"
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center justify-center w-7 h-[30px] sm:h-[26px] text-neutral-600 dark:text-neutral-300 hover:bg-[#d5d5d5] dark:hover:bg-[#3a3a3a]"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-0.5 w-56 max-h-72 overflow-y-auto bg-white dark:bg-[#252526] border border-[#b8b8b8] dark:border-[#454545] shadow-lg z-50 py-1 text-xs">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(doc.id, paneNumber);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#e5f3ff] dark:hover:bg-[#094771] ${
                    doc.id === activeDocId ? 'font-semibold bg-[#f0f7ff] dark:bg-[#2a2d2e]' : ''
                  }`}
                >
                  {doc.isDirty ? (
                    <FloppyUnsavedIcon className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <FloppySavedIcon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed w-48 bg-[#f9f9f9] dark:bg-[#2b2b2b] border border-[#b8b8b8] dark:border-[#454545] shadow-xl py-1 text-xs z-50 text-[#1a1a1a] dark:text-[#e0e0e0]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 240),
            }}
          >
            {[
              { id: 'close', label: 'Close' },
              { id: 'closeOthers', label: 'Close All BUT This' },
              { id: 'closeLeft', label: 'Close All to the Left' },
              { id: 'closeRight', label: 'Close All to the Right' },
              { id: 'rename', label: 'Rename...' },
              { id: 'movePane', label: 'Move to Other View' },
              { id: 'toggleReadOnly', label: 'Toggle Read-Only' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onTabContextAction(
                    contextMenu.docId,
                    opt.id as 'close' | 'closeOthers' | 'closeLeft' | 'closeRight' | 'rename' | 'movePane' | 'toggleReadOnly'
                  );
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#91c9f7] dark:hover:bg-[#094771]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
