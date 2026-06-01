import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { GlowCard } from "../components/ui/GlowCard";
import type { Level, Player } from "../types";
import { Activity, Globe, Swords, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

const COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

import { useLevels } from "../hooks/useLevels";
import { usePlayers } from "../hooks/usePlayers";

export default function Statistics() {
  const { levels, loading: levelsLoading } = useLevels();
  const { players, loading: playersLoading } = usePlayers();
  const { t } = useTranslation();

  const loading = levelsLoading || playersLoading;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
         <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
         <p className="text-white/40 font-mono text-sm uppercase tracking-widest animate-pulse">Aggregating Data...</p>
      </div>
    );
  }

  // Points distribution among players (group into buckets)
  const uniqueCountries = new Set(players.map(p => p.country)).size;

  const pointsData = [
    { name: '0-1k', count: players.filter(p => p.points <= 1000).length },
    { name: '1k-3k', count: players.filter(p => p.points > 1000 && p.points <= 3000).length },
    { name: '3k-5k', count: players.filter(p => p.points > 3000 && p.points <= 5000).length },
    { name: '5k-10k', count: players.filter(p => p.points > 5000 && p.points <= 10000).length },
    { name: '10k+', count: players.filter(p => p.points > 10000).length },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050507]/90 border border-white/10 p-3 rounded-lg backdrop-blur-md shadow-xl">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}: {entry.value}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-black tracking-tight mb-2">{t("statistics.title")}</h1>
        <p className="text-zinc-400 font-medium">{t("statistics.subtitle")}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("statistics.totalCompletions"), value: players.reduce((sum, p) => sum + p.completedLevels, 0).toLocaleString(), icon: Activity, color: "text-purple-400" },
          { label: t("statistics.activeCountries"), value: uniqueCountries, icon: Globe, color: "text-cyan-400" },
          { label: t("statistics.levelsRanked"), value: levels.length, icon: Swords, color: "text-pink-400" },
          { label: t("statistics.totalPlayers"), value: players.length, icon: Target, color: "text-emerald-400" },
        ].map((stat, i) => (
          <div key={i} className="h-full">
            <GlowCard delay={i * 0.1} className="!p-5 h-full">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-white/5 ${stat.color} border border-white/5`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">{stat.label}</p>
                  <p className="text-xl font-bold font-mono mt-1 text-white/90">{stat.value}</p>
                </div>
              </div>
            </GlowCard>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto w-full">
         {/* Points Distribution */}
         <GlowCard glowColor="primary">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{t("statistics.pointsDistribution")}</h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pointsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                        <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]}>
                            {pointsData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </GlowCard>
      </div>
    </div>
  );
}
