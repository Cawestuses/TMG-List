import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, ChevronRight, PlayCircle, Trophy, Sparkles } from "lucide-react";
import { GlowCard } from "../components/ui/GlowCard";
import type { Level, BeautyLevel } from "../types";
import { useTranslation } from "react-i18next";

import { useLevels } from "../hooks/useLevels";
import { useBeautyLevels } from "../hooks/useBeautyLevels";

export default function TopLevels() {
  const { levels, loading: levelsLoading } = useLevels();
  const { levels: beautyLevels, loading: beautyLoading } = useBeautyLevels();
  
  const [activeTab, setActiveTab] = useState<"difficulty" | "beauty">("difficulty");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'rank', direction: 'asc' });
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const loading = activeTab === "difficulty" ? levelsLoading : beautyLoading;

  const normalizeString = (value: unknown) => typeof value === 'string' ? value : "";
  const normalizeNumber = (value: unknown) => typeof value === 'number' ? value : Number(value) || 0;
  const getSortValue = (item: any, key: string) => {
    const value = item?.[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value.toLowerCase();
    return "";
  };

  const getFilteredAndSortedData = () => {
    const normalizedSearch = search.toLowerCase();

    if (activeTab === "difficulty") {
      return levels
        .filter(l => 
          normalizeString(l.name).includes(normalizedSearch) || 
          normalizeString(l.creator).includes(normalizedSearch) ||
          normalizeString(l.verifier).includes(normalizedSearch)
        )
        .slice()
        .sort((a, b) => {
          const aVal = getSortValue(a, sortConfig.key);
          const bVal = getSortValue(b, sortConfig.key);
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
    } else {
      return beautyLevels
        .filter(l => 
          normalizeString(l.name).includes(normalizedSearch) || 
          normalizeString(l.creator).includes(normalizedSearch)
        )
        .slice()
        .sort((a, b) => {
          const aVal = getSortValue(a, sortConfig.key);
          const bVal = getSortValue(b, sortConfig.key);
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
    }
  };

  const displayData = getFilteredAndSortedData();

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <span className="opacity-0 group-hover:opacity-50 transition-opacity ml-1">↕</span>;
    return <span className="ml-1 text-[#d8d0b6]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tight mb-2">{t("levels.title")}</h1>
          <p className="text-zinc-400 font-medium">{t("levels.subtitle")}</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder={t("levels.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#d8d0b6]/50 transition-all backdrop-blur-sm text-slate-100 placeholder-white/30"
            />
          </div>

        </div>
      </div>
      
      <div className="flex space-x-2 border-b border-white/10 pb-4 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => { setActiveTab("difficulty"); setSortConfig({ key: 'rank', direction: 'asc' }); }}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "difficulty" 
              ? "bg-white/10 text-white" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4" /> Топ по сложности
        </button>
        <button 
          onClick={() => { setActiveTab("beauty"); setSortConfig({ key: 'rank', direction: 'asc' }); }}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === "beauty" 
              ? "bg-white/10 text-white" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" /> Топ по красоте
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[900px] w-full">
          {/* Table Header */}
          {activeTab === "difficulty" ? (
            <div className="grid grid-cols-[80px_3fr_2fr_1fr_1fr_1fr_60px] gap-4 py-3 px-6 text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] border-b border-white/5 mb-4 select-none">
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('rank')}>
                {t("levels.rank")} <SortIcon columnKey="rank" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('name')}>
                {t("levels.levelName")} <SortIcon columnKey="name" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('creator')}>
                {t("levels.creatorVerifier")} <SortIcon columnKey="creator" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-end" onClick={() => handleSort('points')}>
                {t("levels.points")} <SortIcon columnKey="points" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-center" onClick={() => handleSort('victors')}>
                {t("levels.victors")} <SortIcon columnKey="victors" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-center" onClick={() => handleSort('isActive')}>
                {t("levels.status")} <SortIcon columnKey="isActive" />
              </div>
              <div></div>
            </div>
          ) : (
            <div className="grid grid-cols-[80px_4fr_2fr_120px] gap-4 py-3 px-6 text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] border-b border-white/5 mb-4 select-none">
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('rank')}>
                {t("levels.rank")} <SortIcon columnKey="rank" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('name')}>
                {t("levels.levelName")} <SortIcon columnKey="name" />
              </div>
              <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('creator')}>
                Создатель <SortIcon columnKey="creator" />
              </div>
              <div></div>
            </div>
          )}

          {/* Table Body */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {loading ? (
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
                displayData.map((level, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i < 15 ? i * 0.05 : 0 }}
                    key={level.id}
                  >
                    <div 
                      className="block group"
                      onClick={(e) => {
                        const creator = normalizeString(level.creator);
                        const verifier = normalizeString((level as Level).verifier);
                        const levelId = normalizeString(level.id);
                        const videoUrl = normalizeString(level.video);

                        if (e.ctrlKey || e.metaKey) {
                          if (creator) navigate(`/player/${encodeURIComponent(creator)}`);
                          return;
                        }

                        if (e.altKey && activeTab === "difficulty") {
                          if (verifier) navigate(`/player/${encodeURIComponent(verifier)}`);
                          return;
                        }

                        if (activeTab === "difficulty") {
                          if (levelId) navigate(`/level/${levelId}`);
                          return;
                        }

                        if (videoUrl) {
                          window.open(videoUrl, '_blank');
                        }
                      }}
                    >
                      {activeTab === "difficulty" ? (
                        <div className="grid grid-cols-[80px_3fr_2fr_1fr_1fr_1fr_60px] gap-4 items-center py-4 px-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent backdrop-blur-sm group-hover:border-white/5">
                          
                          {/* Rank */}
                          <div className={`text-xl font-mono font-bold w-12 ${
                            level.rank === 1 ? "text-[#d8d0b6]" :
                            level.rank <= 5 ? "text-white/60" :
                            "text-white/20"
                          }`}>
                            {level.rank}
                          </div>

                          {/* Level Name */}
                          <div className="flex items-center gap-3">
                            {level.thumbnail ? (
                              <img 
                                src={level.thumbnail} 
                                alt={level.name} 
                                className="w-16 h-10 object-cover rounded-md border border-white/10 shrink-0 bg-black/50" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-16 h-10 rounded-md bg-[#d8d0b6]/10 border border-[#d8d0b6]/20 shrink-0 flex items-center justify-center text-xs text-[#d8d0b6] font-mono">
                                GD
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm leading-tight text-white/80 group-hover:text-white transition-colors">{level.name}</div>
                              <div className="text-[10px] text-white/40 uppercase font-semibold mt-1 tracking-wider">{(level as Level).difficulty}</div>
                            </div>
                          </div>

                          {/* Crew */}
                          <div>
                            <div 
                              className="font-semibold text-white/90 text-sm hover:text-[#cfbe94] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/player/${encodeURIComponent(level.creator)}`);
                              }}
                            >
                              {level.creator}
                            </div>
                            <div 
                              className="text-[10px] text-white/40 uppercase font-semibold mt-1 hover:text-[#cfbe94] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/player/${encodeURIComponent((level as Level).verifier)}`);
                              }}
                            >
                              V: {(level as Level).verifier}
                            </div>
                          </div>

                          {/* Points */}
                          <div className="text-right font-medium text-[#cfbe94] text-sm">
                            {((level as Level).points || 0).toFixed(1)}
                          </div>

                          {/* Victors */}
                          <div className="text-center text-sm font-medium text-white/60">
                            {(level as Level).victors}
                          </div>

                          {/* Status */}
                          <div className="flex justify-center text-sm">
                            {(level as Level).isActive ? (
                              <span className="px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold uppercase tracking-widest border border-[#10b981]/20">
                                {t("levels.active")}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded bg-zinc-500/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-zinc-500/20">
                                {t("levels.inactive")}
                              </span>
                            )}
                          </div>

                          {/* Action */}
                          <div className="flex justify-end text-white/20 group-hover:text-[#d8d0b6] transition-colors">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-[80px_4fr_2fr_120px] gap-4 items-center py-4 px-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent backdrop-blur-sm group-hover:border-white/5">
                          
                          {/* Rank */}
                          <div className={`text-xl font-mono font-bold w-12 ${
                            level.rank === 1 ? "text-[#d8d0b6]" :
                            level.rank <= 5 ? "text-white/60" :
                            "text-white/20"
                          }`}>
                            {level.rank}
                          </div>

                          {/* Level Name */}
                          <div className="flex items-center gap-3">
                            {level.thumbnail ? (
                              <img 
                                src={level.thumbnail} 
                                alt={level.name} 
                                className="w-16 h-10 object-cover rounded-md border border-white/10 shrink-0 bg-black/50" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-16 h-10 rounded-md bg-[#d8d0b6]/10 border border-[#d8d0b6]/20 shrink-0 flex items-center justify-center text-xs text-[#d8d0b6] font-mono">
                                GD
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm leading-tight text-white/80 group-hover:text-white transition-colors">{level.name}</div>
                            </div>
                          </div>

                          {/* Crew */}
                          <div>
                            <div 
                              className="font-semibold text-white/90 text-sm hover:text-[#cfbe94] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/player/${encodeURIComponent(level.creator)}`);
                              }}
                            >
                              {level.creator}
                            </div>
                          </div>

                          {/* Video link */}
                          <div className="flex justify-end">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (level.video) window.open(level.video, '_blank');
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Видео
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            
            {!loading && filteredAndSortedLevels.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                {t("levels.noMatch")} "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
