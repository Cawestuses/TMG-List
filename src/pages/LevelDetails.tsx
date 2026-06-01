import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { GlowCard } from "../components/ui/GlowCard";
import type { Level, RecordSubmission } from "../types";
import { Play, Calendar, User, ShieldCheck, Trophy, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

import { useLevels } from "../hooks/useLevels";

export default function LevelDetails() {
  const { id } = useParams();
  const { levels, loading } = useLevels();
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<RecordSubmission[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const level = levels.find(l => l.id === id) || null;

  useEffect(() => {
    async function fetchRecords() {
      if (!level) return;
      try {
        setLoadingRecords(true);
        const q = query(
          collection(db, "record_submissions"),
          where("levelName", "==", level.name)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RecordSubmission[];
        
        // Sort in memory by descending progress, then date
        data.sort((a, b) => {
          if (b.progress !== a.progress) {
             return b.progress - a.progress;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setSubmissions(data);
      } catch (err) {
        console.error("Failed to fetch records", err);
      } finally {
        setLoadingRecords(false);
      }
    }
    fetchRecords();
  }, [level]);

  if (loading) return <div className="animate-pulse h-[400px] bg-white/5 rounded-2xl" />;
  if (!level) return <div className="text-center py-20 text-zinc-500">Level not found</div>;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden group border border-white/10">
        <div className="absolute inset-0 bg-[#050507]">
           {/* Fallback pattern if no thumbnail */}
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-[#050507] to-[#050507]" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 flex flex-col justify-end w-full">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#ec4899]/20 text-[#ec4899] border border-[#ec4899]/30 text-sm font-bold tracking-wide">
              #{level.rank}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30 text-sm font-bold tracking-wide flex items-center gap-1">
              <Trophy className="w-3 h-3" /> {level.points.toFixed(1)} {t("levels.pointsLabel")}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black font-heading mb-2">{level.name}</h1>
          <p className="text-xl text-zinc-400 font-medium">{level.difficulty}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlowCard>
            <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center group cursor-pointer hover:border-white/20 transition-colors">
              <Play className="w-16 h-16 text-white/20 group-hover:text-white/80 group-hover:scale-110 transition-all duration-300" />
            </div>
          </GlowCard>
          
          <GlowCard glowColor="secondary">
            <h3 className="text-xl font-bold mb-4 font-heading border-b border-white/10 pb-2">{t("levels.recordSubmissions")}</h3>
            {loadingRecords ? (
              <div className="py-8 space-y-4">
                <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
              </div>
            ) : submissions.length > 0 ? (
              <div className="space-y-4 py-2">
                {submissions.map((submission) => (
                  <div key={submission.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group">
                    <div>
                      <Link to={`/player/${encodeURIComponent(submission.username)}`} className="font-bold text-lg hover:text-cyan-400 transition-colors cursor-pointer block">{submission.username}</Link>
                      <div className="text-sm text-zinc-400 flex items-center gap-2">
                        <span className="text-[#06b6d4] font-medium">{submission.progress}%</span>
                        &bull;
                        <span className="uppercase text-[10px] tracking-wider">{submission.status}</span>
                      </div>
                    </div>
                    <a href={submission.videoProof} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <Video className="w-5 h-5 text-white/60 group-hover:text-purple-400 transition-colors" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 py-8 text-center italic">
                {t("levels.noRecords", "No records found for this level yet.")}
              </div>
            )}
          </GlowCard>
        </div>
        
        <div className="space-y-6">
          <GlowCard glowColor="accent" className="!p-5">
            <h3 className="text-xl font-bold mb-4 font-heading border-b border-white/10 pb-2">{t("levels.levelInfo")}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                  <User className="w-4 h-4" /> {t("levels.creatorVerifier").split(' / ')[0]}
                </div>
                <Link to={`/player/${encodeURIComponent(level.creator)}`} className="font-medium hover:text-cyan-400 transition-colors">{level.creator}</Link>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                  <ShieldCheck className="w-4 h-4" /> {t("levels.creatorVerifier").split(' / ')[1]}
                </div>
                <Link to={`/player/${encodeURIComponent(level.verifier)}`} className="font-medium text-[#06b6d4] hover:text-cyan-300 transition-colors">{level.verifier}</Link>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Trophy className="w-4 h-4" /> {t("levels.victors")}
                </div>
                <div className="font-mono text-[#a855f7] font-bold">{level.victors}</div>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
