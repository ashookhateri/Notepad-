import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SearchOptions } from '../types/editor';

export type FindDialogTab = 'find' | 'replace' | 'findInFiles' | 'mark';

interface FindReplaceDialogProps {
  isOpen: boolean;
  activeTab: FindDialogTab;
  options: SearchOptions;
  statusMessage: string;
  onChangeTab: (tab: FindDialogTab) => void;
  onChangeOptions: (opts: SearchOptions) => void;
  onFindNext: (backwards?: boolean) => void;
  onCount: () => void;
  onFindAllInCurrent: () => void;
  onFindAllInOpened: () => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
  onReplaceInAllOpened: () => void;
  onMarkAll: () => void;
  onClearMarks: () => void;
  onClose: () => void;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  isOpen,
  activeTab,
  options,
  statusMessage,
  onChangeTab,
  onChangeOptions,
  onFindNext,
  onCount,
  onFindAllInCurrent,
  onFindAllInOpened,
  onReplaceOne,
  onReplaceAll,
  onReplaceInAllOpened,
  onMarkAll,
  onClearMarks,
  onClose,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!isOpen) return null;

  const tabs: { id: FindDialogTab; label: string }[] = [
    { id: 'find', label: 'Find' },
    { id: 'replace', label: 'Replace' },
    { id: 'findInFiles', label: 'Find in Files' },
    { id: 'mark', label: 'Mark' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'find') onFindNext(false);
    else if (activeTab === 'replace') onReplaceOne();
    else if (activeTab === 'findInFiles') onFindAllInOpened();
    else if (activeTab === 'mark') onMarkAll();
  };

  return (
    <div className="fixed inset-x-2 top-16 sm:inset-x-auto sm:right-6 sm:top-20 z-50 w-auto sm:w-[480px] bg-[#f0f0f0] dark:bg-[#2b2b2b] border border-[#999999] dark:border-[#4b4b4b] shadow-2xl text-xs text-[#1a1a1a] dark:text-[#e0e0e0] select-none npp-no-print">
      {/* Classic Window Title Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white dark:bg-[#1f1f1f] border-b border-[#d0d0d0] dark:border-[#3c3c3c]">
        <span className="font-medium capitalize">
          {activeTab === 'findInFiles' ? 'Find in Files' : activeTab}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized((m) => !m)}
            className="px-2 py-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            title={minimized ? 'Expand' : 'Collapse'}
          >
            {minimized ? '▢' : '—'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Find Dialog"
            className="p-1 hover:bg-red-500 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!minimized && (
        <>
          <div className="flex border-b border-[#c8c8c8] dark:border-[#3c3c3c] bg-[#e4e4e4] dark:bg-[#252526] px-2 pt-1.5 gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTab(t.id)}
                className={`px-3 py-1.5 rounded-t border-x border-t whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#f0f0f0] dark:bg-[#2b2b2b] border-[#b8b8b8] dark:border-[#454545] font-semibold -mb-[1px]'
                    : 'bg-[#dcdcdc] dark:bg-[#333333] border-transparent text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-3 space-y-3">
            {/* Find what / Replace with */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <label className="w-24 shrink-0 text-right">Find what :</label>
                <input
                  autoFocus
                  type="text"
                  value={options.query}
                  onChange={(e) => onChangeOptions({ ...options, query: e.target.value })}
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c] focus:border-blue-500 outline-none font-mono"
                />
              </div>

              {(activeTab === 'replace' || activeTab === 'findInFiles') && (
                <div className="flex items-center gap-2">
                  <label className="w-24 shrink-0 text-right">Replace with :</label>
                  <input
                    type="text"
                    value={options.replaceWith}
                    onChange={(e) => onChangeOptions({ ...options, replaceWith: e.target.value })}
                    className="flex-1 px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c] focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeTab === 'find' && (
                <>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771] font-medium"
                  >
                    Find Next
                  </button>
                  <button
                    type="button"
                    onClick={() => onFindNext(true)}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Find Previous
                  </button>
                  <button
                    type="button"
                    onClick={onCount}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Count
                  </button>
                  <button
                    type="button"
                    onClick={onFindAllInCurrent}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Find All in Current Document
                  </button>
                  <button
                    type="button"
                    onClick={onFindAllInOpened}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Find All in All Opened Documents
                  </button>
                </>
              )}

              {activeTab === 'replace' && (
                <>
                  <button
                    type="button"
                    onClick={() => onFindNext(false)}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Find Next
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771] font-medium"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={onReplaceAll}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Replace All
                  </button>
                  <button
                    type="button"
                    onClick={onReplaceInAllOpened}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Replace All in All Opened Documents
                  </button>
                </>
              )}

              {activeTab === 'findInFiles' && (
                <>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771] font-medium"
                  >
                    Find All in Opened Documents
                  </button>
                  <button
                    type="button"
                    onClick={onReplaceInAllOpened}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Replace in All Opened
                  </button>
                </>
              )}

              {activeTab === 'mark' && (
                <>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771] font-medium"
                  >
                    Mark All
                  </button>
                  <button
                    type="button"
                    onClick={onClearMarks}
                    className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771]"
                  >
                    Clear all marks
                  </button>
                </>
              )}
            </div>

            {/* Options & Search Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.wholeWord}
                    onChange={(e) => onChangeOptions({ ...options, wholeWord: e.target.checked })}
                  />
                  <span>Match whole word only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.matchCase}
                    onChange={(e) => onChangeOptions({ ...options, matchCase: e.target.checked })}
                  />
                  <span>Match case</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.wrapAround}
                    onChange={(e) => onChangeOptions({ ...options, wrapAround: e.target.checked })}
                  />
                  <span>Wrap around</span>
                </label>
                {activeTab === 'replace' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.inSelection}
                      onChange={(e) => onChangeOptions({ ...options, inSelection: e.target.checked })}
                    />
                    <span>In selection</span>
                  </label>
                )}
              </div>

              <fieldset className="border border-[#c8c8c8] dark:border-[#444444] p-2 space-y-1">
                <legend className="px-1 text-[11px] font-medium">Search Mode</legend>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchMode"
                    checked={options.mode === 'normal'}
                    onChange={() => onChangeOptions({ ...options, mode: 'normal' })}
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchMode"
                    checked={options.mode === 'extended'}
                    onChange={() => onChangeOptions({ ...options, mode: 'extended' })}
                  />
                  <span>Extended (\n, \r, \t, \0)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchMode"
                    checked={options.mode === 'regex'}
                    onChange={() => onChangeOptions({ ...options, mode: 'regex' })}
                  />
                  <span>Regular expression</span>
                </label>
              </fieldset>
            </div>

            {/* Status Feedback */}
            <div className="px-2 py-1 bg-white dark:bg-[#1e1e1e] border border-[#d0d0d0] dark:border-[#3c3c3c] text-[11px] text-blue-700 dark:text-sky-400 min-h-[24px] flex items-center">
              {statusMessage || 'Ready'}
            </div>
          </form>
        </>
      )}
    </div>
  );
};
