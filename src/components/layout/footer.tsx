import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="relative -mt-3 overflow-hidden bg-[#04050a] pt-14 pb-4 md:-mt-4 md:pt-16 md:pb-5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute right-[8%] top-[10%] h-44 w-44 rounded-full bg-cyan-500/8 blur-[110px]" />
      </div>
      <div className="relative mx-auto grid max-w-[1400px] grid-cols-2 gap-x-7 gap-y-8 px-4 md:grid-cols-[1.35fr_repeat(3,minmax(180px,1fr))] md:items-start md:gap-x-8 md:px-6">
        <div className="col-span-2 max-w-sm space-y-4 md:col-span-1">
          <Link href="/" className="group relative inline-flex items-center gap-1 rounded-2xl transition-all duration-300 hover:scale-[1.01]">
            <div className="pointer-events-none absolute -inset-1 rounded-full bg-primary/10 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <Image
              src="/codeorbit-logo-mark-cropped.png"
              alt="CodeOrbit"
              width={526}
              height={394}
              className="relative z-10 h-12 w-12 object-contain drop-shadow-[0_0_14px_rgba(139,92,246,0.18)]"
            />
            <span className="relative z-10 -ml-0.5 text-[1.6rem] font-black leading-none tracking-[-0.055em] text-white">
              <span className="text-white">Code</span>
              <span className="bg-gradient-to-r from-primary via-violet-300 via-cyan-300 to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-gradient-x">
                Orbit
              </span>
            </span>
          </Link>
          <p className="max-w-[18rem] text-[15px] leading-[1.8] text-zinc-400">
            A focused coding platform for learning, practice, projects, and real developer growth.
          </p>
        </div>
        <div className="w-full max-w-[190px] justify-self-start">
          <h4 className="mb-3 pl-1 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc-100">Platform</h4>
          <ul className="space-y-1.5 text-[15px] text-zinc-300">
            <li><Link href="/learn" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Curriculum</Link></li>
            <li><Link href="/practice" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Practice</Link></li>
            <li><Link href="/dsa" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Core CS</Link></li>
            <li><Link href="/playground" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Sandbox</Link></li>
          </ul>
        </div>
        <div className="w-full max-w-[190px] justify-self-start">
          <h4 className="mb-3 pl-1 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc-100">Resources</h4>
          <ul className="space-y-1.5 text-[15px] text-zinc-300">
            <li><Link href="/projects" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Projects</Link></li>
            <li><Link href="/interview-prep" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Mock Teck</Link></li>
            <li><Link href="/ai-assistant" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Code Buddy</Link></li>
            <li><Link href="/case-study" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Case Study</Link></li>
          </ul>
        </div>
        <div className="w-full max-w-[190px] justify-self-start">
          <h4 className="mb-3 pl-1 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc-100">Legal</h4>
          <ul className="space-y-1.5 text-[15px] text-zinc-300">
            <li><Link href="/privacy-policy" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Privacy Policy</Link></li>
            <li><Link href="/terms-of-service" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Terms of Service</Link></li>
            <li><Link href="/open-source" className="group relative inline-flex rounded-lg px-1 py-1.5 leading-7 transition-all duration-300 hover:text-white"><span className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-violet-300/80 to-cyan-300/80 transition-transform duration-300 group-hover:scale-x-100" />Open Source</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative mx-auto mt-3 flex max-w-[1400px] justify-end px-4 pt-2 text-[13px] text-zinc-500 md:mt-4 md:px-6">
        <span>&copy; 2026 CodeOrbit. All rights reserved.</span>
      </div>
    </footer>
  );
};
