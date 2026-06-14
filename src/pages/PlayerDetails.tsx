import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { GlowCard } from "../components/ui/GlowCard";
import { Globe, Trophy, Sword, Target, Medal, Code, Edit2, Check, X, Shield, MessageCircle, Gamepad2, AlignLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePlayers } from "../hooks/usePlayers";
import { useAuth } from "../lib/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getFlagEmoji } from "../utils/country";

export default function PlayerDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") === "creator" || searchParams.get("tab") === "progress") ? (searchParams.get("tab") as "creator" | "progress") : "slayer";
  const [activeTab, setActiveTab] = useState<"slayer" | "creator" | "progress">(initialTab);
  
  const { players, loading } = usePlayers();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({ discord: "", gdUsername: "", country: "", description: "" });
  const [saving, setSaving] = useState(false);
  const player = useMemo(() => {
    const playerStr = id ? decodeURIComponent(id) : "";
    const found = players.find(p => p.id === playerStr || p.username.toLowerCase() === playerStr.toLowerCase() || p.id === id);
    if (found) return found;

    if (id && !loading) {
      const normalizedStr = playerStr.trim().toLowerCase();
      const roles = [];
      if (normalizedStr.startsWith('infinity_starmaizik') || normalizedStr.startsWith('infinify_starmaizik') || normalizedStr === 'markleonov2010@gmail.com') {
        roles.push("Админ");
      }
      return {
        id: id,
        username: playerStr,
        points: 0,
        rank: 0,
        completedLevels: 0,
        createdLevels: 0,
        verifiedLevels: 0,
        hardestDemon: "Unknown",
        country: "UN",
        roles: roles,
        completedLevelsList: [],
        progressLevelsList: [],
        createdLevelsList: []
      };
    }
    return null;
  }, [players, id, loading]);

  // Local state to hold the actively displayed profile data after saving without reload
  const displayedProfile = {
    discord: editProfile.discord || player?.discord || "",
    gdUsername: editProfile.gdUsername || player?.gdUsername || "",
    country: editProfile.country || player?.country || "UN",
    description: editProfile.description || player?.description || ""
  };

  const playerDiscord = player?.discord;
  const playerGd = player?.gdUsername;
  const playerCountry = player?.country;
  const playerDesc = player?.description;

  // Effect to sync edit form with profile data when entering edit mode
  useEffect(() => {
    if (isEditing && player) {
      setEditProfile({
        discord: playerDiscord || "",
        gdUsername: playerGd || "",
        country: playerCountry || "UN",
        description: playerDesc || ""
      });
    }
  }, [isEditing, playerDiscord, playerGd, playerCountry, playerDesc]);

  const canEdit = user && (isAdmin || user.email?.split('@')[0].toLowerCase() === player?.username.toLowerCase());

  const handleSaveProfile = async () => {
    if (!player) return;
    setSaving(true);
    try {
      const docId = player.username.trim().toLowerCase();
      await setDoc(doc(db, "user_profiles", docId), editProfile, { merge: true });
      setIsEditing(false);
      // Removed window.location.reload() to prevent weird redirects
      // State is locally updated via the components rendering editProfile
    } catch (err) {
      console.error(err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-[400px] bg-white/5 rounded-2xl border border-white/5" />;
  if (!player) return <div className="text-center py-20 text-zinc-500">Player not found</div>;

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

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative md:h-[auto] rounded-2xl overflow-hidden group border border-white/10 pb-8">
        <div className="absolute inset-0 bg-[#050507]">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500 via-[#050507] to-[#050507]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent" />
        
        <div className="relative pt-[80px] px-8 flex flex-col md:flex-row items-end justify-between w-full h-full gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full text-center md:text-left">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex shrink-0 items-center justify-center text-5xl md:text-6xl font-black text-white shadow-xl shadow-cyan-500/20 border-4 border-[#050507]">
                    {player.username.charAt(0)}
                </div>
                <div className="w-full">
                    <div className="flex items-center justify-center gap-2 md:justify-start flex-wrap mb-2">
                        {player.rank > 0 && activeTab === "slayer" && (
                          <span className="px-3 py-1 rounded bg-white/5 backdrop-blur-md text-white/60 border border-white/10 text-[10px] font-bold tracking-widest uppercase">
                              Rank #{player.rank}
                          </span>
                        )}
                        {player.roles && player.roles.map(role => (
                          <span key={role} className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${getRoleColor(role)}`}>
                            {role}
                          </span>
                        ))}
                    </div>
                    
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight">{player.username}</h1>
                      {canEdit && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 mt-3 text-white/50 text-sm font-medium">
                        {(displayedProfile.country) && (
                           <span className="flex items-center gap-1.5 text-white/70">
                             <Globe className="w-4 h-4 text-white/40" /> {getFlagEmoji(displayedProfile.country)} {isEditing ? "Country:" : (displayedProfile.country === "UN" ? "Unknown" : displayedProfile.country)} 
                           </span>
                        )}
                        {(!isEditing && displayedProfile.discord) && (
                          <span className="flex items-center gap-1.5 text-[#5865F2] bg-[#5865F2]/10 px-2 py-0.5 rounded">
                            <MessageCircle className="w-4 h-4" /> {displayedProfile.discord}
                          </span>
                        )}
                        {(!isEditing && displayedProfile.gdUsername) && (
                          <span className="flex items-center gap-1.5 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                            <Gamepad2 className="w-4 h-4" /> {displayedProfile.gdUsername}
                          </span>
                        )}
                    </div>

                    {/* Edit Form */}
                    {isEditing && (
                      <div className="mt-6 bg-black/40 backdrop-blur-md p-6 rounded-xl border border-white/10 text-left space-y-4 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase font-bold text-white/50 mb-1">Country (Code or Name)</label>
                            <input value={editProfile.country} onChange={e => setEditProfile({...editProfile, country: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="e.g. RU, US" />
                          </div>
                          <div>
                            <label className="block text-xs uppercase font-bold text-white/50 mb-1 text-[#5865F2]">Discord Tag</label>
                            <input value={editProfile.discord} onChange={e => setEditProfile({...editProfile, discord: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="User#1234" />
                          </div>
                          <div>
                            <label className="block text-xs uppercase font-bold text-white/50 mb-1 text-orange-400">GD Username</label>
                            <input value={editProfile.gdUsername} onChange={e => setEditProfile({...editProfile, gdUsername: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="MyGDName" />
                          </div>
                        </div>
                        <div>
                           <label className="block text-xs uppercase font-bold text-white/50 mb-1">Description</label>
                           <textarea value={editProfile.description} onChange={e => setEditProfile({...editProfile, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500 h-24" placeholder="Tell us about yourself..."></textarea>
                        </div>
                        <div className="flex gap-2 justify-end">
                           <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg">Cancel</button>
                           <button onClick={handleSaveProfile} disabled={saving} className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center gap-2">
                             {saving ? "Saving..." : <><Check className="w-4 h-4"/> Save Profile</>}
                           </button>
                        </div>
                      </div>
                    )}
                    
                    {!isEditing && displayedProfile.description && (
                      <div className="mt-6 flex items-start gap-3 bg-white/5 border border-white/10 p-4 rounded-xl text-left max-w-2xl">
                        <AlignLeft className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                        <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">{displayedProfile.description}</p>
                      </div>
                    )}
                </div>
            </div>
            
            <div className="hidden lg:flex gap-6 text-right shrink-0">
                 {activeTab === "slayer" ? (
                   <>
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Total Points</span>
                        <span className="text-2xl font-black text-cyan-400 mt-1">{player.points.toLocaleString()}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Completions</span>
                        <span className="text-2xl font-black text-white mt-1">{player.completedLevels}</span>
                     </div>
                   </>
                 ) : (
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Created Levels</span>
                      <span className="text-2xl font-black text-cyan-400 mt-1">{player.createdLevels}</span>
                   </div>
                 )}
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/10 pb-4 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab("slayer")}
          className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "slayer" 
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
              : "text-zinc-400 hover:text-white bg-white/5 border border-transparent"
          }`}
        >
          <Shield className="w-4 h-4" /> Slayer Statistics
        </button>
        <button 
          onClick={() => setActiveTab("creator")}
          className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "creator" 
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
              : "text-zinc-400 hover:text-white bg-white/5 border border-transparent"
          }`}
        >
          <Code className="w-4 h-4" /> Creator Statistics
        </button>
        <button 
          onClick={() => setActiveTab("progress")}
          className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "progress" 
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
              : "text-zinc-400 hover:text-white bg-white/5 border border-transparent"
          }`}
        >
          <Target className="w-4 h-4" /> All Progresses
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlowCard glowColor="secondary">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
              <Sword className="w-4 h-4" /> 
              {activeTab === "slayer" ? "Completed Levels" : activeTab === "creator" ? "Created Levels" : "Progresses"}
            </h3>
            <div className="space-y-2">
                 {activeTab === "slayer" && player.completedLevelsList?.length > 0 && player.completedLevelsList.map((level, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
                              {i+1}
                            </div>
                            <div>
                                <Link to={`/level/${level.id}`} className="font-bold text-white/90 hover:text-cyan-400 transition-colors text-sm md:text-base">{level.name}</Link>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-cyan-400">{level.progress}%</div>
                             {level.url && (
                               <a href={level.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-blue-400 uppercase font-bold tracking-wider mt-1 block">Proof</a>
                             )}
                        </div>
                    </div>
                 ))}
                 
                 {activeTab === "slayer" && (!player.completedLevelsList || player.completedLevelsList.length === 0) && (
                   <div className="p-8 text-center text-white/40 italic">No levels completed yet.</div>
                 )}

                 {activeTab === "progress" && player.progressLevelsList?.length > 0 && player.progressLevelsList.map((level, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10 text-white/40">
                              <Target className="w-4 h-4" />
                            </div>
                            <div>
                                <Link to={`/level/${level.id}`} className="font-bold text-white/90 hover:text-cyan-400 transition-colors text-sm md:text-base">{level.name}</Link>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-cyan-400">{level.progress}%</div>
                             {level.url && (
                               <a href={level.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 hover:text-blue-400 uppercase font-bold tracking-wider mt-1 block">Proof</a>
                             )}
                        </div>
                    </div>
                 ))}
                 
                 {activeTab === "progress" && (!player.progressLevelsList || player.progressLevelsList.length === 0) && (
                   <div className="p-8 text-center text-white/40 italic">No progress recorded yet.</div>
                 )}

                 {activeTab === "creator" && player.createdLevelsList?.length > 0 && player.createdLevelsList.map((level, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10 text-white/40">
                             <Target className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-white/90 text-sm md:text-base">
                            <Link to={`/level/${level.id}`} className="hover:text-cyan-400 transition-colors">{level.name}</Link>
                        </div>
                    </div>
                 ))}
                 
                 {activeTab === "creator" && (!player.createdLevelsList || player.createdLevelsList.length === 0) && (
                   <div className="p-8 text-center text-white/40 italic">No levels created yet.</div>
                 )}
            </div>
          </GlowCard>
        </div>
        
        <div className="space-y-6">
          <GlowCard glowColor="accent" className="!p-5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">{activeTab === "slayer" ? "Slayer Stats" : "Creator Stats"}</h3>
            <div className="space-y-4">
              
              {activeTab === "slayer" && (
                <>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                       <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                           <Trophy className="w-5 h-5" />
                       </div>
                       <div>
                           <div className="text-[10px] font-bold text-white/40 uppercase">Global Rank</div>
                           <div className="text-xl font-bold mt-0.5">{player.rank > 0 ? `#${player.rank}` : "Unranked"}</div>
                       </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                       <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                           <Target className="w-5 h-5" />
                       </div>
                       <div>
                           <div className="text-[10px] font-bold text-white/40 uppercase">Hardest Demon</div>
                           <div className="text-lg font-bold mt-0.5 leading-tight">
                               {player.hardestDemonId ? (
                                  <Link to={`/level/${player.hardestDemonId}`} className="hover:text-cyan-400 transition-colors">{player.hardestDemon}</Link>
                               ) : player.hardestDemon}
                           </div>
                       </div>
                  </div>

                  {player.hardestProgressPercent && player.hardestProgressPercent > 0 ? (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                         <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
                             <Shield className="w-5 h-5" />
                         </div>
                         <div>
                             <div className="text-[10px] font-bold text-white/40 uppercase">Best Progress</div>
                             <div className="text-lg font-bold mt-0.5 leading-tight">
                                 {player.hardestProgressId ? (
                                    <Link to={`/level/${player.hardestProgressId}`} className="hover:text-cyan-400 transition-colors">{player.hardestProgressStr}</Link>
                                 ) : player.hardestProgressStr} - {player.hardestProgressPercent}%
                             </div>
                         </div>
                    </div>
                  ) : null}
                </>
              )}

              {activeTab === "creator" && (
                <>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                       <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
                           <Code className="w-5 h-5" />
                       </div>
                       <div>
                           <div className="text-[10px] font-bold text-white/40 uppercase">Total Creations</div>
                           <div className="text-xl font-bold mt-0.5">{player.createdLevels}</div>
                       </div>
                  </div>
                </>
              )}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
