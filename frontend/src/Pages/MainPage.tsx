import Editor from '@monaco-editor/react';
import { Terminal } from '@xterm/xterm';
import { useEffect, useRef, useState } from 'react';
import '../styles/MainPage.css';
import { useAuth } from '../utils/AuthContext';

const backendUrl = (import.meta as any).env?.VITE_BACKEND;

// ─── Language types ───────────────────────────────────────────────────────
type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp';

type Execution = {
  output:   string;
  language: SupportedLanguage;
  success:  boolean;
};

type RunResult = {
  stdout?:          string;
  stderr?:          string;
  exitCode?:        number;
  compileError?:    string;
  error?:           string;
  stdoutTruncated?: boolean;
  stderrTruncated?: boolean;
};

// ─── Call the real backend ─────────────────────────────────────────────────
async function runOnBackend(language: SupportedLanguage, code: string): Promise<RunResult> {
  try {
    const res = await fetch(`${backendUrl}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code }),
    });

    const data: RunResult = await res.json();

    if (!res.ok) {
      return { error: (data as any).error || 'Request failed' };
    }

    return data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { error: `Could not reach backend: ${msg}` };
  }
}

// ─── Component ────────────────────────────────────────────────────────────
function MainPage() {
  const { user, logout } = useAuth();

  const terminalRef         = useRef<HTMLDivElement | null>(null);
  const appShellRef         = useRef<HTMLDivElement | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);

  const [state,          setState]          = useState<string>('');
  const [lang,           setLang]           = useState<SupportedLanguage>('javascript');
  const [exec,           setExec]           = useState<Execution[]>([]);
  const [code,           setCode]           = useState<string>('');
  const [historyWidth,   setHistoryWidth]   = useState(200);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [isDraggingV,    setIsDraggingV]    = useState(false);
  const [isDraggingH,    setIsDraggingH]    = useState(false);

  const LANGUAGES: SupportedLanguage[] = ['javascript', 'python', 'java', 'cpp'];

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
      terminal.write('\x1b[36mCodeSphere ready.\x1b[0m\r\n');
      terminal.write('\x1b[90mSelect a language, write code, then press Run.\x1b[0m\r\n\r\n');
    }

    terminalInstanceRef.current = terminal;
    return () => terminal.dispose();
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

    const result = await runOnBackend(lang, code);

    // Case 1: request-level or timeout error
    if (result.error) {
      writeLine('─── Error ─────────────────────────────', 'red');
      writeLine(result.error, 'red');
      writeLine('────────────────────────────────────', 'red');
      addExecution({ output: '', language: lang, success: false });
      setState('Error');
      setTimeout(() => setState(''), 2500);
      return;
    }

    // Case 2: compile-time error (only relevant for cpp/java)
    if (result.compileError) {
      writeLine('─── Compile Error ─────────────────────', 'red');
      result.compileError.split('\n').forEach((line) => writeLine(line, 'red'));
      writeLine('────────────────────────────────────', 'red');
      addExecution({ output: '', language: lang, success: false });
      setState('Error');
      setTimeout(() => setState(''), 2500);
      return;
    }

    // Case 3: normal run result
    const stdout = result.stdout ?? '';
    const stderr = result.stderr ?? '';

    if (stdout) {
      writeLine('─── Output ────────────────────────────', 'cyan');
      stdout.split('\n').forEach((line) => writeLine(line));
      if (result.stdoutTruncated) writeLine('[output truncated]', 'yellow');
      writeLine('────────────────────────────────────', 'cyan');
    }

    if (stderr) {
      writeLine('─── Stderr ─────────────────────────────', 'red');
      stderr.split('\n').forEach((line) => writeLine(line, 'red'));
      if (result.stderrTruncated) writeLine('[output truncated]', 'yellow');
      writeLine('────────────────────────────────────', 'red');
    }

    const success = (result.exitCode ?? 1) === 0;
    addExecution({ output: stdout, language: lang, success });
    setState(success ? 'Done' : 'Error');
    setTimeout(() => setState(''), 2500);
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
          language={lang === 'cpp' ? 'cpp' : lang}
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