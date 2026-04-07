export function PlaygroundHeader() {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-surface border-b border-border">
      <div className="flex items-center gap-3">
        <h2 className="text-white font-bold tracking-tight">CodeSandbox</h2>
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-xs text-zinc-400 font-medium">Draft - Untitled</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2">
          <span>⚙️</span> Settings
        </button>
        <button className="px-4 py-1.5 bg-primary text-white rounded-md shadow hover:bg-primary/90 transition-colors text-sm font-bold flex items-center gap-2">
          Share
        </button>
      </div>
    </div>
  );
}
