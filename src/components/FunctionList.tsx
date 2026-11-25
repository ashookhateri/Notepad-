import React, { useMemo } from 'react';
import { Braces, FileText, Hash, X } from 'lucide-react';
import { NppLanguage } from '../types/editor';
import { extractFunctionSymbols } from '../utils/languageUtils';

interface FunctionListProps {
  docTitle: string;
  content: string;
  language: NppLanguage;
  onJumpToLine: (line: number) => void;
  onClose: () => void;
}

export const FunctionList: React.FC<FunctionListProps> = ({
  docTitle,
  content,
  language,
  onJumpToLine,
  onClose,
}) => {
  const symbols = useMemo(() => extractFunctionSymbols(content, language), [content, language]);

  return (
    <aside className="w-52 sm:w-56 shrink-0 flex flex-col bg-[#f6f6f6] dark:bg-[#252526] border-l border-[#d0d0d0] dark:border-[#3c3c3c] text-[#1a1a1a] dark:text-[#d4d4d4] select-none npp-no-print">
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#eaeaea] dark:bg-[#2d2d2d] border-b border-[#d0d0d0] dark:border-[#3c3c3c]">
        <span className="text-xs font-semibold truncate">Function List</span>
        <button
          type="button"
          onClick={onClose}
          title="Close Function List"
          className="p-0.5 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-2.5 py-1.5 text-[11px] font-medium border-b border-[#e0e0e0] dark:border-[#333333] flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
        <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
        <span className="truncate">{docTitle}</span>
      </div>

      <div className="flex-1 overflow-y-auto npp-scroll py-1">
        {symbols.length === 0 ? (
          <div className="px-3 py-4 text-xs text-neutral-500 dark:text-neutral-400 text-center">
            No functions or symbols detected for {language}.
          </div>
        ) : (
          symbols.map((sym, idx) => (
            <button
              key={`${sym.line}-${sym.name}-${idx}`}
              type="button"
              onClick={() => onJumpToLine(sym.line)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 sm:py-1 text-left text-xs hover:bg-[#e5f3ff] dark:hover:bg-[#094771]"
            >
              <span className="flex items-center gap-1.5 truncate">
                {sym.kind === 'heading' ? (
                  <Hash className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <Braces className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                )}
                <span className="truncate font-mono text-[11px]">{sym.name}</span>
              </span>
              <span className="text-[10px] text-neutral-500 tabular-nums shrink-0">:{sym.line}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
