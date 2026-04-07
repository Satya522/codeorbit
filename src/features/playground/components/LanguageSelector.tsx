export function LanguageSelector() {
  const languages = ["JavaScript (Node)", "Python 3", "Java 21", "HTML/CSS/JS", "PostgreSQL"];
  return (
    <div className="relative">
      <select className="appearance-none bg-background border border-border text-white text-sm font-medium rounded-lg px-4 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-48">
        {languages.map(lang => <option key={lang}>{lang}</option>)}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none text-xs">▼</span>
    </div>
  );
}
