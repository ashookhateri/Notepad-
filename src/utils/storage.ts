import { EditorDocument, MacroAction, NppPreferences, WorkspaceNode } from '../types/editor';

const DB_NAME = 'notepad_plus_plus_android_db';
const DB_VERSION = 1;
const STORE_SESSION = 'session';

export const DEFAULT_PREFERENCES: NppPreferences = {
  darkMode: false,
  themeId: 'Default',
  fontSize: 14,
  zoomLevel: 0,
  tabSize: 4,
  indentWithSpaces: true,
  wordWrap: false,
  showWhitespace: false,
  showEol: false,
  showIndentGuide: true,
  showLineNumbers: true,
  showDocumentMap: false,
  showFunctionList: false,
  showWorkspace: false,
  showToolbar: true,
  showStatusBar: true,
  showAndroidAccessoryBar: true,
  autoCloseBrackets: true,
  highlightCurrentLine: true,
  rememberSession: true,
  defaultEol: 'CRLF',
  defaultEncoding: 'UTF-8',
};

export interface PersistedSession {
  documents: EditorDocument[];
  activeDocIdPane1: string | null;
  activeDocIdPane2: string | null;
  isSplitView: boolean;
  workspaceNodes: WorkspaceNode[];
  preferences: NppPreferences;
  recordedMacro: MacroAction[];
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SESSION)) {
        db.createObjectStore(STORE_SESSION);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSessionToDB(session: PersistedSession): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSION, 'readwrite');
      const store = tx.objectStore(STORE_SESSION);
      const req = store.put(session, 'current');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    try {
      localStorage.setItem('npp_session_fallback', JSON.stringify(session));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export async function loadSessionFromDB(): Promise<PersistedSession | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<PersistedSession | null>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSION, 'readonly');
      const store = tx.objectStore(STORE_SESSION);
      const req = store.get('current');
      req.onsuccess = () => resolve((req.result as PersistedSession) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result) return result;
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem('npp_session_fallback');
    if (raw) return JSON.parse(raw) as PersistedSession;
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function createInitialWorkspace(): WorkspaceNode[] {
  return [
    {
      id: 'ws-folder-root',
      name: 'Android Projects',
      type: 'folder',
      parentId: null,
      expanded: true,
    },
    {
      id: 'ws-file-readme',
      name: 'readme.txt',
      type: 'file',
      parentId: 'ws-folder-root',
      language: 'plaintext',
      content: `Notepad++ for Android (Windows Classic Edition)
================================================

Welcome to Notepad++!
- Multi-tab MDI with saved (blue floppy) & unsaved (red floppy) indicators
- Full syntax highlighting for 17+ languages
- Find, Replace, Find in Files, and Mark with Normal / Extended / Regex modes
- Bookmarks (tap left gutter margin), Code Folding, Document Map & Function List
- Dual Split View (View -> Move/Clone Current Document)
- Persistent Session Backup (never lose unsaved tabs on reload)
- Supports Persian / Arabic (RTL) & English (LTR) text seamlessly

تایپ فارسی و کدنویسی همزمان با پشتیبانی کامل از UTF-8 و Windows-1256!
`,
    },
    {
      id: 'ws-file-app',
      name: 'server.js',
      type: 'file',
      parentId: 'ws-folder-root',
      language: 'javascript',
      content: `// Sample JavaScript file for Notepad++
import http from 'node:http';

const PORT = 8080;

function formatUptime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return \`\${mins}m \${secs}s\`;
}

class RequestLogger {
  constructor(prefix = 'APP') {
    this.prefix = prefix;
  }

  log(method, url) {
    console.log(\`[\${this.prefix}] \${method} -> \${url}\`);
  }
}

const logger = new RequestLogger('NOTEPAD++');

const server = http.createServer((req, res) => {
  logger.log(req.method, req.url);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', uptime: formatUptime(process.uptime()) }));
});

server.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
`,
    },
    {
      id: 'ws-file-style',
      name: 'index.html',
      type: 'file',
      parentId: 'ws-folder-root',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello Notepad++</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; background: #f8fafc; }
    h1 { color: #166534; }
  </style>
</head>
<body>
  <h1>Notepad++ Live Preview</h1>
  <p>Edit this HTML file and choose <strong>Run &rarr; Preview in Browser</strong>.</p>
</body>
</html>
`,
    },
    {
      id: 'ws-file-script',
      name: 'analyze.py',
      type: 'file',
      parentId: 'ws-folder-root',
      language: 'python',
      content: `import json
from dataclasses import dataclass

@dataclass
class Metrics:
    lines: int
    words: int
    chars: int

def analyze_text(text: str) -> Metrics:
    lines = text.splitlines()
    words = text.split()
    return Metrics(lines=len(lines), words=len(words), chars=len(text))

if __name__ == "__main__":
    sample = "Notepad++ on Android\\nFast, classic, reliable."
    result = analyze_text(sample)
    print(json.dumps(result.__dict__, indent=2))
`,
    },
  ];
}
