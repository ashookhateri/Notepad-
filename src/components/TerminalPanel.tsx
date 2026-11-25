import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FolderOpen,
  PackagePlus,
  Play,
  PlugZap,
  RefreshCw,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { PythonStatus } from '../utils/pythonRuntime';
import {
  buildTermuxOneLiner,
  TERMUX_BRIDGE_SCRIPT,
  TermuxConfig,
  TermuxFileItem,
} from '../utils/termuxBridge';

export interface ConsoleEntry {
  id: number;
  text: string;
  kind: 'info' | 'stdout' | 'stderr';
}

export type ConsoleEngineMode = 'termux' | 'pyodide';

interface TerminalPanelProps {
  mode: ConsoleEngineMode;
  onChangeMode: (mode: ConsoleEngineMode) => void;
  // Built-in Python props
  pythonStatus: PythonStatus;
  onInstallPython: () => void;
  onRunPythonFile: () => void;
  onRunPythonRepl: (expr: string) => void;
  onInstallPythonPackage: (pkg: string) => void;
  // Termux Bridge props
  termuxConnected: boolean;
  termuxChecking: boolean;
  termuxConfig: TermuxConfig;
  termuxFiles: TermuxFileItem[] | null;
  termuxBrowseDir: string;
  onChangeTermuxConfig: (cfg: TermuxConfig) => void;
  onTestTermuxConnection: () => void;
  onRunTermuxShell: (cmd: string) => void;
  onRunActiveFileInTermux: () => void;
  onBrowseTermuxDir: (dir: string) => void;
  onOpenTermuxFile: (filePath: string) => void;
  // Shared console props
  entries: ConsoleEntry[];
  stdinText: string;
  activeDocTitle: string;
  onChangeStdin: (val: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  mode,
  onChangeMode,
  pythonStatus,
  onInstallPython,
  onRunPythonFile,
  onRunPythonRepl,
  onInstallPythonPackage,
  termuxConnected,
  termuxChecking,
  termuxConfig,
  termuxFiles,
  termuxBrowseDir,
  onChangeTermuxConfig,
  onTestTermuxConnection,
  onRunTermuxShell,
  onRunActiveFileInTermux,
  onBrowseTermuxDir,
  onOpenTermuxFile,
  entries,
  stdinText,
  activeDocTitle,
  onChangeStdin,
  onClear,
  onClose,
}) => {
  const [cmdInput, setCmdInput] = useState('');
  const [pkgInput, setPkgInput] = useState('');
  const [showPip, setShowPip] = useState(false);
  const [showStdin, setShowStdin] = useState(false);
  const [showTermuxSetup, setShowTermuxSetup] = useState(false);
  const [showTermuxBrowser, setShowTermuxBrowser] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const submitCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cmdInput.trim();
    if (!cmd) return;
    setCmdInput('');
    if (mode === 'termux') {
      onRunTermuxShell(cmd);
    } else {
      onRunPythonRepl(cmd);
    }
  };

  const submitPip = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = pkgInput.trim();
    if (!pkg) return;
    setPkgInput('');
    if (mode === 'termux') {
      onRunTermuxShell(`pip install ${pkg}`);
    } else {
      onInstallPythonPackage(pkg);
    }
  };

  const handleCopyOneLiner = async () => {
    const oneLiner = buildTermuxOneLiner();
    try {
      await navigator.clipboard.writeText(oneLiner);
      setCopiedCmd(true);
      window.setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadBridgeScript = () => {
    const blob = new Blob([TERMUX_BRIDGE_SCRIPT], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'npp-termux-bridge.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="h-64 sm:h-72 shrink-0 flex flex-col bg-[#1e1e1e] text-[#e5e5e5] border-t-2 border-[#4d7c0f] text-xs npp-no-print">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-[#252526] border-b border-[#3c3c3c] select-none">
        <div className="flex items-center gap-2 flex-wrap">
          <Terminal className="w-3.5 h-3.5 text-[#84cc16]" />

          {/* Engine Tabs */}
          <div className="flex items-center bg-[#1e1e1e] border border-[#3c3c3c] rounded p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => onChangeMode('termux')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'termux' ? 'bg-[#4d7c0f] text-white' : 'text-neutral-300 hover:bg-[#333333]'
              }`}
            >
              Termux Shell
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('pyodide')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'pyodide' ? 'bg-[#0e639c] text-white' : 'text-neutral-300 hover:bg-[#333333]'
              }`}
            >
              Built-in Python 3.12
            </button>
          </div>

          {mode === 'termux' ? (
            <span className="text-[11px] text-neutral-400">
              {termuxConnected ? '· Termux Connected (127.0.0.1:8765)' : '· Termux Not Connected'}
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400">
              {pythonStatus === 'not_installed' && '· Not Installed'}
              {pythonStatus === 'installing' && '· Installing...'}
              {pythonStatus === 'ready' && '· Ready (Offline)'}
              {pythonStatus === 'error' && '· Error'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {mode === 'termux' ? (
            <>
              <button
                type="button"
                onClick={onTestTermuxConnection}
                disabled={termuxChecking}
                className="flex items-center gap-1 px-2 py-1 rounded border border-[#3c3c3c] hover:bg-[#333333] text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${termuxChecking ? 'animate-spin' : ''}`} />
                <span>{termuxConnected ? 'Reconnect' : 'Connect'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTermuxSetup((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] ${
                  showTermuxSetup ? 'bg-[#4d7c0f] border-[#65a30d] text-white' : 'border-[#3c3c3c] hover:bg-[#333333]'
                }`}
              >
                <PlugZap className="w-3 h-3" />
                <span>Termux Setup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !showTermuxBrowser;
                  setShowTermuxBrowser(next);
                  if (next) onBrowseTermuxDir(termuxBrowseDir || '~');
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] ${
                  showTermuxBrowser ? 'bg-[#37373d] border-[#555555] text-white' : 'border-[#3c3c3c] hover:bg-[#333333]'
                }`}
              >
                <FolderOpen className="w-3 h-3" />
                <span>Termux Files</span>
              </button>

              <button
                type="button"
                onClick={onRunActiveFileInTermux}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4d7c0f] hover:bg-[#3f6212] text-white text-[11px] font-medium"
              >
                <Play className="w-3 h-3" />
                <span>Run {activeDocTitle}</span>
              </button>
            </>
          ) : (
            <>
              {pythonStatus !== 'ready' && (
                <button
                  type="button"
                  disabled={pythonStatus === 'installing'}
                  onClick={onInstallPython}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4d7c0f] hover:bg-[#3f6212] disabled:opacity-50 text-white text-[11px] font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>{pythonStatus === 'installing' ? 'Installing...' : 'Install Python 3'}</span>
                </button>
              )}
              <button
                type="button"
                disabled={pythonStatus === 'installing'}
                onClick={onRunPythonFile}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0e639c] hover:bg-[#1177bb] disabled:opacity-50 text-white text-[11px] font-medium"
              >
                <Play className="w-3 h-3" />
                <span>Run {activeDocTitle}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowPip((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] ${
              showPip ? 'bg-[#37373d] border-[#555555] text-white' : 'border-[#3c3c3c] hover:bg-[#333333]'
            }`}
          >
            <PackagePlus className="w-3 h-3" />
            <span>pip</span>
          </button>

          <button
            type="button"
            onClick={() => setShowStdin((v) => !v)}
            className={`px-2 py-1 rounded border text-[11px] ${
              showStdin ? 'bg-[#37373d] border-[#555555] text-white' : 'border-[#3c3c3c] hover:bg-[#333333]'
            }`}
          >
            stdin
          </button>

          <button type="button" onClick={onClear} title="Clear Console" className="p-1 rounded hover:bg-[#3c3c3c]">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onClose} title="Close Console" className="p-1 rounded hover:bg-[#3c3c3c]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Termux Setup Drawer */}
      {mode === 'termux' && showTermuxSetup && (
        <div className="p-2.5 bg-[#2a2d2e] border-b border-[#3c3c3c] space-y-2 text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[#bef264]">
              Run this 1-line command inside Android Termux to link all Termux packages, Python, C/C++, Node, Bash:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyOneLiner}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#4d7c0f] hover:bg-[#3f6212] text-white font-medium"
              >
                {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Copied!' : 'Copy Termux Command'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBridgeScript}
                className="flex items-center gap-1 px-2 py-1 rounded border border-[#555555] hover:bg-[#3a3a3a]"
              >
                <Download className="w-3 h-3" />
                <span>npp-termux-bridge.py</span>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-neutral-300">Bridge URL:</label>
            <input
              type="text"
              value={termuxConfig.baseUrl}
              onChange={(e) => onChangeTermuxConfig({ ...termuxConfig, baseUrl: e.target.value })}
              className="px-2 py-0.5 bg-[#1e1e1e] border border-[#454545] font-mono w-48 text-white"
            />
            <label className="text-neutral-300">Working Dir:</label>
            <input
              type="text"
              value={termuxConfig.cwd}
              onChange={(e) => onChangeTermuxConfig({ ...termuxConfig, cwd: e.target.value })}
              className="px-2 py-0.5 bg-[#1e1e1e] border border-[#454545] font-mono w-28 text-white"
            />
            <button
              type="button"
              onClick={onTestTermuxConnection}
              className="px-2.5 py-0.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Termux Home File Browser */}
      {mode === 'termux' && showTermuxBrowser && (
        <div className="max-h-28 overflow-y-auto npp-scroll bg-[#252526] border-b border-[#3c3c3c] px-2.5 py-1.5">
          <div className="flex items-center justify-between mb-1 text-[11px] text-neutral-300">
            <span className="font-mono truncate">Termux Dir: {termuxBrowseDir}</span>
            <button
              type="button"
              onClick={() => onBrowseTermuxDir(termuxBrowseDir.replace(/\/[^/]+$/, '') || '~')}
              className="px-2 py-0.5 bg-[#333333] hover:bg-[#444444] rounded"
            >
              .. Up
            </button>
          </div>
          {!termuxFiles ? (
            <div className="text-[11px] text-neutral-400">Connect Termux first to browse files.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {termuxFiles.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => (item.isDir ? onBrowseTermuxDir(item.path) : onOpenTermuxFile(item.path))}
                  className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#3c3c3c] hover:border-[#84cc16] font-mono text-[11px]"
                >
                  {item.isDir ? `📁 ${item.name}/` : item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* pip install bar */}
      {showPip && (
        <form onSubmit={submitPip} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#2d2d30] border-b border-[#3c3c3c]">
          <span className="text-[11px] font-mono text-[#84cc16] shrink-0">pip install</span>
          <input
            type="text"
            value={pkgInput}
            onChange={(e) => setPkgInput(e.target.value)}
            placeholder="package name (e.g. numpy, requests, flask, beautifulsoup4)"
            className="flex-1 px-2 py-1 bg-[#1e1e1e] border border-[#454545] outline-none font-mono text-xs text-white"
          />
          <button type="submit" className="px-3 py-1 bg-[#4d7c0f] hover:bg-[#3f6212] text-white rounded text-[11px] font-medium">
            Install
          </button>
        </form>
      )}

      {/* stdin bar */}
      {showStdin && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#2d2d30] border-b border-[#3c3c3c]">
          <span className="text-[11px] font-mono text-sky-400 shrink-0">stdin:</span>
          <input
            type="text"
            value={stdinText}
            onChange={(e) => onChangeStdin(e.target.value)}
            placeholder="Input lines passed to stdin / input()..."
            className="flex-1 px-2 py-1 bg-[#1e1e1e] border border-[#454545] outline-none font-mono text-xs text-white"
          />
        </div>
      )}

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto npp-scroll p-2.5 font-mono text-xs space-y-0.5 select-text">
        {entries.length === 0 ? (
          <div className="text-neutral-400 leading-relaxed">
            {mode === 'termux'
              ? 'Termux Shell Mode: Click "Termux Setup" to copy the 1-line bridge command into Termux on your Android device. Once connected, you can run pkg, pip, python3, bash, node, gcc, and any Termux library directly from Notepad++!'
              : 'Built-in Python 3.12 Mode: Click "Install Python 3" or "Run" to execute Python scripts right inside Notepad++ without external apps.'}
          </div>
        ) : (
          entries.map((entry) => (
            <pre
              key={entry.id}
              className={`whitespace-pre-wrap break-words leading-relaxed ${
                entry.kind === 'stderr'
                  ? 'text-red-400'
                  : entry.kind === 'info'
                  ? 'text-[#84cc16]'
                  : 'text-[#e5e5e5]'
              }`}
            >
              {entry.text}
            </pre>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Interactive Prompt */}
      <form onSubmit={submitCommand} className="flex items-center gap-2 px-2.5 py-1 bg-[#252526] border-t border-[#3c3c3c]">
        <span className="font-mono text-[#84cc16] font-bold">
          {mode === 'termux' ? `${termuxConfig.cwd} $` : '>>>'}
        </span>
        <input
          type="text"
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          placeholder={
            mode === 'termux'
              ? 'Run any Termux command (e.g. pkg install git, pip list, python3 --version, ls -la)'
              : 'Type Python expression or statement (e.g. print(2 + 2))'
          }
          className="flex-1 bg-transparent outline-none font-mono text-xs text-white"
        />
        <button type="submit" className="px-2.5 py-0.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded text-[11px]">
          Run
        </button>
      </form>
    </section>
  );
};
