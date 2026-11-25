import React from 'react';
import { Undo2, Redo2, Search, Save } from 'lucide-react';

interface AndroidAccessoryBarProps {
  onInsertText: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFind: () => void;
  onSave: () => void;
}

const SYMBOLS = ['Tab', '{', '}', '(', ')', '[', ']', '<', '>', ';', '"', "'", '=', '/', '\\', ':', '_', '$'];

export const AndroidAccessoryBar: React.FC<AndroidAccessoryBarProps> = ({
  onInsertText,
  onUndo,
  onRedo,
  onFind,
  onSave,
}) => {
  return (
    <div className="flex items-center gap-1 px-1.5 py-1 bg-[#eaeaea] dark:bg-[#2a2a2a] border-t border-[#d0d0d0] dark:border-[#3c3c3c] overflow-x-auto no-scrollbar select-none md:hidden npp-no-print">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onUndo}
        aria-label="Undo"
        className="shrink-0 flex items-center justify-center min-w-[36px] h-8 px-2 rounded bg-white dark:bg-[#383838] border border-[#c4c4c4] dark:border-[#4b4b4b] text-[#222] dark:text-[#e5e5e5] active:scale-95"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRedo}
        aria-label="Redo"
        className="shrink-0 flex items-center justify-center min-w-[36px] h-8 px-2 rounded bg-white dark:bg-[#383838] border border-[#c4c4c4] dark:border-[#4b4b4b] text-[#222] dark:text-[#e5e5e5] active:scale-95"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </button>

      {SYMBOLS.map((sym) => (
        <button
          key={sym}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsertText(sym === 'Tab' ? '    ' : sym)}
          className="shrink-0 flex items-center justify-center min-w-[34px] h-8 px-2 rounded bg-white dark:bg-[#383838] border border-[#c4c4c4] dark:border-[#4b4b4b] text-xs font-mono font-semibold text-[#1a1a1a] dark:text-[#f0f0f0] active:bg-blue-100 dark:active:bg-blue-900"
        >
          {sym}
        </button>
      ))}

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onFind}
        aria-label="Find"
        className="shrink-0 flex items-center justify-center min-w-[36px] h-8 px-2 rounded bg-white dark:bg-[#383838] border border-[#c4c4c4] dark:border-[#4b4b4b] text-[#222] dark:text-[#e5e5e5] active:scale-95"
      >
        <Search className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSave}
        aria-label="Save"
        className="shrink-0 flex items-center justify-center min-w-[36px] h-8 px-2 rounded bg-white dark:bg-[#383838] border border-[#c4c4c4] dark:border-[#4b4b4b] text-blue-600 dark:text-blue-400 active:scale-95"
      >
        <Save className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
