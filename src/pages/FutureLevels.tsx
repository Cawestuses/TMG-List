import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronRight } from "lucide-react";
import type { FutureLevel } from "../types";
import { useTranslation } from "react-i18next";
import { useFutureLevels } from "../hooks/useFutureLevels";

export default function FutureLevels() {
  const navigate = useNavigate();
  const { futureLevels, loading } = useFutureLevels();
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof FutureLevel, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const { t } = useTranslation();

  const handleSort = (key: keyof FutureLevel) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedLevels = futureLevels
    .filter(l => 
      l.name.toLowerCase().includes(search.toLowerCase()) || 
      l.creator.toLowerCase().includes(search.toLowerCase()) ||
      l.status.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ columnKey }: { columnKey: keyof FutureLevel }) => {
    if (sortConfig.key !== columnKey) return <span className="opacity-0 group-hover:opacity-50 transition-opacity ml-1">↕</span>;
    return <span className="ml-1 text-purple-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tight mb-2">{t("nav.futureList")}</h1>
          <p className="text-zinc-400 font-medium">Upcoming insanely difficult levels.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder={t("levels.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all backdrop-blur-sm text-slate-100 placeholder-white/30"
            />
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[700px] w-full">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_2fr_1fr_60px] gap-4 py-3 px-6 text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] border-b border-white/5 mb-4 select-none">
            <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center" onClick={() => handleSort('name')}>
              {t("levels.levelName")} <SortIcon columnKey="name" />
            </div>
            <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center text-center justify-center" onClick={() => handleSort('creator')}>
              {t("levels.creatorVerifier")} <SortIcon columnKey="creator" />
            </div>
            <div className="cursor-pointer group hover:text-white/60 transition-colors flex items-center justify-center" onClick={() => handleSort('status')}>
              {t("levels.status")} <SortIcon columnKey="status" />
            </div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <motion.div 
                    key={`skel-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-16 bg-white/5 border border-white/5 rounded-xl animate-pulse"
                  />
                ))
              ) : (
                filteredAndSortedLevels.map((level, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: i < 15 ? i * 0.05 : 0 }}
                    key={level.id}
                  >
                    <a 
                      href={level.video} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block group"
                    >
                      <div className="grid grid-cols-[1fr_2fr_1fr_60px] gap-4 items-center py-4 px-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent backdrop-blur-sm group-hover:border-white/5">
                        
                        {/* Level Name */}
                        <div>
                          <div className="font-bold text-sm leading-tight text-white/80 group-hover:text-white transition-colors">{level.name}</div>
                        </div>

                        {/* Crew */}
                        <div 
                          className="text-center font-semibold text-white/60 text-sm hover:text-cyan-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/player/${encodeURIComponent(level.creator)}`);
                          }}
                        >
                          {level.creator}
                        </div>

                        {/* Status */}
                        <div className="flex justify-center text-sm text-cyan-400 font-medium">
                          {level.status}
                        </div>

                        {/* Action */}
                        <div className="flex justify-end text-white/20 group-hover:text-purple-400 transition-colors">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </a>
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
