import Editor from '@monaco-editor/react';
import { Terminal } from '@xterm/xterm';
import { useEffect, useRef, useState } from 'react';
import '../styles/MainPage.css';
import { useAuth } from '../utils/AuthContext';
import { io, Socket } from 'socket.io-client';

const backendUrl = (import.meta as any).env?.VITE_BACKEND;

// ─── Socket event types ───────────────────────────────────────────────────
type ServerToClientEvents = {
  jobResult:      (result: { success: boolean; output?: string; error?: string }) => void;
  error:          (error: { message: string }) => void;
  executionSaved: (data: { id: string }) => void;
};

type ClientToServerEvents = {
  SubscribeToJob: (jobId: string) => void;
  saveExecution:  (payload: SavePayload) => void;
};

type SavePayload = {
  userId:    string | undefined;
  language:  SupportedLanguage;
  code:      string;
  output:    string;
  error:     string;
  timestamp: string;
};

// ─── Language types ───────────────────────────────────────────────────────
type SupportedLanguage =
  | 'javascript' | 'typescript'
  | 'python'
  | 'java' | 'cpp' | 'c'
  | 'json' | 'html' | 'css';

type Execution = {
  output:   string;
  language: SupportedLanguage;
  success:  boolean;
};

type RunResult = { output: string; error: string };

// ─── Worker source builder ────────────────────────────────────────────────
function buildWorkerSource(lang: SupportedLanguage, code: string): string {

  // ── JavaScript / TypeScript ──────────────────────────────────────────
  if (lang === 'javascript' || lang === 'typescript') {
    const stripped =
      lang === 'typescript'
        ? code
            .replace(/:\s*\w+(\[\])?(\s*[|&]\s*\w+(\[\])?)*(?=[,)=;\n])/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/^\s*interface\s+\w+[^}]+}/gm, '')
            .replace(/^\s*type\s+\w+[^;]+;/gm, '')
        : code;

    const escaped = JSON.stringify(stripped);
    return `
self.onmessage = function() {
  const logs = [];
  const errors = [];
  const fakeConsole = {
    log:   (...a) => logs.push(a.map(String).join(' ')),
    warn:  (...a) => logs.push('[warn] ' + a.map(String).join(' ')),
    error: (...a) => errors.push(a.map(String).join(' ')),
    info:  (...a) => logs.push('[info] ' + a.map(String).join(' ')),
  };
  try {
    const fn = new Function('console', ${escaped});
    fn(fakeConsole);
    self.postMessage({ output: logs.join('\\n'), error: errors.join('\\n') });
  } catch(e) {
    self.postMessage({ output: logs.join('\\n'), error: e.message });
  }
};`;
  }

  // ── Python (Pyodide) ─────────────────────────────────────────────────
  if (lang === 'python') {
    const escaped = JSON.stringify(code);
    return `
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
self.onmessage = async function() {
  try {
    const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
    await pyodide.runPythonAsync(\`
import sys
from io import StringIO
_out = StringIO()
_err = StringIO()
sys.stdout = _out
sys.stderr = _err
\`);
    let userError = '';
    try {
      await pyodide.runPythonAsync(${escaped});
    } catch(e) {
      userError = e.message;
    }
    const stdout = await pyodide.runPythonAsync('_out.getvalue()');
    const stderr = await pyodide.runPythonAsync('_err.getvalue()');
    self.postMessage({ output: stdout || '', error: stderr || userError });
  } catch(e) {
    self.postMessage({ output: '', error: e.message });
  }
};`;
  }

  // ── C / C++ (via backend proxy → Wandbox) ────────────────────────────
  if (lang === 'c' || lang === 'cpp') {
    const apiLang = lang === 'cpp' ? 'cpp' : 'c';
    const escaped  = JSON.stringify(code);
    return `
self.onmessage = async function() {
  try {
    const res = await fetch('${backendUrl}/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ${escaped}, language: '${apiLang}' }),
    });
    const data = await res.json();
    if (!res.ok) {
      self.postMessage({ output: '', error: data.error || 'Compile request failed' });
      return;
    }
    const compilerErr = data.compilerError || '';
    const runtimeErr  = data.error        || '';
    const errorOut    = [compilerErr, runtimeErr].filter(Boolean).join('\\n');
    self.postMessage({
      output: data.output || '',
      error:  data.success ? errorOut : (errorOut || 'Compilation failed'),
    });
  } catch(e) {
    self.postMessage({ output: '', error: 'Could not reach compile service: ' + e.message });
  }
};`;
  }

  // ── Java (CheerpJ 3) ─────────────────────────────────────────────────
  if (lang === 'java') {
    const escaped = JSON.stringify(code);
    return `
importScripts('https://cjrtnc.leaningtech.com/3.0/cj3loader.js');
self.onmessage = async function() {
  const output = [];
  try {
    await cheerpjInit({
      version: 21,
      javaProperties: ['java.io.tmpdir=/str/tmp'],
      printErr: (line) => output.push('[stderr] ' + line),
      print:    (line) => output.push(line),
    });
    const className = (() => {
      const m = ${escaped}.match(/public\\s+class\\s+(\\w+)/);
      return m ? m[1] : 'Main';
    })();
    const srcPath = '/str/' + className + '.java';
    await cheerpjFileBlob(srcPath, new TextEncoder().encode(${escaped}));
    const exitCode = await cheerpjRunMain(
      'com.sun.tools.javac.Main',
      '/app/tools.jar:/str/',
      srcPath, '-d', '/str/'
    );
    if (exitCode !== 0) {
      self.postMessage({ output: output.join('\\n'), error: 'Compilation failed' });
      return;
    }
    await cheerpjRunMain(className, '/str/');
    self.postMessage({ output: output.join('\\n'), error: '' });
  } catch(e) {
    self.postMessage({ output: output.join('\\n'), error: e.message });
  }
};`;
  }

  // ── Fallback (json / html / css) ─────────────────────────────────────
  return `
self.onmessage = function() {
  self.postMessage({
    output: 'Preview not available for ${lang} in the terminal.',
    error: '',
  });
};`;
}

