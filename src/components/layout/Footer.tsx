import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 mt-auto bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-6 text-[10px] font-bold text-white/30 uppercase tracking-widest">
          <a href="https://discord.gg/tmNsUH8xVQ" className="hover:text-white transition-colors">Discord</a>
          <Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link>
        </div>
        <div className="text-[10px] font-medium text-white/20">
          TMG LIST &bull; <span className="text-white/40 font-mono italic">V-CORE.NEXT.15</span>
        </div>
      </div>
    </footer>
  );
}
