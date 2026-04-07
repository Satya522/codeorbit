export function EditorPanel() {
  return (
    <div className="flex-1 bg-[#1e1e1e] relative group flex flex-col">
      <div className="flex text-xs font-mono text-zinc-500 border-b border-zinc-800 bg-[#1e1e1e]">
        <div className="px-4 py-2 border-r border-zinc-800 bg-[#1e1e1e] text-zinc-300 border-t-2 border-t-primary cursor-pointer">index.js</div>
        <div className="px-4 py-2 border-r border-zinc-800 hover:bg-zinc-800/50 cursor-pointer">utils.js</div>
      </div>
      <div className="flex-1 p-6 font-mono text-sm text-zinc-300 overflow-auto">
        <div className="flex">
          <div className="text-zinc-600 text-right pr-4 select-none flex flex-col items-end">
            {[...Array(15)].map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <div className="flex-1 cursor-text">
            <p><span className="text-blue-400">const</span> <span className="text-yellow-200">greet</span> = <span className="text-purple-400">(name) =&gt;</span> {'{'}</p>
            <p className="pl-4"><span className="text-cyan-400">console</span>.log(<span className="text-orange-300">{"`Hello, ${name}!`"}</span>);</p>
            <p>{'}'};</p>
            <br/>
            <p><span className="text-yellow-200">greet</span>(<span className="text-orange-300">&quot;CodeOrbit Pioneer&quot;</span>);</p>
          </div>
        </div>
      </div>
    </div>
  );
}
