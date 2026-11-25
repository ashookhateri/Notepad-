import { NppLanguage } from '../types/editor';

export interface TermuxConfig {
  baseUrl: string;
  token: string;
  cwd: string;
}

export const DEFAULT_TERMUX_CONFIG: TermuxConfig = {
  baseUrl: 'http://127.0.0.1:8765',
  token: '',
  cwd: '~',
};

export interface TermuxExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd?: string;
}

export interface TermuxFileItem {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}

export const TERMUX_BRIDGE_SCRIPT = `#!/usr/bin/env python3
"""
Notepad++ <-> Termux Local Bridge
Run in Termux: python3 npp-termux-bridge.py
"""
import http.server
import json
import os
import subprocess
import urllib.parse

PORT = int(os.environ.get("NPP_PORT", "8765"))
TOKEN = os.environ.get("NPP_TOKEN", "")
HOME = os.path.expanduser("~")
WORK_DIR = os.path.join(HOME, "npp_workspace")
os.makedirs(WORK_DIR, exist_ok=True)


class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def _send_json(self, code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self._cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _check_auth(self):
        if not TOKEN:
            return True
        auth = self.headers.get("Authorization", "")
        return auth == f"Bearer {TOKEN}"

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        if not self._check_auth():
            return self._send_json(401, {"error": "Unauthorized"})
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)

        if parsed.path == "/health":
            return self._send_json(200, {
                "ok": True,
                "home": HOME,
                "workspace": WORK_DIR,
                "shell": os.environ.get("SHELL", "/bin/sh"),
            })

        if parsed.path == "/ls":
            target = os.path.expanduser(qs.get("dir", [HOME])[0])
            try:
                items = []
                for name in sorted(os.listdir(target)):
                    full = os.path.join(target, name)
                    items.append({
                        "name": name,
                        "path": full,
                        "isDir": os.path.isdir(full),
                        "size": os.path.getsize(full) if os.path.isfile(full) else 0,
                    })
                return self._send_json(200, {"dir": target, "items": items})
            except Exception as exc:
                return self._send_json(400, {"error": str(exc)})

        if parsed.path == "/read":
            fpath = os.path.expanduser(qs.get("path", [""])[0])
            try:
                with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                    return self._send_json(200, {"path": fpath, "content": f.read()})
            except Exception as exc:
                return self._send_json(400, {"error": str(exc)})

        return self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if not self._check_auth():
            return self._send_json(401, {"error": "Unauthorized"})
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            return self._send_json(400, {"error": "Invalid JSON"})

        if self.path == "/write":
            fpath = os.path.expanduser(payload.get("path", ""))
            content = payload.get("content", "")
            try:
                os.makedirs(os.path.dirname(fpath) or WORK_DIR, exist_ok=True)
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(content)
                return self._send_json(200, {"ok": True, "path": fpath})
            except Exception as exc:
                return self._send_json(400, {"error": str(exc)})

        if self.path == "/exec":
            cmd = payload.get("command", "")
            cwd = os.path.expanduser(payload.get("cwd") or HOME)
            stdin_data = payload.get("stdin", "")
            if not os.path.isdir(cwd):
                cwd = HOME
            try:
                proc = subprocess.run(
                    cmd,
                    shell=True,
                    cwd=cwd,
                    input=stdin_data,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    executable=os.environ.get("SHELL", None),
                )
                return self._send_json(200, {
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exitCode": proc.returncode,
                    "cwd": cwd,
                })
            except subprocess.TimeoutExpired:
                return self._send_json(200, {
                    "stdout": "",
                    "stderr": "Command timed out after 120 seconds.",
                    "exitCode": 124,
                    "cwd": cwd,
                })
            except Exception as exc:
                return self._send_json(500, {"stdout": "", "stderr": str(exc), "exitCode": 1})

        if self.path == "/run-file":
            filename = os.path.basename(payload.get("filename", "script.py"))
            content = payload.get("content", "")
            command = payload.get("command", "")
            stdin_data = payload.get("stdin", "")
            fpath = os.path.join(WORK_DIR, filename)
            try:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(content)
                final_cmd = command.replace("{FILE}", fpath)
                proc = subprocess.run(
                    final_cmd,
                    shell=True,
                    cwd=WORK_DIR,
                    input=stdin_data,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    executable=os.environ.get("SHELL", None),
                )
                return self._send_json(200, {
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exitCode": proc.returncode,
                    "cwd": WORK_DIR,
                })
            except Exception as exc:
                return self._send_json(500, {"stdout": "", "stderr": str(exc), "exitCode": 1})

        return self._send_json(404, {"error": "Not found"})

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    print(f"Notepad++ Termux Bridge running on http://127.0.0.1:{PORT}")
    print(f"Workspace: {WORK_DIR}")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), BridgeHandler)
    server.serve_forever()
`;

