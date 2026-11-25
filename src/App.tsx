import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeEditorHandle, CodeEditorPane } from './components/CodeEditorPane';
import { MenuBar, MenuCommandPayload } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { TabBar } from './components/TabBar';
import { FolderWorkspace } from './components/FolderWorkspace';
import { DocumentMap } from './components/DocumentMap';
import { FunctionList } from './components/FunctionList';
import { SearchResultsPanel } from './components/SearchResultsPanel';
import { ConsoleEngineMode, ConsoleEntry, TerminalPanel } from './components/TerminalPanel';
import { StatusBar } from './components/StatusBar';
import { AndroidAccessoryBar } from './components/AndroidAccessoryBar';
import { FindDialogTab, FindReplaceDialog } from './components/FindReplaceDialog';
import {
  AboutModal,
  GoToLineModal,
  PreferencesModal,
  PreviewModal,
  RenameModal,
  RunMacroMultiModal,
  ShortcutsModal,
  StyleConfiguratorModal,
  SummaryModal,
} from './components/Modals';
import { NppLogoIcon } from './components/NppIcons';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/usePWAInstall';
import {
  EditorDocument,
  MacroAction,
  NppEncoding,
  NppEol,
  NppLanguage,
  NppPreferences,
  SearchHit,
  SearchOptions,
  WorkspaceNode,
} from './types/editor';
import {
  compileSearchRegex,
  computeSHA256,
  decodeBase64Unicode,
  detectLanguageFromFilename,
  encodeBase64Unicode,
  findMatchesInDocument,
  toProperCase,
  toSentenceCase,
} from './utils/languageUtils';
import {
  createInitialWorkspace,
  DEFAULT_PREFERENCES,
  loadSessionFromDB,
  saveSessionToDB,
} from './utils/storage';
import {
  installAndInitPython,
  installPythonPackage,
  isPythonPreviouslyInstalled,
  PythonStatus,
  runPythonCode,
} from './utils/pythonRuntime';
import {
  checkTermuxHealth,
  DEFAULT_TERMUX_CONFIG,
  execTermuxCommand,
  listTermuxFiles,
  readTermuxFile,
  runFileInTermux,
  TermuxConfig,
  TermuxFileItem,
  writeTermuxFile,
} from './utils/termuxBridge';