// ─── Run in worker ────────────────────────────────────────────────────────
function runInWorker(lang: SupportedLanguage, code: string, timeoutMs = 30_000): Promise<RunResult> {
  return new Promise((resolve) => {
    const src    = buildWorkerSource(lang, code);
    const blob   = new Blob([src], { type: 'application/javascript' });
    const url    = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ output: '', error: `Execution timed out after ${timeoutMs / 1000}s` });
    }, timeoutMs);

    worker.onmessage = ({ data }: MessageEvent<RunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(data);
    };

    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ output: '', error: e.message ?? 'Unknown worker error' });
    };

    worker.postMessage(null);
  });
}

// ─── Component ────────────────────────────────────────────────────────────
function MainPage() {
  const { user, logout } = useAuth();

  const terminalRef         = useRef<HTMLDivElement | null>(null);
  const appShellRef         = useRef<HTMLDivElement | null>(null);
  const socketRef           = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  const [state,          setState]          = useState<string>('');
  const [lang,           setLang]           = useState<SupportedLanguage>('javascript');
  const [exec,           setExec]           = useState<Execution[]>([]);
  const [code,           setCode]           = useState<string>('');
  const [historyWidth,   setHistoryWidth]   = useState(200);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [isDraggingV,    setIsDraggingV]    = useState(false);
  const [isDraggingH,    setIsDraggingH]    = useState(false);

  const LANGUAGES: SupportedLanguage[] = [
    'javascript', 'typescript', 'python',
    'java', 'cpp', 'c',
    'json', 'html', 'css',
  ];

  const term = () => terminalInstanceRef.current;

  const writeLine = (text: string, color?: 'red' | 'green' | 'yellow' | 'cyan') => {
    const codes: Record<string, string> = {
      red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
    };
    const reset  = '\x1b[0m';
    const prefix = color ? codes[color] : '';
    const suffix = color ? reset : '';
    term()?.write(`${prefix}${text}${suffix}\r\n`);
  };

  const addExecution = (e: Execution) =>
    setExec((prev) => [e, ...prev].slice(0, 5));

  // ── Terminal init ────────────────────────────────────────────────────
  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily:  '"JetBrains Mono", "Fira Code", monospace',
      fontSize:    13,
      theme: {
        background: '#0a0a14',
        foreground: '#ddd8f0',
        cursor:     '#a78bfa',
        black:      '#1a1a2e',
        green:      '#4ade80',
        red:        '#f87171',
        yellow:     '#facc15',
        cyan:       '#22d3ee',
      },
    });

    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      terminal.write('\x1b[36mWASM Shell ready.\x1b[0m\r\n');
      terminal.write('\x1b[90mSelect a language, write code, then press Run.\x1b[0m\r\n\r\n');
    }

    terminalInstanceRef.current = terminal;
    return () => terminal.dispose();
  }, []);

  // ── Socket.IO ────────────────────────────────────────────────────────
  useEffect(() => {
    const backendUrl = (import.meta as any).env.VITE_BACKEND;
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(backendUrl, {
      reconnection:         true,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('executionSaved', ({ id }) => writeLine(`✓ Saved (id: ${id})`, 'green'));
    socket.on('error', (err) => writeLine(`Socket error: ${err.message}`, 'red'));
    socket.on('connect_error', (err) => console.error('Socket.IO error:', err));

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Vertical resize ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isDraggingV) return;
    const onMove = (e: MouseEvent) => {
      const rect = appShellRef.current?.getBoundingClientRect();
      if (!rect) return;
      setHistoryWidth(Math.max(100, Math.min(rect.width * 0.4, e.clientX - rect.left)));
    };
    const onUp = () => setIsDraggingV(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingV]);

  // ── Horizontal resize ────────────────────────────────────────────────
  useEffect(() => {
    if (!isDraggingH) return;
    const onMove = (e: MouseEvent) => {
      const rect = appShellRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTerminalHeight(Math.max(80, Math.min(rect.height * 0.6, rect.bottom - e.clientY)));
    };
    const onUp = () => setIsDraggingH(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor     = 'row-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingH]);

  // ── Run handler ──────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!code.trim()) {
      writeLine('Error: editor is empty — write some code first.', 'red');
      return;
    }

    setState('Running…');
    terminalInstanceRef.current?.clear();

    try {
      const result = await runInWorker(lang, code, 60_000);

      if (result.output) {
        writeLine('─── Output ────────────────────────────', 'cyan');
        result.output.split('\n').forEach((line) => writeLine(line));
        writeLine('────────────────────────────────────', 'cyan');
      }

      if (result.error) {
        writeLine('─── Error ─────────────────────────────', 'red');
        result.error.split('\n').forEach((line) => writeLine(line, 'red'));
        writeLine('────────────────────────────────────', 'red');
      }

      const success = !result.error;

      addExecution({ output: result.output, language: lang, success });

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('saveExecution', {
          userId:    user?.id,
          language:  lang,
          code,
          output:    result.output,
          error:     result.error,
          timestamp: new Date().toISOString(),
        });
      }

      setState(success ? 'Done' : 'Error');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      writeLine(`Fatal: ${msg}`, 'red');
      setState('Error');
    } finally {
      setTimeout(() => setState(''), 2500);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className="AppShell"
      ref={appShellRef}
      style={{
        '--history-width':   `${historyWidth}px`,
        '--terminal-height': `${terminalHeight}px`,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="TitleCard">
        <div className="TitleCard__brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="7" fill="#7c3aed"/>
            <path d="M7 10l5 4-5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 18h7" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>CodeSphere</span>
        </div>

        <div className="TitleCard__langWrap">
          <select
            className="LangSelect"
            value={lang}
            onChange={(e) => setLang(e.target.value as SupportedLanguage)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="StatusCard" data-state={state || undefined}>
          {state || 'Idle'}
        </div>

        <button className="RunButton" onClick={handleRun} title="Run">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 1.5l9 4.5-9 4.5V1.5z"/>
          </svg>
          Run
        </button>

        <div className="UserCard">
          <div className="UserCard__avatar" />
          {user ? (
            <>
              <span className="UserCard__name">{user.user_metadata?.full_name ?? user.email}</span>
              <button className="UserCard__logout" onClick={logout}>Logout</button>
            </>
          ) : (
            <span className="UserCard__name">Not logged in</span>
          )}
        </div>
      </div>

      {/* History */}
      <div className="History">
        <div className="History__label">Recent</div>
        {exec.length === 0 && <div className="History__empty">No runs yet</div>}
        {exec.map((run, i) => (
          <div
            key={i}
            className="HistoryItem"
            data-success={run.success}
            title={run.output.slice(0, 120)}
          >
            <span className="HistoryItem__lang">{run.language}</span>
            <span className="HistoryItem__icon">{run.success ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>

      {/* Vertical resize */}
      <div
        className={`ResizeDividerV${isDraggingV ? ' dragging' : ''}`}
        onMouseDown={() => setIsDraggingV(true)}
      />

      {/* Monaco editor */}
      <div className="IDE">
        <Editor
          height="100%"
          width="100%"
          theme="vs-dark"
          language={lang}
          value={code}
          onChange={(v) => setCode(v ?? '')}
          options={{
            automaticLayout:          true,
            fontSize:                 14,
            fontFamily:               '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures:            true,
            minimap:                  { enabled: false },
            scrollBeyondLastLine:     false,
            renderLineHighlight:      'all',
            bracketPairColorization:  { enabled: true },
          }}
        />
      </div>

      {/* Horizontal resize */}
      <div
        className={`ResizeDividerH${isDraggingH ? ' dragging' : ''}`}
        onMouseDown={() => setIsDraggingH(true)}
      >
        <span className="ResizeDividerH__grip" />
      </div>

      {/* Terminal */}
      <div className="Terminal" ref={terminalRef} />
    </div>
  );
}

export default MainPage;