import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Menu, X, Trophy, Swords, Users, BarChart2, FileUp, Languages, LogIn, LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";

const navItems = [
  { key: "nav.demonList", path: "/top", icon: Trophy },
  { key: "nav.futureList", path: "/future", icon: Swords },
  { key: "nav.players", path: "/players", icon: Users },
  { key: "nav.statistics", path: "/stats", icon: BarChart2 },
  { key: "nav.submit", path: "/submit", icon: FileUp },
];

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, isAdmin, logout } = useAuth();


  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-purple-500/20">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              OBSIDIAN <span className="text-purple-400 font-black italic">LIST</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2",
                      isActive ? "text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.key)}
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 border border-[#a855f7]/50 bg-[#a855f7]/10 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin" className="p-2 text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-md transition-colors" title="Admin Dashboard">
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <Link 
                  to={`/player/${encodeURIComponent(user.email?.split('@')[0] || '')}`} 
                  className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/35 rounded-full text-xs text-white/90 hover:text-purple-300 transition-all duration-300 flex items-center gap-2 max-w-[150px] shadow-sm shadow-purple-500/5 hover:shadow-purple-500/10"
                >
                  <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate font-semibold tracking-wide font-mono">{user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
               <Link
                 to="/login"
                 className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
                 title="Login"
               >
                 <LogIn className="w-4 h-4" />
                 <span>Login</span>
               </Link>
            )}

            <button 
              onClick={toggleLanguage}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ml-1"
              title="Change Language"
            >
              <Languages className="w-4 h-4" />
              <span className="uppercase text-xs font-bold">{i18n.language.substring(0, 2)}</span>
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="text-zinc-400 hover:text-white p-2"
            >
              <span className="uppercase text-xs font-bold">{i18n.language.substring(0, 2)}</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white p-2"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-white/5 bg-[#050507]/95 backdrop-blur-xl shadow-2xl"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <item.icon className="w-5 h-5" />
                {t(item.key)}
              </Link>
            ))}
            
            <div className="h-px bg-white/10 my-2 mx-3"></div>
            
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-purple-400 hover:text-purple-300 hover:bg-white/5"
                  >
                    <Settings className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                )}
                <Link 
                  to={`/player/${encodeURIComponent(user.email?.split('@')[0] || '')}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-base font-medium text-white/80 hover:text-purple-400 transition-colors"
                >
                  <User className="w-5 h-5 text-purple-400 shrink-0" />
                  <span className="truncate">{user.email?.split('@')[0]}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-white/5"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <LogIn className="w-5 h-5" />
                Login / Register
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
