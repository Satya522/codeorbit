import { LanguageSelector } from "./LanguageSelector";
export function CompilerToolbar() {
  return (
    <div className="flex justify-between items-center p-2 bg-[#18181b] border-b border-border">
      <div className="flex gap-2">
        <LanguageSelector />
        <button className="px-3 py-1.5 rounded-lg border border-border text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center gap-2">
          <span>↻</span> Reset
        </button>
        <button className="px-3 py-1.5 rounded-lg border border-border text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center gap-2">
          <span>☀️</span> Theme
        </button>
      </div>
      <div className="flex gap-2">
        <button className="px-5 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors text-sm font-bold flex items-center gap-2 border border-green-500/20">
          <span>▶</span> Run Code
        </button>
      </div>
    </div>
  );
}
