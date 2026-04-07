export function OutputConsole() {
  return (
    <div className="flex-1 bg-[#0d0d0d] flex flex-col border-t border-border lg:border-t-0">
      <div className="px-4 py-2 border-b border-border bg-[#18181b] flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase tracking-wider">Output</span>
        <button className="text-xs text-zinc-500 hover:text-white">Clear</button>
      </div>
      <div className="flex-1 p-4 font-mono text-sm text-zinc-300 overflow-auto">
        <p className="text-zinc-500 mb-2">$ node index.js</p>
        <p>Hello, CodeOrbit Pioneer!</p>
        <p className="text-green-500 text-xs mt-4">✓ Process exited with code 0</p>
      </div>
    </div>
  );
}
