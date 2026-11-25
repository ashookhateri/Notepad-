import { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { NppLanguage, SearchHit, SearchOptions } from '../types/editor';

export interface LanguageMeta {
  id: NppLanguage;
  label: string;
  statusLabel: string;
  extensions: string[];
  lineComment: string;
}

export const NPP_LANGUAGES: LanguageMeta[] = [
  { id: 'plaintext', label: 'Normal text', statusLabel: 'Normal text file', extensions: ['txt', 'log', 'text', ''], lineComment: '' },
  { id: 'c', label: 'C', statusLabel: 'C source file', extensions: ['c', 'h'], lineComment: '//' },
  { id: 'cpp', label: 'C++', statusLabel: 'C++ source file', extensions: ['cpp', 'hpp', 'cc', 'cxx', 'hxx'], lineComment: '//' },
  { id: 'css', label: 'CSS', statusLabel: 'Cascade Style Sheets file', extensions: ['css', 'scss', 'less'], lineComment: '/*' },
  { id: 'html', label: 'HTML', statusLabel: 'Hyper Text Markup Language file', extensions: ['html', 'htm', 'shtml'], lineComment: '<!--' },
  { id: 'ini', label: 'INI file', statusLabel: 'MS INI file', extensions: ['ini', 'cfg', 'conf', 'properties', 'env'], lineComment: ';' },
  { id: 'java', label: 'Java', statusLabel: 'Java source file', extensions: ['java'], lineComment: '//' },
  { id: 'javascript', label: 'JavaScript', statusLabel: 'JavaScript file', extensions: ['js', 'mjs', 'cjs', 'jsx'], lineComment: '//' },
  { id: 'json', label: 'JSON', statusLabel: 'JSON file', extensions: ['json', 'jsonc', 'webmanifest'], lineComment: '' },
  { id: 'markdown', label: 'Markdown', statusLabel: 'Markdown file', extensions: ['md', 'markdown'], lineComment: '<!--' },
  { id: 'php', label: 'PHP', statusLabel: 'PHP Hypertext Preprocessor file', extensions: ['php', 'phtml'], lineComment: '//' },
  { id: 'python', label: 'Python', statusLabel: 'Python file', extensions: ['py', 'pyw'], lineComment: '#' },
  { id: 'bash', label: 'Shell', statusLabel: 'UNIX script file', extensions: ['sh', 'bash', 'zsh', 'bat', 'cmd'], lineComment: '#' },
  { id: 'sql', label: 'SQL', statusLabel: 'Structured Query Language file', extensions: ['sql'], lineComment: '--' },
  { id: 'typescript', label: 'TypeScript', statusLabel: 'TypeScript file', extensions: ['ts', 'tsx'], lineComment: '//' },
  { id: 'xml', label: 'XML', statusLabel: 'eXtensible Markup Language file', extensions: ['xml', 'svg', 'xsl', 'plist', 'csproj'], lineComment: '<!--' },
  { id: 'yaml', label: 'YAML', statusLabel: 'YAML Ain\'t Markup Language', extensions: ['yml', 'yaml'], lineComment: '#' },
];

export function detectLanguageFromFilename(filename: string): NppLanguage {
  const parts = filename.toLowerCase().split('.');
  if (parts.length < 2) return 'plaintext';
  const ext = parts[parts.length - 1];
  const found = NPP_LANGUAGES.find((l) => l.extensions.includes(ext));
  return found ? found.id : 'plaintext';
}

export function getLanguageMeta(lang: NppLanguage): LanguageMeta {
  return NPP_LANGUAGES.find((l) => l.id === lang) || NPP_LANGUAGES[0];
}

export function getCodeMirrorLanguageExtension(lang: NppLanguage): Extension {
  switch (lang) {
    case 'javascript':
      return javascript({ jsx: true });
    case 'typescript':
      return javascript({ jsx: true, typescript: true });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'python':
      return python();
    case 'xml':
      return xml();
    case 'markdown':
      return markdown();
    case 'sql':
      return sql();
    case 'c':
    case 'cpp':
      return cpp();
    case 'java':
      return java();
    case 'php':
      return php();
    default:
      return [];
  }
}

export interface FunctionSymbol {
  name: string;
  kind: 'function' | 'class' | 'heading' | 'key';
  line: number;
}

export function extractFunctionSymbols(content: string, language: NppLanguage): FunctionSymbol[] {
  const lines = content.split(/\r?\n/);
  const symbols: FunctionSymbol[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (language === 'javascript' || language === 'typescript' || language === 'php') {
      const fnMatch = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (fnMatch) {
        symbols.push({ name: `${fnMatch[1]}()`, kind: 'function', line: lineNum });
        continue;
      }
      const arrowMatch = line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
      if (arrowMatch) {
        symbols.push({ name: `${arrowMatch[1]}()`, kind: 'function', line: lineNum });
        continue;
      }
      const classMatch = line.match(/^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/);
      if (classMatch) {
        symbols.push({ name: classMatch[1], kind: 'class', line: lineNum });
        continue;
      }
      const methodMatch = line.match(/^\s{2,}(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
        symbols.push({ name: `.${methodMatch[1]}()`, kind: 'function', line: lineNum });
      }
    } else if (language === 'python') {
      const defMatch = line.match(/^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)\s*\(/);
      if (defMatch) {
        symbols.push({ name: `${defMatch[1]}()`, kind: 'function', line: lineNum });
        continue;
      }
      const clsMatch = line.match(/^\s*class\s+([A-Za-z_][\w]*)/);
      if (clsMatch) {
        symbols.push({ name: clsMatch[1], kind: 'class', line: lineNum });
      }
    } else if (language === 'c' || language === 'cpp' || language === 'java') {
      const clsMatch = line.match(/^\s*(?:public\s+|private\s+|protected\s+)?class\s+([A-Za-z_][\w]*)/);
      if (clsMatch) {
        symbols.push({ name: clsMatch[1], kind: 'class', line: lineNum });
        continue;
      }
      const fnMatch = line.match(/^\s*(?:public|private|protected|static|virtual|inline|\w+[\w<>*&\s]+)\s+([A-Za-z_][\w]*)\s*\([^;]*\)\s*(?:\{|$)/);
      if (fnMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(fnMatch[1])) {
        symbols.push({ name: `${fnMatch[1]}()`, kind: 'function', line: lineNum });
      }
    } else if (language === 'markdown') {
      const hdMatch = line.match(/^(#{1,4})\s+(.+)/);
      if (hdMatch) {
        symbols.push({ name: `${hdMatch[1]} ${hdMatch[2].trim()}`, kind: 'heading', line: lineNum });
      }
    } else if (language === 'html' || language === 'xml') {
      const idMatch = line.match(/<(h[1-3]|section|header|main|footer|form|script)[^>]*?(?:id=["']([^"']+)["'])?[^>]*>/i);
      if (idMatch) {
        const label = idMatch[2] ? `<${idMatch[1]}#${idMatch[2]}>` : `<${idMatch[1]}>`;
        symbols.push({ name: label, kind: 'heading', line: lineNum });
      }
    } else if (language === 'css') {
      const selMatch = line.match(/^\s*([.#@]?[A-Za-z0-9_-][^{};/]*?)\s*\{/);
      if (selMatch) {
        symbols.push({ name: selMatch[1].trim(), kind: 'key', line: lineNum });
      }
    } else if (language === 'json') {
      const keyMatch = line.match(/^\s{2}"([^"]+)"\s*:/);
      if (keyMatch) {
        symbols.push({ name: keyMatch[1], kind: 'key', line: lineNum });
      }
    }
  }

  return symbols;
}

export function decodeExtendedSearchTerm(query: string): string {
  return query
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\0/g, '\0')
    .replace(/\\\\/g, '\\');
}

export function compileSearchRegex(options: SearchOptions): RegExp | null {
  if (!options.query) return null;
  let pattern = options.query;

  if (options.mode === 'normal') {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  } else if (options.mode === 'extended') {
    const decoded = decodeExtendedSearchTerm(pattern);
    pattern = decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }

  const flags = options.matchCase ? 'g' : 'gi';
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

export function findMatchesInDocument(
  docId: string,
  docTitle: string,
  docPath: string,
  content: string,
  options: SearchOptions
): SearchHit[] {
  const regex = compileSearchRegex(options);
  if (!regex) return [];

  const hits: SearchHit[] = [];
  const lines = content.split('\n');
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineStr = lines[i];
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(lineStr)) !== null) {
      if (m[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      hits.push({
        docId,
        docTitle,
        docPath,
        line: i + 1,
        col: m.index + 1,
        from: offset + m.index,
        to: offset + m.index + m[0].length,
        lineText: lineStr,
        matchText: m[0],
      });
      if (hits.length >= 2000) return hits;
    }
    offset += lineStr.length + 1;
  }

  return hits;
}

export function toProperCase(text: string): string {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
}

export async function computeSHA256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function encodeBase64Unicode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

export function decodeBase64Unicode(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
