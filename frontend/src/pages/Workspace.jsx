import { useState } from "react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "../components/LanguageSelector";
import OutputPanel from "../components/OutputPanel";
import { useAuth } from "../utils/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


function Workspace() {
  const { user, logout } = useAuth();


  const [code, setCode] = useState(""); 
  const [language, setLanguage] = useState("cpp");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

   const handleRun = async () => {
    if(!code.trim())return;
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: `Could not reach backend: ${err.message}` });
    } finally {
      setRunning(false);
    }
  };

  const status = running
    ? { text: "Running", color: "bg-yellow-500" }
    : result?.error || result?.compileError || result?.stderr
    ? { text: "Error", color: "bg-red-500" }
    : result
    ? { text: "Success", color: "bg-green-500" }
    : { text: "Idle", color: "bg-gray-400" };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            CS
          </div>
          <span className="font-semibold">CodeSphere</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector language={language} onLanguageChange={setLanguage} />

          <Button onClick={handleRun} disabled={running}>
            {running ? "Running..." : "Run"}
          </Button>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${status.color}`} />
            {status.text}
          </div>

          {user && (
            <div className="flex items-center gap-2 pl-3 border-l">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="w-1/2 flex flex-col border-r p-4">
          <span className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Editor
          </span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            spellCheck={false}
            className="flex-1 resize-none rounded-md border bg-muted/30 p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Output */}
        <div className="w-1/2 flex flex-col p-4">
          <span className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Output
          </span>
          <div className="flex-1 overflow-auto ">
            <OutputPanel result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
