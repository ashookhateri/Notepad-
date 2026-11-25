import React from 'react';
import { EditorDocument } from '../types/editor';
import { getLanguageMeta } from '../utils/languageUtils';

interface StatusBarProps {
  doc: EditorDocument;
  isOverwriteMode: boolean;
  isRecordingMacro: boolean;
  onToggleOverwrite: () => void;
  onCycleEol: () => void;
  onOpenGoToLine: () => void;
  onOpenLanguagePicker: () => void;
  onCycleEncoding: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  doc,
  isOverwriteMode,
  isRecordingMacro,
  onToggleOverwrite,
  onCycleEol,
  onOpenGoToLine,
  onOpenLanguagePicker,
  onCycleEncoding,
}) => {
  const langMeta = getLanguageMeta(doc.language);
  const lineCount = doc.content === '' ? 1 : doc.content.split('\n').length;
  const charLength = doc.content.length;

  const eolText =
    doc.eol === 'CRLF' ? 'Windows (CR LF)' : doc.eol === 'LF' ? 'Unix (LF)' : 'Macintosh (CR)';

  return (
    <footer className="flex items-center justify-between bg-[#f0f0f0] dark:bg-[#252526] border-t border-[#c8c8c8] dark:border-[#3c3c3c] text-[#222222] dark:text-[#cccccc] text-[11px] leading-none h-6 px-1 overflow-x-auto no-scrollbar select-none pb-safe npp-no-print">
      {/* Left: File Type & Recording indicator */}
      <div className="flex items-center h-full shrink-0">
        <button
          type="button"
          onClick={onOpenLanguagePicker}
          title="Click to change Syntax Language"
          className="px-2 h-full flex items-center hover:bg-[#e0e0e0] dark:hover:bg-[#353535] border-r border-[#d4d4d4] dark:border-[#3c3c3c] whitespace-nowrap"
        >
          {langMeta.statusLabel}
        </button>

        {isRecordingMacro && (
          <span className="px-2 h-full flex items-center bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold border-r border-[#d4d4d4] dark:border-[#3c3c3c] whitespace-nowrap">
            REC
          </span>
        )}
      </div>

      {/* Right: Metrics segments matching Windows Notepad++ */}
      <div className="flex items-center h-full shrink-0 tabular-nums">
        <div className="px-2.5 h-full flex items-center border-l border-[#d4d4d4] dark:border-[#3c3c3c] whitespace-nowrap">
          length : {charLength.toLocaleString()} &nbsp;&nbsp; lines : {lineCount.toLocaleString()}
        </div>

        <button
          type="button"
          onClick={onOpenGoToLine}
          title="Click to Go To Line (Ctrl+G)"
          className="px-2.5 h-full flex items-center border-l border-[#d4d4d4] dark:border-[#3c3c3c] hover:bg-[#e0e0e0] dark:hover:bg-[#353535] whitespace-nowrap"
        >
          Ln : {doc.cursorLine} &nbsp; Col : {doc.cursorCol} &nbsp;{' '}
          {doc.selectionLength > 0
            ? `Sel : ${doc.selectionLength} | ${doc.selectionLines}`
            : `Pos : ${doc.cursorPos}`}
        </button>

        <button
          type="button"
          onClick={onCycleEol}
          title="Click to convert Line Endings (CRLF / LF / CR)"
          className="px-2.5 h-full flex items-center border-l border-[#d4d4d4] dark:border-[#3c3c3c] hover:bg-[#e0e0e0] dark:hover:bg-[#353535] whitespace-nowrap"
        >
          {eolText}
        </button>

        <button
          type="button"
          onClick={onCycleEncoding}
          title="Click to cycle Encoding"
          className="px-2.5 h-full flex items-center border-l border-[#d4d4d4] dark:border-[#3c3c3c] hover:bg-[#e0e0e0] dark:hover:bg-[#353535] whitespace-nowrap"
        >
          {doc.encoding}
        </button>

        <button
          type="button"
          onClick={onToggleOverwrite}
          title="Toggle Insert / Overwrite Mode"
          className="px-2.5 h-full flex items-center border-l border-[#d4d4d4] dark:border-[#3c3c3c] hover:bg-[#e0e0e0] dark:hover:bg-[#353535] font-semibold w-10 justify-center whitespace-nowrap"
        >
          {isOverwriteMode ? 'OVR' : 'INS'}
        </button>
      </div>
    </footer>
  );
};