function makeNewDocument(index: number, prefs: NppPreferences, pane: 1 | 2 = 1): EditorDocument {
  const title = `new ${index}`;
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    path: title,
    content: '',
    savedContent: '',
    language: 'plaintext',
    eol: prefs.defaultEol,
    encoding: prefs.defaultEncoding,
    isDirty: false,
    isReadOnly: false,
    viewPane: pane,
    cursorLine: 1,
    cursorCol: 1,
    cursorPos: 0,
    selectionLength: 0,
    selectionLines: 0,
    bookmarks: [],
    marks: [],
    lastModified: Date.now(),
    isVirtualNew: true,
  };
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState<NppPreferences>(DEFAULT_PREFERENCES);
  const [documents, setDocuments] = useState<EditorDocument[]>(() => [makeNewDocument(1, DEFAULT_PREFERENCES, 1)]);
  const [activeDocIdPane1, setActiveDocIdPane1] = useState<string | null>(null);
  const [activeDocIdPane2, setActiveDocIdPane2] = useState<string | null>(null);
  const [focusedPane, setFocusedPane] = useState<1 | 2>(1);
  const [isSplitView, setIsSplitView] = useState(false);
  const [workspaceNodes, setWorkspaceNodes] = useState<WorkspaceNode[]>(() => createInitialWorkspace());

  const [isOverwriteMode, setIsOverwriteMode] = useState(false);
  const [isPostIt, setIsPostIt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Macro state
  const [isRecordingMacro, setIsRecordingMacro] = useState(false);
  const [recordedMacro, setRecordedMacro] = useState<MacroAction[]>([]);

  // Find / Replace / Search Results state
  const [findOpen, setFindOpen] = useState(false);
  const [findTab, setFindTab] = useState<FindDialogTab>('find');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    replaceWith: '',
    mode: 'normal',
    matchCase: false,
    wholeWord: false,
    wrapAround: true,
    inSelection: false,
  });
  const [findStatus, setFindStatus] = useState('');
  const [searchResults, setSearchResults] = useState<{ query: string; hits: SearchHit[] } | null>(null);

  // Modals
  const [showGoTo, setShowGoTo] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [renameDocId, setRenameDocId] = useState<string | null>(null);
  const [showMacroMulti, setShowMacroMulti] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Python & Termux Console state
  const [showPythonConsole, setShowPythonConsole] = useState(false);
  const [consoleMode, setConsoleMode] = useState<ConsoleEngineMode>('termux');
  const [pythonStatus, setPythonStatus] = useState<PythonStatus>(() =>
    isPythonPreviouslyInstalled() ? 'ready' : 'not_installed'
  );
  const [pythonLogs, setPythonLogs] = useState<ConsoleEntry[]>([]);
  const [pythonStdin, setPythonStdin] = useState('');
  const logIdRef = useRef(1);

  // Termux Bridge state
  const [termuxConfig, setTermuxConfig] = useState<TermuxConfig>(() => {
    try {
      const saved = localStorage.getItem('npp_termux_config');
      return saved ? { ...DEFAULT_TERMUX_CONFIG, ...JSON.parse(saved) } : DEFAULT_TERMUX_CONFIG;
    } catch {
      return DEFAULT_TERMUX_CONFIG;
    }
  });
  const [termuxConnected, setTermuxConnected] = useState(false);
  const [termuxChecking, setTermuxChecking] = useState(false);
  const [termuxFiles, setTermuxFiles] = useState<TermuxFileItem[] | null>(null);
  const [termuxBrowseDir, setTermuxBrowseDir] = useState('~');

  useEffect(() => {
    try {
      localStorage.setItem('npp_termux_config', JSON.stringify(termuxConfig));
    } catch {
      // ignore
    }
  }, [termuxConfig]);

  // Scroll tracking for Document Map
  const [scrollState, setScrollState] = useState<{ top: number; visible: number }>({ top: 0, visible: 1 });

  // Editor refs
  const pane1EditorRef = useRef<CodeEditorHandle>(null);
  const pane2EditorRef = useRef<CodeEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileHandlesRef = useRef<Map<string, FileSystemFileHandle>>(new Map());
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const appendPythonLog = useCallback((text: string, kind: 'info' | 'stdout' | 'stderr' = 'stdout') => {
    setPythonLogs((prev) => [...prev.slice(-400), { id: logIdRef.current++, text, kind }]);
  }, []);

  const handleTestTermuxConnection = useCallback(async () => {
    setShowPythonConsole(true);
    setConsoleMode('termux');
    setTermuxChecking(true);
    const res = await checkTermuxHealth(termuxConfig);
    setTermuxChecking(false);
    if (res.ok) {
      setTermuxConnected(true);
      appendPythonLog(`Connected to Termux Bridge (HOME: ${res.home || '~'})`, 'info');
      showToast('Termux Connected');
    } else {
      setTermuxConnected(false);
      appendPythonLog(
        `Termux not reachable at ${termuxConfig.baseUrl}. Open "Termux Setup" above and run the bridge command inside Termux.`,
        'stderr'
      );
    }
  }, [termuxConfig, appendPythonLog, showToast]);

  const handleRunTermuxShell = useCallback(
    async (cmd: string) => {
      setShowPythonConsole(true);
      setConsoleMode('termux');
      appendPythonLog(`$ ${cmd}`, 'info');
      try {
        const res = await execTermuxCommand(termuxConfig, cmd, pythonStdin);
        setTermuxConnected(true);
        if (res.stdout) appendPythonLog(res.stdout.trimEnd(), 'stdout');
        if (res.stderr) appendPythonLog(res.stderr.trimEnd(), 'stderr');
        if (!res.stdout && !res.stderr) {
          appendPythonLog(`(exited with code ${res.exitCode})`, 'info');
        }
      } catch {
        setTermuxConnected(false);
        appendPythonLog(
          'Cannot connect to Termux Bridge. Tap "Termux Setup" and run the command inside Termux first.',
          'stderr'
        );
      }
    },
    [termuxConfig, pythonStdin, appendPythonLog]
  );

  const handleBrowseTermuxDir = useCallback(
    async (dir: string) => {
      try {
        const res = await listTermuxFiles(termuxConfig, dir);
        if (res.error) {
          appendPythonLog(res.error, 'stderr');
          return;
        }
        setTermuxConnected(true);
        setTermuxBrowseDir(res.dir);
        setTermuxFiles(res.items);
      } catch {
        setTermuxConnected(false);
        appendPythonLog('Connect Termux Bridge first to browse Termux files.', 'stderr');
      }
    },
    [termuxConfig, appendPythonLog]
  );

  const handleOpenTermuxFile = useCallback(
    async (filePath: string) => {
      try {
        const res = await readTermuxFile(termuxConfig, filePath);
        if (res.error) {
          appendPythonLog(res.error, 'stderr');
          return;
        }
        const name = filePath.split('/').pop() || 'termux_file';
        const lang = detectLanguageFromFilename(name);
        const existing = documents.find((d) => d.path === filePath);
        if (existing) {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === existing.id
                ? { ...d, content: res.content, savedContent: res.content, isDirty: false }
                : d
            )
          );
          setActiveDocIdPane1(existing.id);
          return;
        }
        const newDoc: EditorDocument = {
          id: `doc-tx-${Date.now()}`,
          title: name,
          path: filePath,
          content: res.content,
          savedContent: res.content,
          language: lang,
          eol: 'LF',
          encoding: 'UTF-8',
          isDirty: false,
          isReadOnly: false,
          viewPane: 1,
          cursorLine: 1,
          cursorCol: 1,
          cursorPos: 0,
          selectionLength: 0,
          selectionLines: 0,
          bookmarks: [],
          marks: [],
          lastModified: Date.now(),
        };
        setDocuments((prev) => [...prev, newDoc]);
        setActiveDocIdPane1(newDoc.id);
        showToast(`Opened ${name} from Termux`);
      } catch {
        appendPythonLog('Failed to read file from Termux.', 'stderr');
      }
    },
    [termuxConfig, documents, appendPythonLog, showToast]
  );

  const handleInstallPython = useCallback(async () => {
    setShowPythonConsole(true);
    setConsoleMode('pyodide');
    setPythonStatus('installing');
    try {
      await installAndInitPython(appendPythonLog);
      setPythonStatus('ready');
      showToast('Python 3.12 installed');
    } catch (err) {
      setPythonStatus('error');
      appendPythonLog(String(err), 'stderr');
    }
  }, [appendPythonLog, showToast]);

  const handleRunPythonScript = useCallback(
    async (code: string, label?: string) => {
      setShowPythonConsole(true);
      setConsoleMode('pyodide');
      if (pythonStatus !== 'ready') setPythonStatus('installing');
      if (label) appendPythonLog(`--- Running ${label} (Built-in Python) ---`, 'info');
      try {
        await runPythonCode(code, pythonStdin, appendPythonLog);
        setPythonStatus('ready');
      } catch (err) {
        setPythonStatus('ready');
        appendPythonLog(err instanceof Error ? err.message : String(err), 'stderr');
      }
    },
    [appendPythonLog, pythonStdin, pythonStatus]
  );

  const handleInstallPythonPkg = useCallback(
    async (pkg: string) => {
      setShowPythonConsole(true);
      setConsoleMode('pyodide');
      if (pythonStatus !== 'ready') setPythonStatus('installing');
      try {
        await installPythonPackage(pkg, appendPythonLog);
        setPythonStatus('ready');
        showToast(`Installed ${pkg}`);
      } catch (err) {
        setPythonStatus('ready');
        appendPythonLog(err instanceof Error ? err.message : String(err), 'stderr');
      }
    },
    [appendPythonLog, pythonStatus, showToast]
  );

  // Hydrate persisted session from IndexedDB
  useEffect(() => {
    let mounted = true;
    loadSessionFromDB().then((session) => {
      if (!mounted) return;
      if (session && session.preferences?.rememberSession !== false && session.documents?.length > 0) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...session.preferences });
        setDocuments(session.documents);
        setActiveDocIdPane1(session.activeDocIdPane1 || session.documents[0].id);
        setActiveDocIdPane2(session.activeDocIdPane2 || null);
        setIsSplitView(!!session.isSplitView);
        if (session.workspaceNodes?.length) setWorkspaceNodes(session.workspaceNodes);
        if (session.recordedMacro?.length) setRecordedMacro(session.recordedMacro);
      } else {
        setDocuments((prev) => {
          setActiveDocIdPane1(prev[0]?.id || null);
          return prev;
        });
      }
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save session to IndexedDB (debounced)
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      if (preferences.rememberSession) {
        saveSessionToDB({
          documents,
          activeDocIdPane1,
          activeDocIdPane2,
          isSplitView,
          workspaceNodes,
          preferences,
          recordedMacro,
        });
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    hydrated,
    documents,
    activeDocIdPane1,
    activeDocIdPane2,
    isSplitView,
    workspaceNodes,
    preferences,
    recordedMacro,
  ]);

  // Apply Dark Mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', preferences.darkMode ? '#262626' : '#f0f0f0');
    }
  }, [preferences.darkMode]);

  const pane1Docs = useMemo(() => documents.filter((d) => d.viewPane === 1), [documents]);
  const pane2Docs = useMemo(() => documents.filter((d) => d.viewPane === 2), [documents]);

  const activeDocPane1 = useMemo(
    () => pane1Docs.find((d) => d.id === activeDocIdPane1) || pane1Docs[0] || documents[0],
    [pane1Docs, activeDocIdPane1, documents]
  );

  const activeDocPane2 = useMemo(
    () => pane2Docs.find((d) => d.id === activeDocIdPane2) || pane2Docs[0] || null,
    [pane2Docs, activeDocIdPane2]
  );

  const activeDoc = useMemo(() => {
    if (isSplitView && focusedPane === 2 && activeDocPane2) return activeDocPane2;
    return activeDocPane1;
  }, [isSplitView, focusedPane, activeDocPane1, activeDocPane2]);

  const getActiveEditor = useCallback((): CodeEditorHandle | null => {
    if (isSplitView && focusedPane === 2 && pane2EditorRef.current) {
      return pane2EditorRef.current;
    }
    return pane1EditorRef.current;
  }, [isSplitView, focusedPane]);

  // Document creation & management
  const createNewDoc = useCallback(
    (pane: 1 | 2 = focusedPane) => {
      const existingNums = documents
        .map((d) => {
          const m = d.title.match(/^new (\d+)$/);
          return m ? Number(m[1]) : 0;
        })
        .filter((n) => n > 0);
      let nextNum = 1;
      while (existingNums.includes(nextNum)) nextNum++;
      const newDoc = makeNewDocument(nextNum, preferences, pane);
      setDocuments((prev) => [...prev, newDoc]);
      if (pane === 2 && isSplitView) {
        setActiveDocIdPane2(newDoc.id);
        setFocusedPane(2);
      } else {
        setActiveDocIdPane1(newDoc.id);
        setFocusedPane(1);
      }
    },
    [documents, preferences, focusedPane, isSplitView]
  );

  const openFilesFromList = useCallback(
    async (files: File[], handles?: FileSystemFileHandle[]) => {
      if (!files.length) return;
      const newDocs: EditorDocument[] = [];
      let lastId: string | null = null;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawText = await file.text();
        const hasCrlf = rawText.includes('\r\n');
        const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lang = detectLanguageFromFilename(file.name);
        const existing = documents.find((d) => d.path === file.name && !d.isVirtualNew);

        if (existing) {
          lastId = existing.id;
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === existing.id
                ? {
                    ...d,
                    content: normalized,
                    savedContent: normalized,
                    isDirty: false,
                    lastModified: file.lastModified || Date.now(),
                  }
                : d
            )
          );
          if (handles?.[i]) fileHandlesRef.current.set(existing.id, handles[i]);
        } else {
          const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`;
          if (handles?.[i]) fileHandlesRef.current.set(id, handles[i]);
          newDocs.push({
            id,
            title: file.name,
            path: file.name,
            content: normalized,
            savedContent: normalized,
            language: lang,
            eol: hasCrlf ? 'CRLF' : 'LF',
            encoding: 'UTF-8',
            isDirty: false,
            isReadOnly: false,
            viewPane: focusedPane === 2 && isSplitView ? 2 : 1,
            cursorLine: 1,
            cursorCol: 1,
            cursorPos: 0,
            selectionLength: 0,
            selectionLines: 0,
            bookmarks: [],
            marks: [],
            lastModified: file.lastModified || Date.now(),
            isVirtualNew: false,
          });
          lastId = id;
        }
      }

      if (newDocs.length > 0) {
        setDocuments((prev) => {
          // If only 1 untouched virtual "new 1" exists, replace it cleanly like Windows Notepad++
          if (
            prev.length === 1 &&
            prev[0].isVirtualNew &&
            !prev[0].isDirty &&
            prev[0].content === ''
          ) {
            return newDocs;
          }
          return [...prev, ...newDocs];
        });
      }

      if (lastId) {
        if (focusedPane === 2 && isSplitView) setActiveDocIdPane2(lastId);
        else setActiveDocIdPane1(lastId);
      }
      showToast(`Opened ${files.length} file${files.length > 1 ? 's' : ''}`);
    },
    [documents, focusedPane, isSplitView, showToast]
  );

  const handleOpenFilePicker = useCallback(async () => {
    const win = window as unknown as {
      showOpenFilePicker?: (opts?: unknown) => Promise<FileSystemFileHandle[]>;
    };
    if (win.showOpenFilePicker) {
      try {
        const handles = await win.showOpenFilePicker({ multiple: true });
        const files = await Promise.all(handles.map((h) => h.getFile()));
        await openFilesFromList(files, handles);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    fileInputRef.current?.click();
  }, [openFilesFromList]);

  const formatContentWithEol = (content: string, eol: NppEol) => {
    if (eol === 'CRLF') return content.replace(/\n/g, '\r\n');
    if (eol === 'CR') return content.replace(/\n/g, '\r');
    return content;
  };

  const triggerDownloadSave = (filename: string, content: string, eol: NppEol) => {
    const payload = formatContentWithEol(content, eol);
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveDocument = useCallback(
    async (doc: EditorDocument, forceSaveAs = false) => {
      // If opened directly from Termux filesystem, save back via Termux Bridge!
      if (!forceSaveAs && doc.path.startsWith('/')) {
        try {
          const res = await writeTermuxFile(termuxConfig, doc.path, formatContentWithEol(doc.content, doc.eol));
          if (res.ok) {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id
                  ? { ...d, savedContent: d.content, isDirty: false, lastModified: Date.now() }
                  : d
              )
            );
            showToast(`Saved to Termux: ${doc.path}`);
            return;
          }
        } catch {
          // fallback to local save
        }
      }

      const win = window as unknown as {
        showSaveFilePicker?: (opts?: unknown) => Promise<FileSystemFileHandle>;
      };

      let handle = forceSaveAs ? undefined : fileHandlesRef.current.get(doc.id);
      let newTitle = doc.title;

      if (!handle && (forceSaveAs || doc.isVirtualNew) && win.showSaveFilePicker) {
        try {
          handle = await win.showSaveFilePicker({
            suggestedName: doc.isVirtualNew ? `${doc.title.replace(/\s+/g, '_')}.txt` : doc.title,
          });
          fileHandlesRef.current.set(doc.id, handle);
          newTitle = handle.name;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }

      if (handle) {
        try {
          const writable = await handle.createWritable();
          await writable.write(formatContentWithEol(doc.content, doc.eol));
          await writable.close();
          const detected = detectLanguageFromFilename(newTitle);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id
                ? {
                    ...d,
                    title: newTitle,
                    path: newTitle,
                    language: d.isVirtualNew ? detected : d.language,
                    savedContent: d.content,
                    isDirty: false,
                    isVirtualNew: false,
                    lastModified: Date.now(),
                  }
                : d
            )
          );
          showToast(`Saved "${newTitle}"`);
          return;
        } catch {
          // Fallback to download
        }
      }

      // Download fallback for mobile browsers without writable file picker
      const downloadName = doc.isVirtualNew && !doc.title.includes('.') ? `${doc.title.replace(/\s+/g, '_')}.txt` : doc.title;
      triggerDownloadSave(downloadName, doc.content, doc.eol);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                title: downloadName,
                path: downloadName,
                savedContent: d.content,
                isDirty: false,
                isVirtualNew: false,
                lastModified: Date.now(),
              }
            : d
        )
      );
      showToast(`Saved "${downloadName}"`);
    },
    [showToast, termuxConfig]
  );

  const closeDocument = useCallback(
    (docId: string) => {
      setDocuments((prev) => {
        const remaining = prev.filter((d) => d.id !== docId);
        if (remaining.length === 0) {
          const fresh = makeNewDocument(1, preferences, 1);
          setActiveDocIdPane1(fresh.id);
          setActiveDocIdPane2(null);
          setIsSplitView(false);
          return [fresh];
        }
        const p1 = remaining.filter((d) => d.viewPane === 1);
        const p2 = remaining.filter((d) => d.viewPane === 2);
        if (docId === activeDocIdPane1) {
          setActiveDocIdPane1(p1[0]?.id || remaining[0].id);
        }
        if (docId === activeDocIdPane2) {
          setActiveDocIdPane2(p2[0]?.id || null);
        }
        if (p2.length === 0 && isSplitView) {
          setIsSplitView(false);
          setFocusedPane(1);
        }
        return remaining;
      });
      fileHandlesRef.current.delete(docId);
    },
    [preferences, activeDocIdPane1, activeDocIdPane2, isSplitView]
  );

  const handleContentChange = useCallback((docId: string, content: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              content,
              isDirty: content !== d.savedContent,
              lastModified: Date.now(),
            }
          : d
      )
    );
  }, []);

  const handleCursorChange = useCallback(
    (docId: string, line: number, col: number, pos: number, selLen: number, selLines: number) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                cursorLine: line,
                cursorCol: col,
                cursorPos: pos,
                selectionLength: selLen,
                selectionLines: selLines,
              }
            : d
        )
      );
    },
    []
  );

  const handleToggleBookmark = useCallback((docId: string, line: number) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const exists = d.bookmarks.includes(line);
        return {
          ...d,
          bookmarks: exists ? d.bookmarks.filter((l) => l !== line) : [...d.bookmarks, line],
        };
      })
    );
  }, []);

  const toggleSplitView = useCallback(
    (targetDocId?: string) => {
      const docId = targetDocId || activeDoc.id;
      if (!isSplitView) {
        if (documents.length === 1) {
          // Clone doc into pane 2 so user immediately sees split view
          const copyDoc = {
            ...activeDoc,
            id: `doc-${Date.now()}-split`,
            title: `${activeDoc.title} (View 2)`,
            viewPane: 2 as const,
          };
          setDocuments((prev) => [...prev, copyDoc]);
          setActiveDocIdPane2(copyDoc.id);
          setIsSplitView(true);
          setFocusedPane(2);
        } else {
          setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, viewPane: 2 } : d))
          );
          setActiveDocIdPane2(docId);
          setIsSplitView(true);
          setFocusedPane(2);
        }
      } else {
        setDocuments((prev) => prev.map((d) => ({ ...d, viewPane: 1 })));
        setIsSplitView(false);
        setActiveDocIdPane2(null);
        setFocusedPane(1);
      }
    },
    [activeDoc, documents.length, isSplitView]
  );

  const runMacroOnce = useCallback(
    (actions: MacroAction[]) => {
      const ed = getActiveEditor();
      if (!ed) return;
      for (const act of actions) {
        if (act.type === 'insert' && act.text) {
          ed.insertText(act.text);
        } else if (act.type === 'command' && act.command) {
          if (act.command === 'edit:duplicateLine') ed.duplicateLine();
          else if (act.command === 'edit:uppercase') ed.transformSelectionOrDoc((t) => t.toUpperCase(), false);
          else if (act.command === 'edit:lowercase') ed.transformSelectionOrDoc((t) => t.toLowerCase(), false);
          else if (act.command === 'edit:toggleComment') ed.toggleComment();
        }
      }
    },
    [getActiveEditor]
  );

  // Unified Menu & Toolbar Command Dispatcher
  const handleCommand = useCallback(
    async ({ action, value }: MenuCommandPayload) => {
      const ed = getActiveEditor();

      if (isRecordingMacro && action.startsWith('edit:')) {
        setRecordedMacro((prev) => [...prev, { type: 'command', command: action }]);
      }

      switch (action) {
        // FILE
        case 'file:new':
          createNewDoc();
          break;
        case 'file:open':
          await handleOpenFilePicker();
          break;
        case 'file:reload':
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === activeDoc.id ? { ...d, content: d.savedContent, isDirty: false } : d
            )
          );
          showToast('Reloaded last saved buffer');
          break;
        case 'file:save':
          await saveDocument(activeDoc, false);
          break;
        case 'file:saveAs':
          await saveDocument(activeDoc, true);
          break;
        case 'file:saveAll':
          for (const d of documents) {
            if (d.isDirty) await saveDocument(d, false);
          }
          showToast('All modified files saved');
          break;
        case 'file:rename':
          setRenameDocId(activeDoc.id);
          break;
        case 'file:close':
          closeDocument(activeDoc.id);
          break;
        case 'file:closeAll': {
          const fresh = makeNewDocument(1, preferences, 1);
          setDocuments([fresh]);
          setActiveDocIdPane1(fresh.id);
          setActiveDocIdPane2(null);
          setIsSplitView(false);
          fileHandlesRef.current.clear();
          break;
        }
        case 'file:closeOthers':
          setDocuments([{ ...activeDoc, viewPane: 1 }]);
          setActiveDocIdPane1(activeDoc.id);
          setActiveDocIdPane2(null);
          setIsSplitView(false);
          break;
        case 'file:closeLeft': {
          const idx = documents.findIndex((d) => d.id === activeDoc.id);
          if (idx > 0) setDocuments(documents.slice(idx));
          break;
        }
        case 'file:closeRight': {
          const idx = documents.findIndex((d) => d.id === activeDoc.id);
          if (idx >= 0) setDocuments(documents.slice(0, idx + 1));
          break;
        }
        case 'file:print':
          window.print();
          break;

        // EDIT
        case 'edit:undo':
          ed?.undo();
          break;
        case 'edit:redo':
          ed?.redo();
          break;
        case 'edit:cut':
          ed?.cut();
          break;
        case 'edit:copy':
          ed?.copy();
          break;
        case 'edit:paste':
          ed?.paste();
          break;
        case 'edit:selectAll':
          ed?.selectAll();
          break;
        case 'edit:duplicateLine':
          ed?.duplicateLine();
          break;
        case 'edit:moveLineUp':
          ed?.moveLineUp();
          break;
        case 'edit:moveLineDown':
          ed?.moveLineDown();
          break;
        case 'edit:sortAsc':
          ed?.transformSelectionOrDoc((t) => t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'));
          break;
        case 'edit:sortDesc':
          ed?.transformSelectionOrDoc((t) => t.split('\n').sort((a, b) => b.localeCompare(a)).join('\n'));
          break;
        case 'edit:removeEmptyLines':
          ed?.transformSelectionOrDoc((t) => t.split('\n').filter((l) => l.trim() !== '').join('\n'));
          break;
        case 'edit:removeDuplicateLines':
          ed?.transformSelectionOrDoc((t) => Array.from(new Set(t.split('\n'))).join('\n'));
          break;
        case 'edit:uppercase':
          ed?.transformSelectionOrDoc((t) => t.toUpperCase(), false);
          break;
        case 'edit:lowercase':
          ed?.transformSelectionOrDoc((t) => t.toLowerCase(), false);
          break;
        case 'edit:propercase':
          ed?.transformSelectionOrDoc(toProperCase, false);
          break;
        case 'edit:sentencecase':
          ed?.transformSelectionOrDoc(toSentenceCase, false);
          break;
        case 'edit:trimTrailing':
          ed?.transformSelectionOrDoc((t) => t.split('\n').map((l) => l.replace(/[ \t]+$/, '')).join('\n'));
          break;
        case 'edit:trimLeading':
          ed?.transformSelectionOrDoc((t) => t.split('\n').map((l) => l.replace(/^[ \t]+/, '')).join('\n'));
          break;
        case 'edit:tabToSpace':
          ed?.transformSelectionOrDoc((t) => t.replace(/\t/g, ' '.repeat(preferences.tabSize)));
          break;
        case 'edit:spaceToTab':
          ed?.transformSelectionOrDoc((t) => t.replace(new RegExp(' '.repeat(preferences.tabSize), 'g'), '\t'));
          break;
        case 'edit:eol':
          if (value) {
            setDocuments((prev) =>
              prev.map((d) => (d.id === activeDoc.id ? { ...d, eol: value as NppEol, isDirty: true } : d))
            );
          }
          break;
        case 'edit:toggleComment':
          ed?.toggleComment();
          break;
        case 'edit:insertDate':
          ed?.insertText(new Date().toLocaleString());
          break;
        case 'edit:toggleReadOnly':
          setDocuments((prev) =>
            prev.map((d) => (d.id === activeDoc.id ? { ...d, isReadOnly: !d.isReadOnly } : d))
          );
          break;

        // SEARCH
        case 'search:find': {
          const sel = ed?.getSelectionText();
          if (sel) setSearchOptions((s) => ({ ...s, query: sel }));
          setFindTab('find');
          setFindOpen(true);
          break;
        }
        case 'search:replace': {
          const sel = ed?.getSelectionText();
          if (sel) setSearchOptions((s) => ({ ...s, query: sel }));
          setFindTab('replace');
          setFindOpen(true);
          break;
        }
        case 'search:findInFiles': {
          const sel = ed?.getSelectionText();
          if (sel) setSearchOptions((s) => ({ ...s, query: sel }));
          setFindTab('findInFiles');
          setFindOpen(true);
          break;
        }
        case 'search:mark': {
          const sel = ed?.getSelectionText();
          if (sel) setSearchOptions((s) => ({ ...s, query: sel }));
          setFindTab('mark');
          setFindOpen(true);
          break;
        }
        case 'search:clearMarks':
          setDocuments((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, marks: [] } : d)));
          break;
        case 'search:findNext':
          if (!searchOptions.query) {
            setFindTab('find');
            setFindOpen(true);
          } else {
            ed?.findNext(searchOptions, false);
          }
          break;
        case 'search:findPrev':
          if (searchOptions.query) ed?.findNext(searchOptions, true);
          break;
        case 'search:goto':
          setShowGoTo(true);
          break;
        case 'search:matchingBrace':
          ed?.goToMatchingBrace();
          break;
        case 'search:toggleBookmark':
          handleToggleBookmark(activeDoc.id, activeDoc.cursorLine);
          break;
        case 'search:nextBookmark':
          ed?.nextBookmark();
          break;
        case 'search:prevBookmark':
          ed?.prevBookmark();
          break;
        case 'search:clearBookmarks':
          setDocuments((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, bookmarks: [] } : d)));
          break;

        // VIEW
        case 'view:fullscreen':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
          break;
        case 'view:postit':
          setIsPostIt((v) => !v);
          break;
        case 'view:darkMode':
          setPreferences((p) => ({
            ...p,
            darkMode: !p.darkMode,
            themeId: !p.darkMode ? 'DarkModeDefault' : 'Default',
          }));
          break;
        case 'view:whitespace':
          setPreferences((p) => ({ ...p, showWhitespace: !p.showWhitespace }));
          break;
        case 'view:eol':
          setPreferences((p) => ({ ...p, showEol: !p.showEol }));
          break;
        case 'view:allChars':
          setPreferences((p) => {
            const both = p.showWhitespace && p.showEol;
            return { ...p, showWhitespace: !both, showEol: !both };
          });
          break;
        case 'view:lineNumbers':
          setPreferences((p) => ({ ...p, showLineNumbers: !p.showLineNumbers }));
          break;
        case 'view:wordWrap':
          setPreferences((p) => ({ ...p, wordWrap: !p.wordWrap }));
          break;
        case 'view:zoomIn':
          setPreferences((p) => ({ ...p, zoomLevel: Math.min(10, p.zoomLevel + 1) }));
          break;
        case 'view:zoomOut':
          setPreferences((p) => ({ ...p, zoomLevel: Math.max(-4, p.zoomLevel - 1) }));
          break;
        case 'view:zoomReset':
          setPreferences((p) => ({ ...p, zoomLevel: 0 }));
          break;
        case 'view:splitView':
          toggleSplitView();
          break;
        case 'view:docMap':
          setPreferences((p) => ({ ...p, showDocumentMap: !p.showDocumentMap }));
          break;
        case 'view:functionList':
          setPreferences((p) => ({ ...p, showFunctionList: !p.showFunctionList }));
          break;
        case 'view:workspace':
          setPreferences((p) => ({ ...p, showWorkspace: !p.showWorkspace }));
          break;
        case 'view:toolbar':
          setPreferences((p) => ({ ...p, showToolbar: !p.showToolbar }));
          break;
        case 'view:statusBar':
          setPreferences((p) => ({ ...p, showStatusBar: !p.showStatusBar }));
          break;
        case 'view:accessoryBar':
          setPreferences((p) => ({ ...p, showAndroidAccessoryBar: !p.showAndroidAccessoryBar }));
          break;
        case 'view:summary':
          setShowSummary(true);
          break;

        // ENCODING & LANGUAGE
        case 'encoding:set':
          if (value) {
            setDocuments((prev) =>
              prev.map((d) => (d.id === activeDoc.id ? { ...d, encoding: value as NppEncoding } : d))
            );
          }
          break;
        case 'language:set':
          if (value) {
            setDocuments((prev) =>
              prev.map((d) => (d.id === activeDoc.id ? { ...d, language: value as NppLanguage } : d))
            );
          }
          break;

        // SETTINGS
        case 'settings:preferences':
          setShowPrefs(true);
          break;
        case 'settings:styles':
          setShowStyles(true);
          break;

        // TOOLS
        case 'tools:shaDoc': {
          const digest = await computeSHA256(activeDoc.content);
          await navigator.clipboard?.writeText(digest).catch(() => {});
          showToast(`SHA-256 copied: ${digest.slice(0, 18)}...`);
          break;
        }
        case 'tools:shaSel': {
          const sel = ed?.getSelectionText() || activeDoc.content;
          const digest = await computeSHA256(sel);
          await navigator.clipboard?.writeText(digest).catch(() => {});
          showToast(`SHA-256 copied: ${digest.slice(0, 18)}...`);
          break;
        }
        case 'tools:b64Encode':
          ed?.transformSelectionOrDoc(encodeBase64Unicode);
          break;
        case 'tools:b64Decode':
          ed?.transformSelectionOrDoc((t) => {
            try {
              return decodeBase64Unicode(t);
            } catch {
              showToast('Invalid Base64 input');
              return t;
            }
          });
          break;
        case 'tools:urlEncode':
          ed?.transformSelectionOrDoc(encodeURIComponent);
          break;
        case 'tools:urlDecode':
          ed?.transformSelectionOrDoc((t) => {
            try {
              return decodeURIComponent(t);
            } catch {
              return t;
            }
          });
          break;
        case 'tools:jsonFormat':
          ed?.transformSelectionOrDoc((t) => {
            try {
              return JSON.stringify(JSON.parse(t), null, preferences.tabSize);
            } catch {
              showToast('Invalid JSON');
              return t;
            }
          });
          break;
        case 'tools:jsonMinify':
          ed?.transformSelectionOrDoc((t) => {
            try {
              return JSON.stringify(JSON.parse(t));
            } catch {
              showToast('Invalid JSON');
              return t;
            }
          });
          break;

        // MACRO
        case 'macro:start':
          setRecordedMacro([]);
          setIsRecordingMacro(true);
          showToast('Macro recording started');
          break;
        case 'macro:stop':
          setIsRecordingMacro(false);
          showToast(`Macro stopped (${recordedMacro.length} steps)`);
          break;
        case 'macro:play':
          runMacroOnce(recordedMacro);
          break;
        case 'macro:playMulti':
          setShowMacroMulti(true);
          break;

        // RUN, TERMUX & PYTHON
        case 'termux:console':
          setConsoleMode('termux');
          setShowPythonConsole((v) => !v);
          break;
        case 'termux:connect':
          await handleTestTermuxConnection();
          break;
        case 'termux:run': {
          setShowPythonConsole(true);
          // Try Termux Bridge first; if not connected and it's Python, offer or run built-in Python
          const health = await checkTermuxHealth(termuxConfig);
          if (health.ok) {
            setConsoleMode('termux');
            setTermuxConnected(true);
            appendPythonLog(`--- Running ${activeDoc.title} in Termux ---`, 'info');
            try {
              const res = await runFileInTermux(
                termuxConfig,
                activeDoc.title,
                activeDoc.content,
                activeDoc.language,
                pythonStdin
              );
              if (res.stdout) appendPythonLog(res.stdout.trimEnd(), 'stdout');
              if (res.stderr) appendPythonLog(res.stderr.trimEnd(), 'stderr');
              appendPythonLog(`--- Process exited with code ${res.exitCode} ---`, 'info');
            } catch (err) {
              appendPythonLog(String(err), 'stderr');
            }
          } else if (activeDoc.language === 'python' || activeDoc.title.toLowerCase().endsWith('.py')) {
            setTermuxConnected(false);
            appendPythonLog('Termux Bridge not running — executing in Built-in Python 3.12...', 'info');
            await handleRunPythonScript(activeDoc.content, activeDoc.title);
          } else {
            setConsoleMode('termux');
            setTermuxConnected(false);
            appendPythonLog(
              'Termux Bridge is not connected. Open "Termux Setup" in the console to link Termux on your phone.',
              'stderr'
            );
          }
          break;
        }
        case 'python:console':
          setConsoleMode('pyodide');
          setShowPythonConsole(true);
          break;
        case 'python:install':
          await handleInstallPython();
          break;
        case 'python:run':
          await handleRunPythonScript(activeDoc.content, activeDoc.title);
          break;
        case 'run:preview':
          setShowPreview(true);
          break;
        case 'run:google': {
          const sel = ed?.getSelectionText() || '';
          if (sel) window.open(`https://www.google.com/search?q=${encodeURIComponent(sel)}`, '_blank', 'noopener');
          else showToast('Select text first to search');
          break;
        }
        case 'run:wiki': {
          const sel = ed?.getSelectionText() || '';
          if (sel) window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(sel)}`, '_blank', 'noopener');
          else showToast('Select text first to search');
          break;
        }

        // HELP
        case 'help:about':
          setShowAbout(true);
          break;
        case 'help:shortcuts':
          setShowShortcuts(true);
          break;
      }
    },
    [
      getActiveEditor,
      isRecordingMacro,
      createNewDoc,
      handleOpenFilePicker,
      activeDoc,
      saveDocument,
      documents,
      closeDocument,
      preferences,
      searchOptions,
      handleToggleBookmark,
      toggleSplitView,
      showToast,
      recordedMacro,
      runMacroOnce,
      handleInstallPython,
      handleRunPythonScript,
      handleTestTermuxConnection,
      termuxConfig,
      pythonStdin,
      appendPythonLog,
    ]
  );

  // Global Keyboard Shortcuts matching Windows Notepad++
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrl && !e.shiftKey && !e.altKey && key === 'n') {
        e.preventDefault();
        handleCommand({ action: 'file:new' });
      } else if (ctrl && !e.shiftKey && !e.altKey && key === 'o') {
        e.preventDefault();
        handleCommand({ action: 'file:open' });
      } else if (ctrl && !e.shiftKey && !e.altKey && key === 's') {
        e.preventDefault();
        handleCommand({ action: 'file:save' });
      } else if (ctrl && e.shiftKey && key === 's') {
        e.preventDefault();
        handleCommand({ action: 'file:saveAll' });
      } else if (ctrl && !e.shiftKey && key === 'w') {
        e.preventDefault();
        handleCommand({ action: 'file:close' });
      } else if (ctrl && !e.shiftKey && key === 'f') {
        e.preventDefault();
        handleCommand({ action: 'search:find' });
      } else if (ctrl && e.shiftKey && key === 'f') {
        e.preventDefault();
        handleCommand({ action: 'search:findInFiles' });
      } else if (ctrl && !e.shiftKey && key === 'h') {
        e.preventDefault();
        handleCommand({ action: 'search:replace' });
      } else if (ctrl && !e.shiftKey && key === 'g') {
        e.preventDefault();
        handleCommand({ action: 'search:goto' });
      } else if (ctrl && !e.shiftKey && key === 'b') {
        e.preventDefault();
        handleCommand({ action: 'search:matchingBrace' });
      } else if (ctrl && !e.shiftKey && key === 'd') {
        e.preventDefault();
        handleCommand({ action: 'edit:duplicateLine' });
      } else if (ctrl && !e.shiftKey && key === 'q') {
        e.preventDefault();
        handleCommand({ action: 'edit:toggleComment' });
      } else if (ctrl && e.shiftKey && key === 'p') {
        e.preventDefault();
        handleCommand({ action: 'macro:play' });
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleCommand({ action: e.shiftKey ? 'search:findPrev' : 'search:findNext' });
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (ctrl) handleCommand({ action: 'search:toggleBookmark' });
        else handleCommand({ action: e.shiftKey ? 'search:prevBookmark' : 'search:nextBookmark' });
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (activeDoc.language === 'html' || activeDoc.language === 'markdown') {
          handleCommand({ action: 'run:preview' });
        } else {
          handleCommand({ action: 'termux:run' });
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        handleCommand({ action: 'view:postit' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCommand, activeDoc.language, activeDoc.title]);

  // Search Dialog Handlers
  const handleFindNext = (backwards = false) => {
    const ed = getActiveEditor();
    if (!ed) return;
    const ok = ed.findNext(searchOptions, backwards);
    setFindStatus(
      ok ? `Found "${searchOptions.query}"` : `Can't find the text "${searchOptions.query}"`
    );
  };

  const handleCountMatches = () => {
    const re = compileSearchRegex(searchOptions);
    if (!re) {
      setFindStatus('Invalid search pattern');
      return;
    }
    const matches = activeDoc.content.match(re);
    const count = matches ? matches.length : 0;
    setFindStatus(`Count: ${count} match${count === 1 ? '' : 'es'} in current document`);
  };

  const handleFindAllInCurrent = () => {
    const hits = findMatchesInDocument(
      activeDoc.id,
      activeDoc.title,
      activeDoc.path,
      activeDoc.content,
      searchOptions
    );
    setSearchResults({ query: searchOptions.query, hits });
    setFindStatus(`Found ${hits.length} hit(s) in "${activeDoc.title}"`);
  };

  const handleFindAllInOpened = () => {
    const allHits: SearchHit[] = [];
    for (const d of documents) {
      allHits.push(...findMatchesInDocument(d.id, d.title, d.path, d.content, searchOptions));
    }
    setSearchResults({ query: searchOptions.query, hits: allHits });
    setFindStatus(`Found ${allHits.length} hit(s) across ${documents.length} opened file(s)`);
  };

  const handleReplaceOne = () => {
    const ed = getActiveEditor();
    if (!ed) return;
    const more = ed.replaceCurrent(searchOptions);
    setFindStatus(more ? 'Replaced; moved to next match' : 'Replaced (no more matches)');
  };

  const handleReplaceAll = () => {
    const ed = getActiveEditor();
    if (!ed) return;
    const count = ed.replaceAll(searchOptions);
    setFindStatus(`Replace All: ${count} occurrence${count === 1 ? '' : 's'} were replaced`);
  };

  const handleReplaceInAllOpened = () => {
    const re = compileSearchRegex(searchOptions);
    if (!re) {
      setFindStatus('Invalid search pattern');
      return;
    }
    let totalCount = 0;
    const replacement =
      searchOptions.mode === 'extended'
        ? searchOptions.replaceWith.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
        : searchOptions.replaceWith;

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.isReadOnly) return d;
        let docHits = 0;
        const next = d.content.replace(re, (...args) => {
          docHits++;
          totalCount++;
          if (searchOptions.mode === 'regex') {
            return replacement.replace(/\$(\d+)/g, (_, idx) => args[Number(idx)] ?? '');
          }
          return replacement;
        });
        return docHits > 0 ? { ...d, content: next, isDirty: next !== d.savedContent } : d;
      })
    );
    setFindStatus(`Replace in All Opened: ${totalCount} occurrence(s) replaced`);
  };

  const handleMarkAll = () => {
    if (!searchOptions.query) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id
          ? { ...d, marks: Array.from(new Set([...d.marks, searchOptions.query])) }
          : d
      )
    );
    const hits = findMatchesInDocument(
      activeDoc.id,
      activeDoc.title,
      activeDoc.path,
      activeDoc.content,
      searchOptions
    );
    setFindStatus(`Mark: ${hits.length} match(es) marked`);
  };

  const handleTabContextAction = (
    docId: string,
    action: 'close' | 'closeOthers' | 'closeLeft' | 'closeRight' | 'rename' | 'movePane' | 'toggleReadOnly'
  ) => {
    if (action === 'close') closeDocument(docId);
    else if (action === 'closeOthers') {
      const target = documents.find((d) => d.id === docId);
      if (target) {
        setDocuments([{ ...target, viewPane: 1 }]);
        setActiveDocIdPane1(target.id);
        setActiveDocIdPane2(null);
        setIsSplitView(false);
      }
    } else if (action === 'closeLeft') {
      const idx = documents.findIndex((d) => d.id === docId);
      if (idx > 0) setDocuments(documents.slice(idx));
    } else if (action === 'closeRight') {
      const idx = documents.findIndex((d) => d.id === docId);
      if (idx >= 0) setDocuments(documents.slice(0, idx + 1));
    } else if (action === 'rename') {
      setRenameDocId(docId);
    } else if (action === 'movePane') {
      toggleSplitView(docId);
    } else if (action === 'toggleReadOnly') {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, isReadOnly: !d.isReadOnly } : d))
      );
    }
  };

  const renameTargetDoc = documents.find((d) => d.id === renameDocId) || null;
  const activeLinesCount = activeDoc.content === '' ? 1 : activeDoc.content.split('\n').length;

  return (
    <div className="flex flex-col w-full h-full bg-[#f0f0f0] dark:bg-[#1e1e1e] text-[#1a1a1a] dark:text-[#e0e0e0] overflow-hidden pt-safe">
      {/* Hidden native file input for Android / Desktop file open */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length) openFilesFromList(files);
          e.target.value = '';
        }}
      />

      {/* Windows-style Title Bar (Hidden in Post-It mode) */}
      {!isPostIt && (
        <header className="flex items-center justify-between gap-2 px-2.5 h-8 bg-[#ffffff] dark:bg-[#202020] border-b border-[#d4d4d4] dark:border-[#383838] select-none shrink-0 npp-no-print">
          <div className="flex items-center gap-2 min-w-0">
            <NppLogoIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-normal truncate">
              {activeDoc.isDirty ? '*' : ''}
              {activeDoc.path} - Notepad++
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isOnline && (
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap">
                Offline
              </span>
            )}
            <PWAInstallButton />
          </div>
        </header>
      )}

      {/* Post-It Exit Bar (F12) */}
      {isPostIt && (
        <div className="flex items-center justify-between px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-xs border-b border-amber-300 dark:border-amber-800 npp-no-print">
          <span className="truncate font-medium">Post-It Mode — {activeDoc.title}</span>
          <button
            type="button"
            onClick={() => setIsPostIt(false)}
            className="px-2 py-0.5 bg-amber-500 text-white rounded text-[11px] font-medium"
          >
            Exit Post-It (F12)
          </button>
        </div>
      )}

      {/* Menu Bar */}
      {!isPostIt && (
        <MenuBar
          activeDoc={activeDoc}
          preferences={preferences}
          isRecordingMacro={isRecordingMacro}
          hasMacro={recordedMacro.length > 0}
          isPostIt={isPostIt}
          isSplitView={isSplitView}
          onCommand={handleCommand}
        />
      )}

      {/* Toolbar */}
      {!isPostIt && preferences.showToolbar && (
        <Toolbar
          activeDoc={activeDoc}
          preferences={preferences}
          isRecordingMacro={isRecordingMacro}
          hasMacro={recordedMacro.length > 0}
          isSplitView={isSplitView}
          onCommand={handleCommand}
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Folder as Workspace */}
        {!isPostIt && preferences.showWorkspace && (
          <FolderWorkspace
            nodes={workspaceNodes}
            onToggleExpand={(id) =>
              setWorkspaceNodes((prev) =>
                prev.map((n) => (n.id === id ? { ...n, expanded: !n.expanded } : n))
              )
            }
            onOpenNode={(node) => {
              const existing = documents.find((d) => d.path === node.name && !d.isVirtualNew);
              if (existing) {
                if (existing.viewPane === 2 && isSplitView) {
                  setActiveDocIdPane2(existing.id);
                  setFocusedPane(2);
                } else {
                  setActiveDocIdPane1(existing.id);
                  setFocusedPane(1);
                }
                return;
              }
              const docId = `doc-ws-${node.id}-${Date.now()}`;
              const content = node.content ?? '';
              const lang = node.language || detectLanguageFromFilename(node.name);
              const newDoc: EditorDocument = {
                id: docId,
                title: node.name,
                path: node.name,
                content,
                savedContent: content,
                language: lang,
                eol: preferences.defaultEol,
                encoding: preferences.defaultEncoding,
                isDirty: false,
                isReadOnly: false,
                viewPane: focusedPane === 2 && isSplitView ? 2 : 1,
                cursorLine: 1,
                cursorCol: 1,
                cursorPos: 0,
                selectionLength: 0,
                selectionLines: 0,
                bookmarks: [],
                marks: [],
                lastModified: Date.now(),
              };
              setDocuments((prev) => [...prev, newDoc]);
              if (focusedPane === 2 && isSplitView) setActiveDocIdPane2(docId);
              else setActiveDocIdPane1(docId);
            }}
            onCreateFile={(parentId, name) => {
              const newNode: WorkspaceNode = {
                id: `ws-${Date.now()}`,
                name,
                type: 'file',
                parentId,
                content: '',
                language: detectLanguageFromFilename(name),
              };
              setWorkspaceNodes((prev) => [...prev, newNode]);
            }}
            onCreateFolder={(parentId, name) => {
              const newNode: WorkspaceNode = {
                id: `ws-dir-${Date.now()}`,
                name,
                type: 'folder',
                parentId,
                expanded: true,
              };
              setWorkspaceNodes((prev) => [...prev, newNode]);
            }}
            onDeleteNode={(id) =>
              setWorkspaceNodes((prev) => prev.filter((n) => n.id !== id && n.parentId !== id))
            }
            onImportFiles={handleOpenFilePicker}
            onClosePanel={() => setPreferences((p) => ({ ...p, showWorkspace: false }))}
          />
        )}

        {/* Center Editor Panes (Single or Split Dual-View) */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
            {/* View Pane 1 */}
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              {!isPostIt && (
                <TabBar
                  documents={pane1Docs.length > 0 ? pane1Docs : documents}
                  activeDocId={activeDocPane1.id}
                  paneNumber={1}
                  onSelectTab={(id) => {
                    setActiveDocIdPane1(id);
                    setFocusedPane(1);
                  }}
                  onCloseTab={closeDocument}
                  onNewTab={() => createNewDoc(1)}
                  onTabContextAction={handleTabContextAction}
                />
              )}
              <div className="flex-1 min-h-0 relative">
                <CodeEditorPane
                  ref={pane1EditorRef}
                  doc={activeDocPane1}
                  preferences={preferences}
                  isOverwriteMode={isOverwriteMode}
                  isActivePane={focusedPane === 1}
                  isRecordingMacro={isRecordingMacro}
                  onFocusPane={() => setFocusedPane(1)}
                  onContentChange={handleContentChange}
                  onCursorChange={handleCursorChange}
                  onToggleBookmark={handleToggleBookmark}
                  onScrollChange={(_, top, visible) => {
                    if (focusedPane === 1) setScrollState({ top, visible });
                  }}
                  onRecordMacroAction={(act) => setRecordedMacro((prev) => [...prev, act])}
                />
              </div>
            </div>

            {/* View Pane 2 (Split View) */}
            {isSplitView && activeDocPane2 && (
              <div className="flex flex-col flex-1 min-w-0 min-h-0 border-t-2 md:border-t-0 md:border-l-2 border-[#b8b8b8] dark:border-[#444444]">
                {!isPostIt && (
                  <TabBar
                    documents={pane2Docs}
                    activeDocId={activeDocPane2.id}
                    paneNumber={2}
                    onSelectTab={(id) => {
                      setActiveDocIdPane2(id);
                      setFocusedPane(2);
                    }}
                    onCloseTab={closeDocument}
                    onNewTab={() => createNewDoc(2)}
                    onTabContextAction={handleTabContextAction}
                  />
                )}
                <div className="flex-1 min-h-0 relative">
                  <CodeEditorPane
                    ref={pane2EditorRef}
                    doc={activeDocPane2}
                    preferences={preferences}
                    isOverwriteMode={isOverwriteMode}
                    isActivePane={focusedPane === 2}
                    isRecordingMacro={isRecordingMacro}
                    onFocusPane={() => setFocusedPane(2)}
                    onContentChange={handleContentChange}
                    onCursorChange={handleCursorChange}
                    onToggleBookmark={handleToggleBookmark}
                    onScrollChange={(_, top, visible) => {
                      if (focusedPane === 2) setScrollState({ top, visible });
                    }}
                    onRecordMacroAction={(act) => setRecordedMacro((prev) => [...prev, act])}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Search Results Panel */}
          {searchResults && (
            <SearchResultsPanel
              query={searchResults.query}
              hits={searchResults.hits}
              onSelectHit={(hit) => {
                const target = documents.find((d) => d.id === hit.docId);
                if (!target) return;
                if (target.viewPane === 2 && isSplitView) {
                  setActiveDocIdPane2(target.id);
                  setFocusedPane(2);
                  window.setTimeout(() => pane2EditorRef.current?.goToLine(hit.line, hit.col), 20);
                } else {
                  setActiveDocIdPane1(target.id);
                  setFocusedPane(1);
                  window.setTimeout(() => pane1EditorRef.current?.goToLine(hit.line, hit.col), 20);
                }
              }}
              onClose={() => setSearchResults(null)}
            />
          )}

          {/* Bottom Unified Termux & Python 3.12 Console Panel */}
          {showPythonConsole && (
            <TerminalPanel
              mode={consoleMode}
              onChangeMode={setConsoleMode}
              pythonStatus={pythonStatus}
              onInstallPython={handleInstallPython}
              onRunPythonFile={() => handleRunPythonScript(activeDoc.content, activeDoc.title)}
              onRunPythonRepl={(expr) => {
                appendPythonLog(`>>> ${expr}`, 'info');
                handleRunPythonScript(expr);
              }}
              onInstallPythonPackage={handleInstallPythonPkg}
              termuxConnected={termuxConnected}
              termuxChecking={termuxChecking}
              termuxConfig={termuxConfig}
              termuxFiles={termuxFiles}
              termuxBrowseDir={termuxBrowseDir}
              onChangeTermuxConfig={setTermuxConfig}
              onTestTermuxConnection={handleTestTermuxConnection}
              onRunTermuxShell={handleRunTermuxShell}
              onRunActiveFileInTermux={() => handleCommand({ action: 'termux:run' })}
              onBrowseTermuxDir={handleBrowseTermuxDir}
              onOpenTermuxFile={handleOpenTermuxFile}
              entries={pythonLogs}
              stdinText={pythonStdin}
              activeDocTitle={activeDoc.title}
              onChangeStdin={setPythonStdin}
              onClear={() => setPythonLogs([])}
              onClose={() => setShowPythonConsole(false)}
            />
          )}
        </div>

        {/* Right Sidebars: Function List & Document Map */}
        {!isPostIt && preferences.showFunctionList && (
          <FunctionList
            docTitle={activeDoc.title}
            content={activeDoc.content}
            language={activeDoc.language}
            onJumpToLine={(line) => getActiveEditor()?.goToLine(line, 1)}
            onClose={() => setPreferences((p) => ({ ...p, showFunctionList: false }))}
          />
        )}

        {!isPostIt && preferences.showDocumentMap && (
          <DocumentMap
            content={activeDoc.content}
            scrollTopRatio={scrollState.top}
            visibleRatio={scrollState.visible}
            isDark={preferences.darkMode}
            onScrollToRatio={(ratio) => getActiveEditor()?.scrollToRatio(ratio)}
            onClose={() => setPreferences((p) => ({ ...p, showDocumentMap: false }))}
          />
        )}
      </div>

      {/* Mobile Touch Coding Key Bar */}
      {!isPostIt && preferences.showAndroidAccessoryBar && (
        <AndroidAccessoryBar
          onInsertText={(txt) => getActiveEditor()?.insertText(txt)}
          onUndo={() => getActiveEditor()?.undo()}
          onRedo={() => getActiveEditor()?.redo()}
          onFind={() => handleCommand({ action: 'search:find' })}
          onSave={() => handleCommand({ action: 'file:save' })}
        />
      )}

      {/* Windows Notepad++ Status Bar */}
      {!isPostIt && preferences.showStatusBar && (
        <StatusBar
          doc={activeDoc}
          isOverwriteMode={isOverwriteMode}
          isRecordingMacro={isRecordingMacro}
          onToggleOverwrite={() => setIsOverwriteMode((v) => !v)}
          onCycleEol={() => {
            const order: NppEol[] = ['CRLF', 'LF', 'CR'];
            const next = order[(order.indexOf(activeDoc.eol) + 1) % order.length];
            setDocuments((prev) =>
              prev.map((d) => (d.id === activeDoc.id ? { ...d, eol: next, isDirty: true } : d))
            );
          }}
          onOpenGoToLine={() => setShowGoTo(true)}
          onOpenLanguagePicker={() => setShowStyles(true)}
          onCycleEncoding={() => {
            const order: NppEncoding[] = ['UTF-8', 'UTF-8-BOM', 'ANSI', 'Windows-1256'];
            const next = order[(order.indexOf(activeDoc.encoding) + 1) % order.length];
            setDocuments((prev) =>
              prev.map((d) => (d.id === activeDoc.id ? { ...d, encoding: next } : d))
            );
          }}
        />
      )}

      {/* Find / Replace / Find in Files / Mark Floating Dialog */}
      <FindReplaceDialog
        isOpen={findOpen}
        activeTab={findTab}
        options={searchOptions}
        statusMessage={findStatus}
        onChangeTab={setFindTab}
        onChangeOptions={setSearchOptions}
        onFindNext={handleFindNext}
        onCount={handleCountMatches}
        onFindAllInCurrent={handleFindAllInCurrent}
        onFindAllInOpened={handleFindAllInOpened}
        onReplaceOne={handleReplaceOne}
        onReplaceAll={handleReplaceAll}
        onReplaceInAllOpened={handleReplaceInAllOpened}
        onMarkAll={handleMarkAll}
        onClearMarks={() =>
          setDocuments((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, marks: [] } : d)))
        }
        onClose={() => setFindOpen(false)}
      />

      {/* Modals */}
      {showGoTo && (
        <GoToLineModal
          currentLine={activeDoc.cursorLine}
          maxLines={activeLinesCount}
          currentOffset={activeDoc.cursorPos}
          maxOffset={activeDoc.content.length}
          onGoTo={(mode, val) => {
            if (mode === 'line') getActiveEditor()?.goToLine(val, 1);
            else getActiveEditor()?.goToOffset(val);
          }}
          onClose={() => setShowGoTo(false)}
        />
      )}

      {showPrefs && (
        <PreferencesModal
          preferences={preferences}
          onChange={setPreferences}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {showStyles && (
        <StyleConfiguratorModal
          preferences={preferences}
          onChange={setPreferences}
          onClose={() => setShowStyles(false)}
        />
      )}

      {showSummary && <SummaryModal doc={activeDoc} onClose={() => setShowSummary(false)} />}

      {renameTargetDoc && (
        <RenameModal
          currentName={renameTargetDoc.title}
          onRename={(newName) => {
            const lang = detectLanguageFromFilename(newName);
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === renameTargetDoc.id
                  ? { ...d, title: newName, path: newName, language: lang, isVirtualNew: false }
                  : d
              )
            );
          }}
          onClose={() => setRenameDocId(null)}
        />
      )}

      {showMacroMulti && (
        <RunMacroMultiModal
          onRun={(times) => {
            for (let i = 0; i < times; i++) runMacroOnce(recordedMacro);
          }}
          onClose={() => setShowMacroMulti(false)}
        />
      )}

      {showPreview && <PreviewModal doc={activeDoc} onClose={() => setShowPreview(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-9 right-3 z-50 px-3 py-1.5 bg-[#252526] text-white text-xs border border-[#454545] shadow-lg pointer-events-none npp-no-print">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
