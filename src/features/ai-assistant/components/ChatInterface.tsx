import { SuggestionChips } from "./SuggestionChips";

export function ChatInterface() {
  const modes = [
    { label: "Explain Code", icon: "🧠", color: "text-purple-400" },
    { label: "Fix Error", icon: "🐛", color: "text-red-400" },
    { label: "Give Hint", icon: "💡", color: "text-yellow-400" },
    { label: "Mock Interview", icon: "🎯", color: "text-blue-400" },
    { label: "Concept Simplifier", icon: "📝", color: "text-green-400" },
  ];

  return (
    <div className="flex-1 flex flex-col glass-card sm:my-6 sm:rounded-3xl max-w-4xl mx-auto w-full shadow-2xl relative overflow-hidden h-full sm:h-[calc(100vh-7rem)]">
      <div className="px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h2 className="text-white font-bold flex items-center gap-2 tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></span> 
            CodeOrbit AI
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">GPT-4 Turbo Integrated Engine</p>
        </div>
        <button className="text-zinc-400 hover:text-white text-sm font-semibold glass-card px-4 py-1.5 rounded-lg transition-all hover:bg-white/10">Clear Chat</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth">
        {/* Empty State / Welcome */}
        <div className="text-center space-y-4 max-w-lg mx-auto mt-8 mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-inner border border-white/10">🤖</div>
          <h3 className="text-2xl font-black text-white tracking-tight">How can I help you?</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">I am context-aware. You can highlight code in the editor, paste an error message, or ask for a system design mock interview.</p>
        </div>
        
        {/* Example Mock Message */}
        <div className="flex gap-4 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/20 transform group-hover:scale-105 transition-transform">AI</div>
          <div className="glass-card rounded-2xl rounded-tl-sm p-5 text-zinc-200 text-sm max-w-[90%] md:max-w-[75%] leading-relaxed shadow-md border-white/5 border-l-0">
            <p>I notice you are having trouble with the <span className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded-md">Two Sum</span> problem in your playground. The nested loop approach gives <code className="bg-red-500/10 px-1.5 py-0.5 rounded-md text-red-400 border border-red-500/20">O(n²)</code> time complexity.</p>
            <p className="mt-3">Would you like a hint on how to solve it in <code className="bg-green-500/10 px-1.5 py-0.5 rounded-md text-green-400 border border-green-500/20">O(n)</code> time using a Hash Map?</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-black/40 backdrop-blur-xl border-t border-white/5 z-10 w-full">
        <SuggestionChips modes={modes} />
        <div className="flex gap-3 relative mt-4">
          <textarea 
            rows={1}
            placeholder="Ask AI to explain, fix, or optimize..." 
            className="w-full glass-card rounded-xl px-5 py-4 pl-4 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[56px] max-h-32 text-sm transition-all shadow-inner placeholder:text-zinc-500 border border-border"
          />
          <button className="absolute right-3 top-3 bottom-3 aspect-square bg-white text-black rounded-lg font-black text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:scale-105 transition-all flex items-center justify-center cursor-pointer">
            ↑
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-500 mt-4 font-medium uppercase tracking-widest">AI can make mistakes. Verify critical code before pushing.</p>
      </div>
    </div>
  );
}