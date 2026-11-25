export type NppLanguage =
  | 'plaintext'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'json'
  | 'python'
  | 'xml'
  | 'markdown'
  | 'sql'
  | 'cpp'
  | 'c'
  | 'java'
  | 'php'
  | 'bash'
  | 'ini'
  | 'yaml';

export type NppEol = 'CRLF' | 'LF' | 'CR';

export type NppEncoding = 'UTF-8' | 'UTF-8-BOM' | 'ANSI' | 'UTF-16 LE' | 'UTF-16 BE' | 'Windows-1256';

export type NppThemeId =
  | 'Default'
  | 'DarkModeDefault'
  | 'Obsidian'
  | 'Monokai'
  | 'SolarizedLight'
  | 'Zenburn'
  | 'Twilight'
  | 'Cobalt';

export interface EditorDocument {
  id: string;
  title: string;
  path: string;
  content: string;
  savedContent: string;
  language: NppLanguage;
  eol: NppEol;
  encoding: NppEncoding;
  isDirty: boolean;
  isReadOnly: boolean;
  viewPane: 1 | 2;
  cursorLine: number;
  cursorCol: number;
  cursorPos: number;
  selectionLength: number;
  selectionLines: number;
  bookmarks: number[]; // 1-indexed line numbers
  marks: string[]; // marked search terms
  lastModified: number;
  isVirtualNew?: boolean;
}

export interface WorkspaceNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: NppLanguage;
  expanded?: boolean;
}

export interface SearchOptions {
  query: string;
  replaceWith: string;
  mode: 'normal' | 'extended' | 'regex';
  matchCase: boolean;
  wholeWord: boolean;
  wrapAround: boolean;
  inSelection: boolean;
}

export interface SearchHit {
  docId: string;
  docTitle: string;
  docPath: string;
  line: number;
  col: number;
  from: number;
  to: number;
  lineText: string;
  matchText: string;
}

export interface NppPreferences {
  darkMode: boolean;
  themeId: NppThemeId;
  fontSize: number; // base px, e.g., 14
  zoomLevel: number; // -5 to +10
  tabSize: number;
  indentWithSpaces: boolean;
  wordWrap: boolean;
  showWhitespace: boolean;
  showEol: boolean;
  showIndentGuide: boolean;
  showLineNumbers: boolean;
  showDocumentMap: boolean;
  showFunctionList: boolean;
  showWorkspace: boolean;
  showToolbar: boolean;
  showStatusBar: boolean;
  showAndroidAccessoryBar: boolean;
  autoCloseBrackets: boolean;
  highlightCurrentLine: boolean;
  rememberSession: boolean;
  defaultEol: NppEol;
  defaultEncoding: NppEncoding;
}

export interface MacroAction {
  type: 'insert' | 'delete' | 'command';
  text?: string;
  command?: string;
}