export function buildTermuxOneLiner(): string {
  const b64 = btoa(unescape(encodeURIComponent(TERMUX_BRIDGE_SCRIPT)));
  return `pkg install -y python && echo "${b64}" | base64 -d > ~/npp-termux-bridge.py && python3 ~/npp-termux-bridge.py`;
}

export function getTermuxRunTemplate(language: NppLanguage, filename: string): string {
  const lower = filename.toLowerCase();
  if (language === 'python' || lower.endsWith('.py')) return 'python3 "{FILE}"';
  if (language === 'javascript' || lower.endsWith('.js') || lower.endsWith('.mjs')) return 'node "{FILE}"';
  if (language === 'typescript' || lower.endsWith('.ts')) return 'npx tsx "{FILE}"';
  if (language === 'bash' || lower.endsWith('.sh')) return 'bash "{FILE}"';
  if (language === 'c' || lower.endsWith('.c')) return 'clang "{FILE}" -o /tmp/npp_c_out && /tmp/npp_c_out';
  if (language === 'cpp' || lower.endsWith('.cpp') || lower.endsWith('.cc')) {
    return 'clang++ "{FILE}" -o /tmp/npp_cpp_out && /tmp/npp_cpp_out';
  }
  if (language === 'php' || lower.endsWith('.php')) return 'php "{FILE}"';
  if (language === 'java' || lower.endsWith('.java')) return 'java "{FILE}"';
  return 'bash "{FILE}"';
}

function buildHeaders(token: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token.trim()) h['Authorization'] = `Bearer ${token.trim()}`;
  return h;
}

export async function checkTermuxHealth(
  config: TermuxConfig
): Promise<{ ok: boolean; home?: string; workspace?: string; error?: string }> {
  try {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/health`, {
      method: 'GET',
      headers: buildHeaders(config.token),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = (await res.json()) as { ok: boolean; home?: string; workspace?: string };
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unable to reach Termux bridge on 127.0.0.1:8765',
    };
  }
}

export async function execTermuxCommand(
  config: TermuxConfig,
  command: string,
  stdin = ''
): Promise<TermuxExecResult> {
  const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/exec`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    body: JSON.stringify({ command, cwd: config.cwd, stdin }),
  });
  return (await res.json()) as TermuxExecResult;
}

export async function runFileInTermux(
  config: TermuxConfig,
  filename: string,
  content: string,
  language: NppLanguage,
  stdin = ''
): Promise<TermuxExecResult> {
  const safeName = filename.includes('.') ? filename : `${filename.replace(/\s+/g, '_')}.${language === 'python' ? 'py' : 'sh'}`;
  const command = getTermuxRunTemplate(language, safeName);
  const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/run-file`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    body: JSON.stringify({ filename: safeName, content, command, stdin }),
  });
  return (await res.json()) as TermuxExecResult;
}

export async function listTermuxFiles(
  config: TermuxConfig,
  dir: string
): Promise<{ dir: string; items: TermuxFileItem[]; error?: string }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/ls?dir=${encodeURIComponent(dir)}`;
  const res = await fetch(url, { headers: buildHeaders(config.token) });
  return (await res.json()) as { dir: string; items: TermuxFileItem[]; error?: string };
}

export async function readTermuxFile(
  config: TermuxConfig,
  filePath: string
): Promise<{ path: string; content: string; error?: string }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/read?path=${encodeURIComponent(filePath)}`;
  const res = await fetch(url, { headers: buildHeaders(config.token) });
  return (await res.json()) as { path: string; content: string; error?: string };
}

export async function writeTermuxFile(
  config: TermuxConfig,
  filePath: string,
  content: string
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}/write`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    body: JSON.stringify({ path: filePath, content }),
  });
  return (await res.json()) as { ok?: boolean; error?: string };
}
