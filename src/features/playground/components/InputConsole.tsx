export function InputConsole() {
  return (
    <div className="h-32 border-t border-border bg-[#121212] flex flex-col">
       <div className="px-4 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Standard Input (stdin)</span>
      </div>
      <textarea className="flex-1 w-full bg-transparent resize-none p-3 text-sm font-mono text-zinc-300 focus:outline-none placeholder:text-zinc-700" placeholder="Provide input for your program here..."></textarea>
    </div>
  );
}
