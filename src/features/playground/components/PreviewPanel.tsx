export function PreviewPanel() {
  return (
    <div className="flex-1 bg-white flex flex-col rounded-xl overflow-hidden hidden">
      <div className="w-full bg-zinc-200 border-b border-zinc-300 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 mx-4 bg-white rounded-md h-6 px-3 flex items-center text-xs text-zinc-500 shadow-sm border border-zinc-300">localhost:3000</div>
      </div>
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-medium bg-zinc-50">Browser Preview Rendered Here</div>
    </div>
  );
}
