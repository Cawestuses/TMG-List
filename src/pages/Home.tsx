import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Trophy, ArrowRight, Play, Swords, Activity, Zap, Users, History } from "lucide-react";
import { GlowCard } from "../components/ui/GlowCard";
import { useEffect, useState } from "react";
import type { Level } from "../types";
import { useTranslation } from "react-i18next";

import { useLevels } from "../hooks/useLevels";
import { useChangelog } from "../hooks/useChangelog";
import { usePlayers } from "../hooks/usePlayers";
import { useAuth } from "../lib/auth";
import { formatChangelogTime } from "../utils/country";

export default function Home() {
  const { levels, loading } = useLevels();
  const { logs, loading: logsLoading } = useChangelog();
  const { players, loading: playersLoading } = usePlayers();
  const { user } = useAuth();
  
  const topLevels = levels.slice(0, 3);
  const { t } = useTranslation();

  const userPlayer = user ? players.find(p => (p.username || "").trim().toLowerCase() === (user.email?.split('@')[0] || "").trim().toLowerCase()) : null;
  const userCountry = userPlayer?.country || "RU";

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#fb923c]/10 via-[#f97316]/20 to-[#f59e0b]/10 blur-[100px] rounded-full point-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="h-4" />
          
          <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tighter">
            <span dangerouslySetInnerHTML={{ __html: t("home.title").replace('Geometry Dash', '<br /><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] via-[#fb923c] to-[#f97316]">GEOMETRY DASH</span>') }} />
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl">
            {t("home.subtitle")}
          </p>

          <div className="flex items-center gap-4 mt-4">
            <Link to="/top" className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                {t("home.viewDemonList")} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link to="/submit" className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              {t("home.submitRecord")}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Top 3 Preview & Changelog Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-[#f97316]" />
              <h2 className="text-3xl font-heading font-bold">{t("home.latestAdditions")}</h2>
            </div>
            <Link to="/top" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse border border-white/10" />
              ))
            ) : (
              topLevels.map((level, i) => (
                <Link key={level.id} to={`/level/${level.id}`}>
                  <GlowCard delay={i * 0.1} glowColor={i === 0 ? "accent" : i === 1 ? "secondary" : "primary"} className="h-full transform hover:-translate-y-2 transition-all duration-300">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="text-5xl font-black text-white/20 mb-2 font-heading">#{level.rank}</div>
                        <h3 className="text-2xl font-bold mb-1">{level.name}</h3>
                        <p className="text-sm text-[#f59e0b] font-medium">{level.difficulty}</p>
                      </div>
                      
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">{t("levels.points")}</span>
                          <span className="font-mono font-bold text-[#fb923c]">{level.points}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">{t("levels.creator", "Creator")}</span>
                          <span className="text-zinc-300">{level.creator}</span>
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Changelog Column */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <History className="w-7 h-7 text-[#f59e0b]" />
            <h2 className="text-3xl font-heading font-bold">Changelog</h2>
          </div>
          <GlowCard className="!p-0 overflow-hidden h-[300px] flex flex-col">
            <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar">
              {logsLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-white/10 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-white/5 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="flex gap-4 group">
                    <div className="w-2 h-2 mt-2 rounded-full bg-[#f59e0b] group-hover:shadow-[0_0_10px_#f59e0b] transition-shadow" />
                    <div>
                      <p className="text-sm font-medium text-white/90">{log.content}</p>
                      <p className="text-xs text-white/40 font-mono mt-1">{formatChangelogTime(log.date, userCountry)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-500 italic pb-4">No recent changes recorded.</div>
              )}
            </div>
          </GlowCard>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("statistics.totalCompletions"), value: playersLoading ? "..." : players.reduce((sum, p) => sum + p.completedLevels, 0).toLocaleString(), icon: Swords, color: "text-[#fb923c]" },
          { label: t("statistics.totalPlayers"), value: playersLoading ? "..." : players.length.toLocaleString(), icon: Users, color: "text-[#f59e0b]" },
          { label: t("statistics.levelsRanked"), value: loading ? "..." : levels.length.toLocaleString(), icon: Activity, color: "text-[#fb923c]" },
          { label: t("statistics.activeCountries"), value: playersLoading ? "..." : new Set(players.map(p => p.country).filter(c => c && c !== "UN")).size, icon: Zap, color: "text-emerald-400" },
        ].map((stat, i) => (
          <div key={i} className="h-full">
            <GlowCard delay={0.4 + (i * 0.1)} className="!p-5 h-full">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
                  <p className="text-xl font-bold font-mono mt-1">{stat.value}</p>
                </div>
              </div>
            </GlowCard>
          </div>
        ))}
      </section>
    </div>
  );
}
