import React from 'react';
import {
  FilePlus2,
  FolderOpen,
  Save,
  SaveAll,
  X,
  Printer,
  Scissors,
  Copy,
  ClipboardPaste,
  Undo2,
  Redo2,
  Search,
  Replace,
  ZoomIn,
  ZoomOut,
  WrapText,
  Pilcrow,
  Map,
  FunctionSquare,
  FolderTree,
  Columns2,
  CircleDot,
  Play,
  Moon,
  Sun,
  Terminal,
} from 'lucide-react';
import { EditorDocument, NppPreferences } from '../types/editor';
import { MenuCommandPayload } from './MenuBar';

interface ToolbarProps {
  activeDoc: EditorDocument;
  preferences: NppPreferences;
  isRecordingMacro: boolean;
  hasMacro: boolean;
  isSplitView: boolean;
  onCommand: (cmd: MenuCommandPayload) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeDoc,
  preferences,
  isRecordingMacro,
  hasMacro,
  isSplitView,
  onCommand,
}) => {
  const btn = (
    title: string,
    action: string,
    icon: React.ReactNode,
    active = false,
    disabled = false,
    tintClass = ''
  ) => (
    <button
      key={action + title}
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={() => onCommand({ action })}
      className={`shrink-0 flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-[3px] border transition-colors ${
        disabled
          ? 'opacity-35 cursor-not-allowed border-transparent'
          : active
          ? 'bg-[#cce8ff] dark:bg-[#094771] border-[#99d1ff] dark:border-[#1f6feb] text-blue-800 dark:text-blue-200'
          : 'border-transparent hover:bg-[#e5f3ff] dark:hover:bg-[#3a3a3a] hover:border-[#b8d8f5] dark:hover:border-[#505050]'
      } ${tintClass}`}
    >
      {icon}
    </button>
  );

  const sep = (key: string) => (
    <div key={key} className="w-[1px] h-5 bg-[#d0d0d0] dark:bg-[#444444] mx-1 shrink-0" />
  );

  const iconCls = 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f5f5f5] dark:bg-[#2d2d2d] border-b border-[#d0d0d0] dark:border-[#3c3c3c] text-[#333333] dark:text-[#d4d4d4] overflow-x-auto no-scrollbar select-none npp-no-print">
      {btn('New (Ctrl+N)', 'file:new', <FilePlus2 className={`${iconCls} text-emerald-600 dark:text-emerald-400`} />)}
      {btn('Open (Ctrl+O)', 'file:open', <FolderOpen className={`${iconCls} text-amber-600 dark:text-amber-400`} />)}
      {btn(
        'Save (Ctrl+S)',
        'file:save',
        <Save className={`${iconCls} ${activeDoc.isDirty ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />,
        false,
        !activeDoc.isDirty && !activeDoc.isVirtualNew
      )}
      {btn('Save All', 'file:saveAll', <SaveAll className={`${iconCls} text-blue-600 dark:text-blue-400`} />)}
      {btn('Close (Ctrl+W)', 'file:close', <X className={`${iconCls} text-rose-600 dark:text-rose-400`} />)}
      {btn('Print (Ctrl+P)', 'file:print', <Printer className={iconCls} />)}

      {sep('s1')}
      {btn('Cut (Ctrl+X)', 'edit:cut', <Scissors className={iconCls} />)}
      {btn('Copy (Ctrl+C)', 'edit:copy', <Copy className={iconCls} />)}
      {btn('Paste (Ctrl+V)', 'edit:paste', <ClipboardPaste className={iconCls} />)}

      {sep('s2')}
      {btn('Undo (Ctrl+Z)', 'edit:undo', <Undo2 className={`${iconCls} text-sky-600 dark:text-sky-400`} />)}
      {btn('Redo (Ctrl+Y)', 'edit:redo', <Redo2 className={`${iconCls} text-sky-600 dark:text-sky-400`} />)}

      {sep('s3')}
      {btn('Find (Ctrl+F)', 'search:find', <Search className={`${iconCls} text-indigo-600 dark:text-indigo-400`} />)}
      {btn('Replace (Ctrl+H)', 'search:replace', <Replace className={`${iconCls} text-indigo-600 dark:text-indigo-400`} />)}

      {sep('s4')}
      {btn('Zoom In', 'view:zoomIn', <ZoomIn className={iconCls} />)}
      {btn('Zoom Out', 'view:zoomOut', <ZoomOut className={iconCls} />)}
      {btn('Word Wrap', 'view:wordWrap', <WrapText className={iconCls} />, preferences.wordWrap)}
      {btn('Show All Characters', 'view:allChars', <Pilcrow className={iconCls} />, preferences.showWhitespace && preferences.showEol)}

      {sep('s5')}
      {btn('Folder as Workspace', 'view:workspace', <FolderTree className={iconCls} />, preferences.showWorkspace)}
      {btn('Document Map', 'view:docMap', <Map className={iconCls} />, preferences.showDocumentMap)}
      {btn('Function List', 'view:functionList', <FunctionSquare className={iconCls} />, preferences.showFunctionList)}
      {btn('Split View', 'view:splitView', <Columns2 className={iconCls} />, isSplitView)}

      {sep('s6')}
      {btn(
        isRecordingMacro ? 'Stop Recording Macro' : 'Start Recording Macro',
        isRecordingMacro ? 'macro:stop' : 'macro:start',
        <CircleDot className={`${iconCls} ${isRecordingMacro ? 'text-red-600' : 'text-red-500'}`} />,
        isRecordingMacro
      )}
      {btn(
        'Playback Macro',
        'macro:play',
        <Play className={`${iconCls} text-emerald-600 dark:text-emerald-400`} />,
        false,
        !hasMacro || isRecordingMacro
      )}

      {sep('s7')}
      {btn('Termux & Python Console', 'termux:console', <Terminal className={`${iconCls} text-lime-700 dark:text-lime-400`} />)}
      {btn('Run in Termux / Python (F5)', 'termux:run', <Play className={`${iconCls} text-green-700 dark:text-green-400`} />)}
      {btn(
        preferences.darkMode ? 'Switch to Classic Light Mode' : 'Switch to Notepad++ Dark Mode',
        'view:darkMode',
        preferences.darkMode ? <Sun className={`${iconCls} text-amber-400`} /> : <Moon className={iconCls} />,
        preferences.darkMode
      )}
    </div>
  );
};
