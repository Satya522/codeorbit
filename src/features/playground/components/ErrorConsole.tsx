export function ErrorConsole() {
  return (
    <div className="p-4 font-mono text-sm border-t border-red-500/20 bg-red-500/5 hidden">
      <p className="text-red-400">ReferenceError: greet is not defined</p>
      <p className="text-red-400/70 text-xs mt-1">at Object.&lt;anonymous&gt; (/app/index.js:5:1)</p>
    </div>
  );
}
