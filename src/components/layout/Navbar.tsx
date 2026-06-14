import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Menu, X, Trophy, Swords, Users, BarChart2, FileUp, Languages, LogIn, LogOut, Settings, User, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { handleFirestoreError, OperationType } from "@/lib/firebaseError";

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
  const { user, isAdmin, isElderModer, isModerator, logout } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user || !user.email) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(db, "notifications"),
      where("userEmail", "==", user.email.trim().toLowerCase())
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(list);
    }, (err) => {
      console.error("Failed to subscription user notifications:", err);
      handleFirestoreError(err, OperationType.LIST, "notifications");
    });
    
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const promises = notifications.filter(n => !n.read).map(n => 
        updateDoc(doc(db, "notifications", n.id), { read: true })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };


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
            <img 
              src="logo.png" 
              alt="TMG Demon List Logo" 
              className="h-8 w-auto object-contain transform group-hover:scale-105 transition-transform duration-300" 
            />
            <span className="font-heading font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              TMG <span className="text-purple-400 font-black italic">LIST</span>
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
                {(isAdmin || isElderModer || isModerator) && (
                  <Link to="/admin" className="p-2 text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-md transition-colors" title={t("navbar.adminDashboard") }>
                    <Settings className="w-4 h-4" />
                  </Link>
                )}

                {/* Real-time Notifications Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) {
                        markAllAsRead();
                      }
                    }}
                    className={cn(
                      "p-2 rounded-md transition-colors relative focus:outline-none",
                      showNotifications ? "text-purple-400 bg-white/5" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                    title={t("navbar.notifications")}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-4 z-50 text-xs text-white max-h-96 overflow-y-auto backdrop-blur-xl">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                        <span className="font-bold tracking-wide text-[10px] uppercase text-zinc-400">{t("notifications.title")}</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[10px] text-purple-400 hover:underline">{t("notifications.markAllAsRead")}</button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={cn(
                              "p-2.5 rounded-lg border leading-relaxed",
                              notif.read ? "bg-black/20 border-white/5 text-white/50" : "bg-purple-950/20 border-purple-500/20 text-white"
                            )}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold">Level: <span className="text-zinc-200">{notif.levelName}</span> ({notif.progress}%)</span>
                              <span className={cn(
                                "text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full select-none",
                                notif.status === 'accepted' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/10" : "bg-pink-500/20 text-pink-400 border border-pink-500/10"
                              )}>
                                {notif.status}
                              </span>
                            </div>
                            {notif.comment && (
                              <p className="mt-1.5 text-[11px] text-white/50 bg-black/40 p-2 rounded border border-white/5 italic whitespace-normal break-words">
                                "{notif.comment}"
                              </p>
                            )}
                            <div className="mt-2 text-[9px] text-zinc-500 flex justify-between items-center">
                              <span>By @{notif.moderator?.split('@')[0]}</span>
                              <span>{new Date(notif.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <p className="text-center py-6 text-zinc-500">{t("notifications.noNotifications")}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                {(isAdmin || isElderModer || isModerator) && (
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
