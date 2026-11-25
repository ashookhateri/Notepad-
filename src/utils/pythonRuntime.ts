export type PythonStatus = 'not_installed' | 'installing' | 'ready' | 'error';

interface PyodideInstance {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (names: string | string[]) => Promise<void>;
  pyimport: (name: string) => { install: (pkg: string) => Promise<void> };
  setStdout: (opts: { batched: (msg: string) => void }) => void;
  setStderr: (opts: { batched: (msg: string) => void }) => void;
  globals: {
    set: (name: string, val: unknown) => void;
  };
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/';
const INSTALLED_FLAG_KEY = 'npp_python_runtime_installed';

let pyodideInstance: PyodideInstance | null = null;
let loadPromise: Promise<PyodideInstance> | null = null;

export function isPythonPreviouslyInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALLED_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && window.loadPyodide) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Python WebAssembly runtime from CDN.'));
    document.head.appendChild(script);
  });
}

export async function installAndInitPython(
  onLog: (line: string, kind?: 'info' | 'stdout' | 'stderr') => void
): Promise<PyodideInstance> {
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    onLog('Downloading & initializing Python 3.12 (CPython WebAssembly)...', 'info');
    await loadScript(`${PYODIDE_BASE}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error('Pyodide loader unavailable.');
    }
    const py = await window.loadPyodide({ indexURL: PYODIDE_BASE });
    await py.loadPackage('micropip');
    pyodideInstance = py;
    try {
      localStorage.setItem(INSTALLED_FLAG_KEY, 'true');
    } catch {
      // ignore
    }
    onLog('Python 3.12 & micropip installed and cached for offline use.', 'info');
    return py;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    loadPromise = null;
    throw err;
  }
}

export async function runPythonCode(
  code: string,
  stdinText: string,
  onLog: (line: string, kind?: 'info' | 'stdout' | 'stderr') => void
): Promise<void> {
  const py = await installAndInitPython(onLog);

  py.setStdout({
    batched: (msg: string) => onLog(msg, 'stdout'),
  });
  py.setStderr({
    batched: (msg: string) => onLog(msg, 'stderr'),
  });

  // Provide buffered stdin support so input() works seamlessly
  const stdinLines = stdinText.split(/\r?\n/);
  py.globals.set('__npp_stdin_lines', stdinLines);
  await py.runPythonAsync(`
import builtins
__npp_stdin_idx = 0
def __npp_input(prompt=""):
    global __npp_stdin_idx
    if prompt:
        print(prompt, end="")
    if __npp_stdin_idx < len(__npp_stdin_lines) and not (__npp_stdin_idx == 0 and len(__npp_stdin_lines) == 1 and __npp_stdin_lines[0] == ""):
        val = __npp_stdin_lines[__npp_stdin_idx]
        __npp_stdin_idx += 1
        print(val)
        return val
    return ""
builtins.input = __npp_input
`);

  const result = await py.runPythonAsync(code);
  if (result !== undefined && result !== null) {
    const str = String(result);
    if (str !== 'None' && str !== '') {
      onLog(str, 'stdout');
    }
  }
}

export async function installPythonPackage(
  packageName: string,
  onLog: (line: string, kind?: 'info' | 'stdout' | 'stderr') => void
): Promise<void> {
  const trimmed = packageName.trim();
  if (!trimmed) return;
  const py = await installAndInitPython(onLog);
  onLog(`pip install ${trimmed} ...`, 'info');
  const micropip = py.pyimport('micropip');
  await micropip.install(trimmed);
  onLog(`Successfully installed ${trimmed}`, 'info');
}
