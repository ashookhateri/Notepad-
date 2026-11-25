import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { EditorDocument, NppEncoding, NppEol, NppLanguage, NppPreferences } from '../types/editor';
import { NPP_LANGUAGES } from '../utils/languageUtils';

export interface MenuCommandPayload {
  action: string;
  value?: string;
}

interface MenuItemDef {
  id: string;
  label?: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItemDef[];
  action?: string;
  value?: string;
}

interface MenuBarProps {
  activeDoc: EditorDocument;
  preferences: NppPreferences;
  isRecordingMacro: boolean;
  hasMacro: boolean;
  isPostIt: boolean;
  isSplitView: boolean;
  onCommand: (cmd: MenuCommandPayload) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  activeDoc,
  preferences,
  isRecordingMacro,
  hasMacro,
  isPostIt,
  isSplitView,
  onCommand,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const trigger = (action?: string, value?: string) => {
    if (!action) return;
    setOpenMenu(null);
    setOpenSubmenu(null);
    onCommand({ action, value });
  };

  const menus: { key: string; label: string; items: MenuItemDef[] }[] = [
    {
      key: 'File',
      label: 'File',
      items: [
        { id: 'new', label: 'New', shortcut: 'Ctrl+N', action: 'file:new' },
        { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', action: 'file:open' },
        { id: 'openWs', label: 'Open Folder as Workspace...', action: 'view:workspace' },
        { id: 'reload', label: 'Reload from Disk', action: 'file:reload' },
        { id: 'sep1', separator: true },
        { id: 'save', label: 'Save', shortcut: 'Ctrl+S', action: 'file:save', disabled: !activeDoc.isDirty && !activeDoc.isVirtualNew },
        { id: 'saveAs', label: 'Save As...', shortcut: 'Ctrl+Alt+S', action: 'file:saveAs' },
        { id: 'saveAll', label: 'Save All', shortcut: 'Ctrl+Shift+S', action: 'file:saveAll' },
        { id: 'rename', label: 'Rename...', action: 'file:rename' },
        { id: 'sep2', separator: true },
        { id: 'close', label: 'Close', shortcut: 'Ctrl+W', action: 'file:close' },
        { id: 'closeAll', label: 'Close All', action: 'file:closeAll' },
        {
          id: 'closeMore',
          label: 'Close More',
          submenu: [
            { id: 'closeOthers', label: 'Close All but This', action: 'file:closeOthers' },
            { id: 'closeLeft', label: 'Close All to the Left', action: 'file:closeLeft' },
            { id: 'closeRight', label: 'Close All to the Right', action: 'file:closeRight' },
          ],
        },
        { id: 'sep3', separator: true },
        { id: 'print', label: 'Print...', shortcut: 'Ctrl+P', action: 'file:print' },
      ],
    },
    {
      key: 'Edit',
      label: 'Edit',
      items: [
        { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', action: 'edit:undo' },
        { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', action: 'edit:redo' },
        { id: 'sep1', separator: true },
        { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', action: 'edit:cut' },
        { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: 'edit:copy' },
        { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', action: 'edit:paste' },
        { id: 'selectAll', label: 'Select All', shortcut: 'Ctrl+A', action: 'edit:selectAll' },
        { id: 'sep2', separator: true },
        {
          id: 'lineOps',
          label: 'Line Operations',
          submenu: [
            { id: 'dupLine', label: 'Duplicate Current Line', shortcut: 'Ctrl+D', action: 'edit:duplicateLine' },
            { id: 'moveUp', label: 'Move Up Current Line', shortcut: 'Ctrl+Shift+Up', action: 'edit:moveLineUp' },
            { id: 'moveDown', label: 'Move Down Current Line', shortcut: 'Ctrl+Shift+Down', action: 'edit:moveLineDown' },
            { id: 'sepL', separator: true },
            { id: 'sortAsc', label: 'Sort Lines Lexicographically Ascending', action: 'edit:sortAsc' },
            { id: 'sortDesc', label: 'Sort Lines Lexicographically Descending', action: 'edit:sortDesc' },
            { id: 'rmEmpty', label: 'Remove Empty Lines', action: 'edit:removeEmptyLines' },
            { id: 'rmDup', label: 'Remove Duplicate Lines', action: 'edit:removeDuplicateLines' },
          ],
        },
        {
          id: 'convertCase',
          label: 'Convert Case to',
          submenu: [
            { id: 'upper', label: 'UPPERCASE', shortcut: 'Ctrl+Shift+U', action: 'edit:uppercase' },
            { id: 'lower', label: 'lowercase', shortcut: 'Ctrl+U', action: 'edit:lowercase' },
            { id: 'proper', label: 'Proper Case', action: 'edit:propercase' },
            { id: 'sentence', label: 'Sentence case', action: 'edit:sentencecase' },
          ],
        },
        {
          id: 'blankOps',
          label: 'Blank Operations',
          submenu: [
            { id: 'trimTrail', label: 'Trim Trailing Space', action: 'edit:trimTrailing' },
            { id: 'trimLead', label: 'Trim Leading Space', action: 'edit:trimLeading' },
            { id: 'tabToSpace', label: 'TAB to Space', action: 'edit:tabToSpace' },
            { id: 'spaceToTab', label: 'Space to TAB', action: 'edit:spaceToTab' },
          ],
        },
        {
          id: 'eolConv',
          label: 'EOL Conversion',
          submenu: [
            { id: 'eolCrlf', label: 'Windows (CR LF)', checked: activeDoc.eol === 'CRLF', action: 'edit:eol', value: 'CRLF' },
            { id: 'eolLf', label: 'Unix (LF)', checked: activeDoc.eol === 'LF', action: 'edit:eol', value: 'LF' },
            { id: 'eolCr', label: 'Macintosh (CR)', checked: activeDoc.eol === 'CR', action: 'edit:eol', value: 'CR' },
          ],
        },
        { id: 'comment', label: 'Toggle Single Line Comment', shortcut: 'Ctrl+Q', action: 'edit:toggleComment' },
        { id: 'insertDate', label: 'Insert Date/Time (Short)', action: 'edit:insertDate' },
        { id: 'sep3', separator: true },
        { id: 'readOnly', label: 'Set Read-Only', checked: activeDoc.isReadOnly, action: 'edit:toggleReadOnly' },
      ],
    },
    {
      key: 'Search',
      label: 'Search',
      items: [
        { id: 'find', label: 'Find...', shortcut: 'Ctrl+F', action: 'search:find' },
        { id: 'findInFiles', label: 'Find in Files...', shortcut: 'Ctrl+Shift+F', action: 'search:findInFiles' },
        { id: 'findNext', label: 'Find Next', shortcut: 'F3', action: 'search:findNext' },
        { id: 'findPrev', label: 'Find Previous', shortcut: 'Shift+F3', action: 'search:findPrev' },
        { id: 'replace', label: 'Replace...', shortcut: 'Ctrl+H', action: 'search:replace' },
        { id: 'mark', label: 'Mark...', action: 'search:mark' },
        { id: 'clearMarks', label: 'Clear all Marks', action: 'search:clearMarks' },
        { id: 'sep1', separator: true },
        { id: 'goto', label: 'Go to...', shortcut: 'Ctrl+G', action: 'search:goto' },
        { id: 'brace', label: 'Go to Matching Brace', shortcut: 'Ctrl+B', action: 'search:matchingBrace' },
        { id: 'sep2', separator: true },
        {
          id: 'bookmarks',
          label: 'Bookmark',
          submenu: [
            { id: 'bmToggle', label: 'Toggle Bookmark', shortcut: 'Ctrl+F2', action: 'search:toggleBookmark' },
            { id: 'bmNext', label: 'Next Bookmark', shortcut: 'F2', action: 'search:nextBookmark' },
            { id: 'bmPrev', label: 'Previous Bookmark', shortcut: 'Shift+F2', action: 'search:prevBookmark' },
            { id: 'bmClear', label: 'Clear All Bookmarks', action: 'search:clearBookmarks' },
          ],
        },
      ],
    },
    {
      key: 'View',
      label: 'View',
      items: [
        { id: 'fullscreen', label: 'Toggle Full Screen Mode', shortcut: 'F11', action: 'view:fullscreen' },
        { id: 'postit', label: 'Post-It', shortcut: 'F12', checked: isPostIt, action: 'view:postit' },
        { id: 'darkMode', label: 'Dark Mode', checked: preferences.darkMode, action: 'view:darkMode' },
        { id: 'sep1', separator: true },
        {
          id: 'showSymbol',
          label: 'Show Symbol',
          submenu: [
            { id: 'ws', label: 'Show White Space and TAB', checked: preferences.showWhitespace, action: 'view:whitespace' },
            { id: 'eol', label: 'Show End of Line', checked: preferences.showEol, action: 'view:eol' },
            { id: 'allChar', label: 'Show All Characters', checked: preferences.showWhitespace && preferences.showEol, action: 'view:allChars' },
            { id: 'lineNum', label: 'Show Line Number Margin', checked: preferences.showLineNumbers, action: 'view:lineNumbers' },
          ],
        },
        { id: 'wrap', label: 'Word wrap', checked: preferences.wordWrap, action: 'view:wordWrap' },
        {
          id: 'zoom',
          label: 'Zoom',
          submenu: [
            { id: 'zin', label: 'Zoom In', shortcut: 'Ctrl++', action: 'view:zoomIn' },
            { id: 'zout', label: 'Zoom Out', shortcut: 'Ctrl+-', action: 'view:zoomOut' },
            { id: 'zreset', label: 'Restore Default Zoom', shortcut: 'Ctrl+/', action: 'view:zoomReset' },
          ],
        },
        { id: 'sep2', separator: true },
        { id: 'splitView', label: 'Split View (Move/Clone to Other View)', checked: isSplitView, action: 'view:splitView' },
        { id: 'docMap', label: 'Document Map', checked: preferences.showDocumentMap, action: 'view:docMap' },
        { id: 'funcList', label: 'Function List', checked: preferences.showFunctionList, action: 'view:functionList' },
        { id: 'wsPanel', label: 'Folder as Workspace', checked: preferences.showWorkspace, action: 'view:workspace' },
        { id: 'sep3', separator: true },
        { id: 'toolbar', label: 'Show Toolbar', checked: preferences.showToolbar, action: 'view:toolbar' },
        { id: 'statusBar', label: 'Show Status Bar', checked: preferences.showStatusBar, action: 'view:statusBar' },
        { id: 'androidBar', label: 'Android Coding Key Bar', checked: preferences.showAndroidAccessoryBar, action: 'view:accessoryBar' },
        { id: 'summary', label: 'Summary...', action: 'view:summary' },
      ],
    },
    {
      key: 'Encoding',
      label: 'Encoding',
      items: (['ANSI', 'UTF-8', 'UTF-8-BOM', 'UTF-16 LE', 'UTF-16 BE', 'Windows-1256'] as NppEncoding[]).map((enc) => ({
        id: enc,
        label: enc === 'Windows-1256' ? 'Character sets → Arabic / Persian (Windows-1256)' : `Encode in ${enc}`,
        checked: activeDoc.encoding === enc,
        action: 'encoding:set',
        value: enc,
      })),
    },
    {
      key: 'Language',
      label: 'Language',
      items: NPP_LANGUAGES.map((lang) => ({
        id: lang.id,
        label: lang.label,
        checked: activeDoc.language === lang.id,
        action: 'language:set',
        value: lang.id as NppLanguage,
      })),
    },
    {
      key: 'Settings',
      label: 'Settings',
      items: [
        { id: 'prefs', label: 'Preferences...', action: 'settings:preferences' },
        { id: 'styles', label: 'Style Configurator...', action: 'settings:styles' },
      ],
    },
    {
      key: 'Tools',
      label: 'Tools',
      items: [
        { id: 'shaDoc', label: 'SHA-256: Generate from Current Document', action: 'tools:shaDoc' },
        { id: 'shaSel', label: 'SHA-256: Generate from Selection', action: 'tools:shaSel' },
        { id: 'sep1', separator: true },
        { id: 'b64Enc', label: 'Base64 Encode (MIME)', action: 'tools:b64Encode' },
        { id: 'b64Dec', label: 'Base64 Decode (MIME)', action: 'tools:b64Decode' },
        { id: 'urlEnc', label: 'URL Encode', action: 'tools:urlEncode' },
        { id: 'urlDec', label: 'URL Decode', action: 'tools:urlDecode' },
        { id: 'sep2', separator: true },
        { id: 'jsonPretty', label: 'JSON: Pretty Print (Format)', action: 'tools:jsonFormat' },
        { id: 'jsonMin', label: 'JSON: Compress (Minify)', action: 'tools:jsonMinify' },
      ],
    },
    {
      key: 'Macro',
      label: 'Macro',
      items: [
        { id: 'recStart', label: 'Start Recording', disabled: isRecordingMacro, action: 'macro:start' },
        { id: 'recStop', label: 'Stop Recording', disabled: !isRecordingMacro, action: 'macro:stop' },
        { id: 'play', label: 'Playback', shortcut: 'Ctrl+Shift+P', disabled: !hasMacro || isRecordingMacro, action: 'macro:play' },
        { id: 'playMulti', label: 'Run a Macro Multiple Times...', disabled: !hasMacro || isRecordingMacro, action: 'macro:playMulti' },
      ],
    },
    {
      key: 'Run',
      label: 'Run',
      items: [
        { id: 'runTermux', label: 'Run Current File in Termux (F5)', shortcut: 'F5', action: 'termux:run' },
        { id: 'runPy', label: 'Run in Built-in Python 3.12', action: 'python:run' },
        { id: 'openTermux', label: 'Open Termux & Python Console', action: 'termux:console' },
        { id: 'preview', label: 'Preview HTML / Markdown in Panel', action: 'run:preview' },
        { id: 'sep1', separator: true },
        { id: 'gSearch', label: 'Google Search Selection', action: 'run:google' },
        { id: 'wSearch', label: 'Wikipedia Search Selection', action: 'run:wiki' },
      ],
    },
    {
      key: 'Plugins',
      label: 'Plugins',
      items: [
        {
          id: 'termuxSub',
          label: 'Termux Bridge (Android)',
          submenu: [
            { id: 'txConsole', label: 'Open Termux Shell & Setup', action: 'termux:console' },
            { id: 'txConnect', label: 'Test Termux Connection', action: 'termux:connect' },
            { id: 'txRun', label: 'Run Current File in Termux', action: 'termux:run' },
          ],
        },
        {
          id: 'pyScriptSub',
          label: 'Python Script (Built-in)',
          submenu: [
            { id: 'pyInstall', label: 'Install Python 3.12 Runtime (Offline)', action: 'python:install' },
            { id: 'pyConsole', label: 'Show Built-in Python Console', action: 'python:console' },
            { id: 'pyRun', label: 'Run Current Script', action: 'python:run' },
          ],
        },
      ],
    },
    {
      key: 'Help',
      label: '?',
      items: [
        { id: 'shortcuts', label: 'Shortcuts & Android Touch Guide', action: 'help:shortcuts' },
        { id: 'about', label: 'About Notepad++...', shortcut: 'F1', action: 'help:about' },
      ],
    },
  ];

  const currentMenuObj = menus.find((m) => m.key === openMenu);

  return (
    <div
      ref={barRef}
      className="relative z-40 flex items-center bg-[#f0f0f0] dark:bg-[#262626] border-b border-[#d0d0d0] dark:border-[#3c3c3c] text-[#1a1a1a] dark:text-[#e0e0e0] text-xs select-none npp-no-print"
    >
      <div className="flex items-center overflow-x-auto no-scrollbar w-full px-1">
        {menus.map((m) => {
          const isOpen = openMenu === m.key;
          return (
            <div key={m.key} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu(isOpen ? null : m.key);
                  setOpenSubmenu(null);
                }}
                onMouseEnter={() => {
                  if (openMenu && openMenu !== m.key) {
                    setOpenMenu(m.key);
                    setOpenSubmenu(null);
                  }
                }}
                className={`px-2.5 py-1.5 min-h-[30px] sm:min-h-[26px] whitespace-nowrap transition-colors ${
                  isOpen
                    ? 'bg-[#cce8ff] dark:bg-[#3d5a80] text-black dark:text-white'
                    : 'hover:bg-[#e5f3ff] dark:hover:bg-[#353535]'
                }`}
              >
                {m.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Dropdown rendered at bar level so overflow-x-auto never clips it */}
      {currentMenuObj && (
        <div
          className="fixed sm:absolute left-1 sm:left-auto top-[62px] sm:top-full mt-0 min-w-[240px] max-w-[92vw] max-h-[75vh] overflow-y-auto bg-[#f9f9f9] dark:bg-[#2b2b2b] border border-[#b8b8b8] dark:border-[#454545] shadow-xl py-1 z-50"
          style={{
            left:
              typeof window !== 'undefined' && window.innerWidth >= 640
                ? `${Math.min(
                    window.innerWidth - 260,
                    Math.max(4, (menus.findIndex((x) => x.key === currentMenuObj.key) * 52))
                  )}px`
                : '8px',
          }}
        >
          {currentMenuObj.items.map((item) => {
            if (item.separator) {
              return <div key={item.id} className="my-1 border-t border-[#e0e0e0] dark:border-[#3e3e3e]" />;
            }
            const hasSub = !!item.submenu?.length;
            const subOpen = openSubmenu === item.id;
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => hasSub && setOpenSubmenu(item.id)}
              >
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (hasSub) {
                      setOpenSubmenu(subOpen ? null : item.id);
                    } else {
                      trigger(item.action, item.value);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-4 px-3 py-2 sm:py-1.5 text-left text-xs transition-colors ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-[#91c9f7] dark:hover:bg-[#094771] hover:text-black dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="w-3.5 inline-flex items-center justify-center shrink-0">
                      {item.checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                    {item.shortcut && <span>{item.shortcut}</span>}
                    {hasSub && <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {hasSub && subOpen && item.submenu && (
                  <div className="bg-[#f2f2f2] dark:bg-[#232323] border-y border-[#d8d8d8] dark:border-[#3f3f3f] pl-4 py-0.5">
                    {item.submenu.map((sub) =>
                      sub.separator ? (
                        <div key={sub.id} className="my-1 border-t border-[#d8d8d8] dark:border-[#3f3f3f]" />
                      ) : (
                        <button
                          key={sub.id}
                          type="button"
                          disabled={sub.disabled}
                          onClick={() => trigger(sub.action, sub.value)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left text-xs hover:bg-[#91c9f7] dark:hover:bg-[#094771]"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="w-3.5 inline-flex items-center justify-center shrink-0">
                              {sub.checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            </span>
                            <span className="truncate">{sub.label}</span>
                          </span>
                          {sub.shortcut && (
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                              {sub.shortcut}
                            </span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
