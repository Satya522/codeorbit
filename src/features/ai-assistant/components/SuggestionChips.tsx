export function SuggestionChips({ modes }: { modes: { label: string, icon: string, color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {modes.map((mode) => (
        <button key={mode.label} className="px-3 py-1.5 bg-surface border border-border text-xs font-semibold text-zinc-300 rounded-lg hover:border-primary hover:text-white transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
          <span className={mode.color}>{mode.icon}</span> {mode.label}
        </button>
      ))}
    </div>
  );
}
