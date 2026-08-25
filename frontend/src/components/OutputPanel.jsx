function OutputPanel({ result }) {
  return (
    <div className="bg-black text-white font-mono text-sm rounded-md p-4 h-full overflow-auto whitespace-pre-wrap">
      {!result && (
        <span className="text-gray-500">Output will appear here after you run your code...</span>
      )}

      {result?.compileError && (
        <div className="text-red-400">
          <div className="text-gray-400 mb-1">— Compile Error —</div>
          {result.compileError}
        </div>
      )}

      {result?.error && (
        <div className="text-red-400">{result.error}</div>
      )}

      {result?.stdout && (
        <div className="text-green-400">{result.stdout}</div>
      )}

      {result?.stderr && (
        <div className="text-red-400 mt-2">
          <div className="text-gray-400 mb-1">— Stderr —</div>
          {result.stderr}
        </div>
      )}
    </div>
  );
}

export default OutputPanel;