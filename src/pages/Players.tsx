import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, ChevronRight, Globe, Code, Shield } from "lucide-react";
import { GlowCard } from "../components/ui/GlowCard";
import type { Player } from "../types";
import { useTranslation } from "react-i18next";
import { usePlayers } from "../hooks/usePlayers";

export default function Players() {
  const { players, loading: levelsLoading } = usePlayers();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"slayers" | "creators">("slayers");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Player, direction: 'asc' | 'desc' }>({ key: 'rank', direction: 'asc' });
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSort = (key: keyof Player) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedPlayers = players
    .filter(p => {
      // Basic text search filter
      const matchesSearch = (p.username || "").toLowerCase().includes(search.toLowerCase()) || 
                            (p.country || "").toLowerCase().includes(search.toLowerCase());
      // Tab filter
      if (activeTab === "creators") {
        return matchesSearch && p.createdLevels > 0;
      }
      return matchesSearch; // Slayers tab shows all logically
    })
    .sort((a, b) => {
      // When switching to creators, we might want to default sort by created levels
      let key = sortConfig.key;
      if (activeTab === "creators" && key === "rank") key = "createdLevels";
      if (activeTab === "creators" && key === "points") key = "createdLevels";

      const aVal = a[key];
      const bVal = b[key];
      
      let dir = sortConfig.direction === 'asc' ? -1 : 1;
      
      // If default rank sorting in creators tab, reverse the logic to show most levels first
      if (activeTab === "creators" && sortConfig.key === "rank") dir = 1;

      if (aVal < bVal) return dir;
      if (aVal > bVal) return -dir;
      return 0;
    });

  const SortIcon = ({ columnKey }: { columnKey: keyof Player }) => {
    let key = sortConfig.key;
    if (activeTab === "creators" && key === "rank") key = "createdLevels";
    if (activeTab === "creators" && key === "points") key = "createdLevels";

    if (key !== columnKey) return <span className="opacity-0 group-hover:opacity-50 transition-opacity ml-1">↕</span>;
    return <span className="ml-1 text-cyan-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Слеер": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "Верифер": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "Креатор": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "Хостер": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "Админ": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      default: return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    }
  };

  const handlePlayerClick = (e: React.MouseEvent, playerId: string) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      navigate(`/player/${playerId}?tab=creator`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tight mb-2">Players</h1>
          <p className="text-zinc-400 font-medium">Rankings and statistics</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-all backdrop-blur-sm text-slate-100 placeholder-white/30"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-white/10 pb-4 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab("slayers")}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "slayers" 
              ? "bg-white/10 text-white" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" /> Slayers
        </button>
        <button 
          onClick={() => setActiveTab("creators")}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "creators" 
              ? "bg-white/10 text-white" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Code className="w-4 h-4" /> Creators
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[900px] w-full">
          {/* Table Header */}
          <div className="grid grid-cols-[80px_4fr_2fr_1fr_1fr_60px] gap-4 py-3 px-6 text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] border-b border-white/5 mb-4 select-none">
            <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('rank')}>
              # <SortIcon columnKey="rank" />
            </div>
            <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('username')}>
              {t("players.player")} <SortIcon columnKey="username" />
            </div>
            
            {activeTab === "slayers" ? (
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('hardestDemon')}>
                {t("players.hardestDemon")} <SortIcon columnKey="hardestDemon" />
              </div>
            ) : (
              <div></div> // Empty space or recent level
            )}

            {activeTab === "slayers" ? (
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-end" onClick={() => handleSort('points')}>
                {t("players.points")} <SortIcon columnKey="points" />
              </div>
            ) : (
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-end" onClick={() => handleSort('createdLevels')}>
                Created <SortIcon columnKey="createdLevels" />
              </div>
            )}
            
            {activeTab === "slayers" ? (
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-center" onClick={() => handleSort('completedLevels')}>
                {t("players.completions")} <SortIcon columnKey="completedLevels" />
              </div>
            ) : (
              <div></div>
            )}
            
            <div></div>
          </div>

          {/* Table Body */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {levelsLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <motion.div 
                    key={`skel-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-20 bg-white/5 border border-white/5 rounded-xl animate-pulse"
                  />
                ))
              ) : (
                filteredAndSortedPlayers.map((player, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i < 15 ? i * 0.05 : 0 }}
                    key={player.id}
                  >
                    <Link 
                      to={`/player/${player.id}`} 
                      className="block group"
                      onClick={(e) => handlePlayerClick(e, player.id)}
                    >
                      <div className="grid grid-cols-[80px_4fr_2fr_1fr_1fr_60px] gap-4 items-center py-4 px-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent backdrop-blur-sm group-hover:border-white/5">
                        
                        {/* Rank */}
                        <div className={`text-xl font-mono font-bold w-12 ${
                          (activeTab === "slayers" ? player.rank : (i+1)) === 1 ? "text-cyan-400" :
                          (activeTab === "slayers" ? player.rank : (i+1)) <= 5 ? "text-white/60" :
                          "text-white/20"
                        }`}>
                          {activeTab === "slayers" ? player.rank : (i+1)}
                        </div>

                        {/* Player Info */}
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                            (activeTab === "slayers" ? player.rank : (i+1)) === 1 ? "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/20 text-white" : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white"
                          } transition-all`}>
                            {player.username.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm leading-tight text-white/80 group-hover:text-white transition-colors flex items-center gap-2 flex-wrap">
                              {player.username}
                              {player.roles && player.roles.map(role => (
                                <span key={role} className={`text-[9px] px-1.5 py-0.5 rounded border ${getRoleColor(role)} uppercase tracking-wider font-bold`}>
                                  {role}
                                </span>
                              ))}
                            </div>
                            <div className="text-[10px] text-white/40 uppercase font-semibold mt-1 tracking-wider flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {player.country}
                            </div>
                          </div>
                        </div>

                        {/* Middle Stat */}
                        <div>
                          {activeTab === "slayers" && (
                            <>
                              <div 
                                className="font-semibold text-white/90 text-sm hover:text-cyan-400 transition-colors"
                                onClick={(e) => {
                                  if (player.hardestDemonId) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    navigate(`/level/${player.hardestDemonId}`);
                                  }
                                }}
                              >
                                {player.hardestDemon}
                              </div>
                              <div className="text-[10px] text-white/40 uppercase font-semibold mt-1">{t("players.extremeDemon")}</div>
                            </>
                          )}
                        </div>

                        {/* Primary Stat (Points or Created) */}
                        <div className="text-right font-medium text-cyan-400 text-sm">
                          {activeTab === "slayers" ? player.points.toLocaleString() : player.createdLevels}
                        </div>

                        {/* Completions */}
                        <div className="text-center text-sm font-medium text-white/60">
                          {activeTab === "slayers" ? player.completedLevels : null}
                        </div>

                        {/* Action */}
                        <div className="flex justify-end text-white/20 group-hover:text-cyan-400 transition-colors">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            
            {!levelsLoading && filteredAndSortedPlayers.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                {t("players.noMatch")} "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

