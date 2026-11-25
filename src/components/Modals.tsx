import React, { useState } from 'react';
import { X } from 'lucide-react';
import { EditorDocument, NppEncoding, NppEol, NppPreferences, NppThemeId } from '../types/editor';
import { NPP_THEMES } from '../utils/editorThemes';
import { NppLogoIcon } from './NppIcons';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, widthClass = 'max-w-md', children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 npp-no-print">
    <div
      className={`w-full ${widthClass} bg-[#f0f0f0] dark:bg-[#2b2b2b] border border-[#999999] dark:border-[#4b4b4b] shadow-2xl text-xs text-[#1a1a1a] dark:text-[#e0e0e0] max-h-[88vh] flex flex-col`}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#1f1f1f] border-b border-[#d0d0d0] dark:border-[#3c3c3c] shrink-0">
        <span className="font-semibold">{title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 rounded hover:bg-red-500 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const GoToLineModal: React.FC<{
  currentLine: number;
  maxLines: number;
  currentOffset: number;
  maxOffset: number;
  onGoTo: (mode: 'line' | 'offset', value: number) => void;
  onClose: () => void;
}> = ({ currentLine, maxLines, currentOffset, maxOffset, onGoTo, onClose }) => {
  const [mode, setMode] = useState<'line' | 'offset'>('line');
  const [value, setValue] = useState(String(currentLine));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (!Number.isNaN(num)) {
      onGoTo(mode, num);
      onClose();
    }
  };

  return (
    <ModalShell title="Go To..." onClose={onClose} widthClass="max-w-sm">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'line'}
              onChange={() => {
                setMode('line');
                setValue(String(currentLine));
              }}
            />
            <span>Line</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'offset'}
              onChange={() => {
                setMode('offset');
                setValue(String(currentOffset));
              }}
            />
            <span>Offset</span>
          </label>
        </div>

        <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
          {mode === 'line'
            ? `You are here: ${currentLine} (Max: ${maxLines})`
            : `You are here: ${currentOffset} (Max: ${maxOffset})`}
        </div>

        <div className="flex items-center gap-2">
          <label className="shrink-0">You want to go to :</label>
          <input
            autoFocus
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c] outline-none font-mono"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] hover:bg-[#cce8ff] dark:hover:bg-[#094771] font-medium"
          >
            Go
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555]"
          >
            I&apos;m going nowhere
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const PreferencesModal: React.FC<{
  preferences: NppPreferences;
  onChange: (prefs: NppPreferences) => void;
  onClose: () => void;
}> = ({ preferences, onChange, onClose }) => {
  const [section, setSection] = useState<'general' | 'editing' | 'newDoc' | 'dark'>('general');

  return (
    <ModalShell title="Preferences" onClose={onClose} widthClass="max-w-xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-36 shrink-0 border border-[#c8c8c8] dark:border-[#444444] bg-white dark:bg-[#1e1e1e]">
          {[
            { id: 'general', label: 'General' },
            { id: 'editing', label: 'Editing' },
            { id: 'newDoc', label: 'New Document' },
            { id: 'dark', label: 'Dark Mode' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id as typeof section)}
              className={`w-full text-left px-3 py-2 ${
                section === item.id
                  ? 'bg-[#cce8ff] dark:bg-[#094771] font-semibold'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 border border-[#c8c8c8] dark:border-[#444444] p-3 bg-white dark:bg-[#1e1e1e]">
          {section === 'general' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showToolbar}
                  onChange={(e) => onChange({ ...preferences, showToolbar: e.target.checked })}
                />
                <span>Show Toolbar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showStatusBar}
                  onChange={(e) => onChange({ ...preferences, showStatusBar: e.target.checked })}
                />
                <span>Show Status Bar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.rememberSession}
                  onChange={(e) => onChange({ ...preferences, rememberSession: e.target.checked })}
                />
                <span>Remember current session for next launch</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showAndroidAccessoryBar}
                  onChange={(e) => onChange({ ...preferences, showAndroidAccessoryBar: e.target.checked })}
                />
                <span>Show Android Quick Coding Key Bar (on mobile screens)</span>
              </label>
            </div>
          )}

          {section === 'editing' && (
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.showLineNumbers}
                  onChange={(e) => onChange({ ...preferences, showLineNumbers: e.target.checked })}
                />
                <span>Display line number</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.highlightCurrentLine}
                  onChange={(e) => onChange({ ...preferences, highlightCurrentLine: e.target.checked })}
                />
                <span>Enable current line highlighting</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoCloseBrackets}
                  onChange={(e) => onChange({ ...preferences, autoCloseBrackets: e.target.checked })}
                />
                <span>Auto-insert closing brackets & quotes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.wordWrap}
                  onChange={(e) => onChange({ ...preferences, wordWrap: e.target.checked })}
                />
                <span>Enable Word Wrap</span>
              </label>
              <div className="flex items-center gap-3 pt-1">
                <label>Tab size:</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={preferences.tabSize}
                  onChange={(e) =>
                    onChange({ ...preferences, tabSize: Math.max(1, Math.min(16, Number(e.target.value) || 4)) })
                  }
                  className="w-16 px-2 py-1 border border-[#b0b0b0] dark:border-[#4c4c4c] bg-transparent"
                />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.indentWithSpaces}
                    onChange={(e) => onChange({ ...preferences, indentWithSpaces: e.target.checked })}
                  />
                  <span>Replace by space</span>
                </label>
              </div>
            </div>
          )}

          {section === 'newDoc' && (
            <div className="space-y-3">
              <div>
                <div className="font-semibold mb-1">Format (Line ending)</div>
                <div className="flex gap-4">
                  {(['CRLF', 'LF', 'CR'] as NppEol[]).map((eol) => (
                    <label key={eol} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={preferences.defaultEol === eol}
                        onChange={() => onChange({ ...preferences, defaultEol: eol })}
                      />
                      <span>{eol === 'CRLF' ? 'Windows (CR LF)' : eol === 'LF' ? 'Unix (LF)' : 'Macintosh (CR)'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">Encoding</div>
                <select
                  value={preferences.defaultEncoding}
                  onChange={(e) => onChange({ ...preferences, defaultEncoding: e.target.value as NppEncoding })}
                  className="px-2 py-1 border border-[#b0b0b0] dark:border-[#4c4c4c] bg-white dark:bg-[#252526]"
                >
                  <option value="UTF-8">UTF-8</option>
                  <option value="UTF-8-BOM">UTF-8-BOM</option>
                  <option value="ANSI">ANSI</option>
                  <option value="Windows-1256">Windows-1256 (Persian/Arabic)</option>
                </select>
              </div>
            </div>
          )}

          {section === 'dark' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={(e) =>
                    onChange({
                      ...preferences,
                      darkMode: e.target.checked,
                      themeId: e.target.checked ? 'DarkModeDefault' : 'Default',
                    })
                  }
                />
                <span>Enable Dark Mode (Windows Notepad++ v8 Dark Theme)</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] font-medium"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
};

export const StyleConfiguratorModal: React.FC<{
  preferences: NppPreferences;
  onChange: (prefs: NppPreferences) => void;
  onClose: () => void;
}> = ({ preferences, onChange, onClose }) => {
  const themeList = Object.values(NPP_THEMES);

  return (
    <ModalShell title="Style Configurator" onClose={onClose} widthClass="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="font-medium">Select theme :</label>
          <select
            value={preferences.themeId}
            onChange={(e) => {
              const id = e.target.value as NppThemeId;
              const def = NPP_THEMES[id];
              onChange({
                ...preferences,
                themeId: id,
                darkMode: def.isDark,
              });
            }}
            className="flex-1 px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c]"
          >
            {themeList.map((th) => (
              <option key={th.id} value={th.id}>
                {th.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="font-medium">Font size (px) :</label>
          <input
            type="number"
            min={10}
            max={28}
            value={preferences.fontSize}
            onChange={(e) =>
              onChange({
                ...preferences,
                fontSize: Math.max(10, Math.min(28, Number(e.target.value) || 14)),
              })
            }
            className="w-24 px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c] font-mono"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {themeList.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => onChange({ ...preferences, themeId: th.id, darkMode: th.isDark })}
              style={{ backgroundColor: th.bg, color: th.fg }}
              className={`p-2 text-[11px] font-mono border text-left truncate ${
                preferences.themeId === th.id ? 'border-amber-500 ring-2 ring-amber-400' : 'border-neutral-400'
              }`}
            >
              {th.id}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] font-medium"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export const SummaryModal: React.FC<{
  doc: EditorDocument;
  onClose: () => void;
}> = ({ doc, onClose }) => {
  const words = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;
  const charsNoBlanks = doc.content.replace(/\s/g, '').length;
  const lines = doc.content === '' ? 1 : doc.content.split('\n').length;
  const bytes = new Blob([doc.content]).size;

  return (
    <ModalShell title="Summary" onClose={onClose} widthClass="max-w-sm">
      <div className="space-y-2 font-mono text-xs bg-white dark:bg-[#1e1e1e] border border-[#c8c8c8] dark:border-[#444444] p-3">
        <div><span className="font-semibold">Full file path:</span> {doc.path}</div>
        <div><span className="font-semibold">Created:</span> {new Date(doc.lastModified).toLocaleString()}</div>
        <div><span className="font-semibold">Characters (without blanks):</span> {charsNoBlanks.toLocaleString()}</div>
        <div><span className="font-semibold">Words:</span> {words.toLocaleString()}</div>
        <div><span className="font-semibold">Lines:</span> {lines.toLocaleString()}</div>
        <div><span className="font-semibold">Current document length:</span> {doc.content.length.toLocaleString()} ({bytes.toLocaleString()} bytes)</div>
      </div>
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555]"
        >
          OK
        </button>
      </div>
    </ModalShell>
  );
};

export const RenameModal: React.FC<{
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}> = ({ currentName, onRename, onClose }) => {
  const [name, setName] = useState(currentName);
  return (
    <ModalShell title="Rename" onClose={onClose} widthClass="max-w-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onRename(name.trim());
            onClose();
          }
        }}
        className="space-y-3"
      >
        <label className="block">New file name (with extension for auto-highlighting):</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c] outline-none font-mono"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] font-medium"
          >
            OK
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const RunMacroMultiModal: React.FC<{
  onRun: (times: number) => void;
  onClose: () => void;
}> = ({ onRun, onClose }) => {
  const [times, setTimes] = useState(5);
  return (
    <ModalShell title="Run a Macro Multiple Times" onClose={onClose} widthClass="max-w-xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRun(Math.max(1, Math.min(500, times)));
          onClose();
        }}
        className="space-y-3"
      >
        <label className="block">Run times (1 - 500):</label>
        <input
          autoFocus
          type="number"
          min={1}
          max={500}
          value={times}
          onChange={(e) => setTimes(Number(e.target.value) || 1)}
          className="w-full px-2 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#b0b0b0] dark:border-[#4c4c4c]"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 border border-[#adadad]">
            Cancel
          </button>
          <button type="submit" className="px-4 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] font-medium">
            Run
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const PreviewModal: React.FC<{
  doc: EditorDocument;
  onClose: () => void;
}> = ({ doc, onClose }) => (
  <ModalShell title={`Live Preview — ${doc.title}`} onClose={onClose} widthClass="max-w-3xl">
    <div className="h-[65vh] bg-white border border-[#c8c8c8] overflow-hidden">
      {doc.language === 'html' || doc.title.toLowerCase().endsWith('.html') || doc.title.toLowerCase().endsWith('.htm') ? (
        <iframe
          title="HTML Preview"
          sandbox="allow-scripts"
          srcDoc={doc.content}
          className="w-full h-full border-0 bg-white"
        />
      ) : (
        <pre className="p-4 text-sm font-sans whitespace-pre-wrap text-slate-900 overflow-auto h-full">
          {doc.content}
        </pre>
      )}
    </div>
  </ModalShell>
);

export const AboutModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => (
  <ModalShell title="About Notepad++" onClose={onClose} widthClass="max-w-md">
    <div className="flex flex-col items-center text-center space-y-3">
      <NppLogoIcon className="w-16 h-16" />
      <div>
        <h2 className="text-base font-bold">Notepad++ (Android Edition)</h2>
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
          Classic Windows Desktop Interface &amp; Scintilla-Style Code Editor
        </p>
      </div>
      <div className="w-full text-left bg-white dark:bg-[#1e1e1e] border border-[#c8c8c8] dark:border-[#444444] p-3 space-y-1.5 text-[11px]">
        <p><strong>Multi-Document Interface:</strong> Unlimited tabs with blue (saved) and red (unsaved) floppy indicators.</p>
        <p><strong>Android Installable PWA:</strong> Open Chrome menu &rarr; &ldquo;Install app&rdquo; or tap &ldquo;Install App&rdquo; in the title bar to add Notepad++ directly to your Android Home Screen with offline support.</p>
        <p><strong>Session Persistence:</strong> All open tabs and unsaved edits are automatically preserved locally via IndexedDB.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] font-medium"
      >
        OK
      </button>
    </div>
  </ModalShell>
);

export const ShortcutsModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => (
  <ModalShell title="Shortcuts & Android Touch Guide" onClose={onClose} widthClass="max-w-lg">
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-white dark:bg-[#1e1e1e] border border-[#c8c8c8] dark:border-[#444444] p-3">
        <div><strong>Ctrl+N</strong> — New Document</div>
        <div><strong>Ctrl+O</strong> — Open File</div>
        <div><strong>Ctrl+S</strong> — Save File</div>
        <div><strong>Ctrl+W</strong> — Close Tab</div>
        <div><strong>Ctrl+F</strong> — Find</div>
        <div><strong>Ctrl+H</strong> — Replace</div>
        <div><strong>Ctrl+Shift+F</strong> — Find in Files</div>
        <div><strong>Ctrl+G</strong> — Go to Line</div>
        <div><strong>Ctrl+D</strong> — Duplicate Line</div>
        <div><strong>Ctrl+Q</strong> — Toggle Comment</div>
        <div><strong>F2 / Shift+F2</strong> — Next / Prev Bookmark</div>
        <div><strong>F12</strong> — Post-It Distraction Free</div>
      </div>
      <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
        <strong>Android Tip:</strong> Tap the thin bookmark strip left of the line numbers to toggle a blue bookmark dot. Long-press (or right-click) any tab for Close Others / Move to Split View / Rename.
      </p>
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555]"
        >
          Close
        </button>
      </div>
    </div>
  </ModalShell>
);
