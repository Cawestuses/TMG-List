import { useState, useEffect, useMemo } from "react";
import type { Player, RecordSubmission, UserProfile } from "../types";
import { useLevels } from "./useLevels";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface PlayerStat {
  points: number;
  completedLevels: number;
  createdLevels: number;
  verifiedLevels: number;
  hardestDemonRank: number;
  hardestDemonStr: string;
  hardestDemonId: string;
  hardestProgressPercent: number;
  hardestProgressStr: string;
  hardestProgressId: string;
  completedLevelsList: { name: string; progress: number, url: string, id: string }[];
  createdLevelsList: { name: string, id: string }[];
  roles: string[];
}

export function usePlayers() {
  const { levels, loading: levelsLoading } = useLevels();
  const [submissions, setSubmissions] = useState<RecordSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const snap = await getDocs(collection(db, "record_submissions"));
        const data = snap.docs
          .map(doc => doc.data() as RecordSubmission)
          .filter(sub => sub.status === "accepted");
        setSubmissions(data);
        
        const profileSnap = await getDocs(collection(db, "user_profiles"));
        const profilesData: Record<string, UserProfile> = {};
        profileSnap.docs.forEach(doc => {
          profilesData[doc.id] = doc.data() as UserProfile;
        });
        setProfiles(profilesData);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmissionsLoading(false);
      }
    };
    fetchAuthData();
  }, []);

  const players = useMemo(() => {
    if (!levels || levels.length === 0) return [];

    const stats: Record<string, PlayerStat> = {};

    const getStats = (name: string): PlayerStat => {
      const lower = name.toLowerCase();
      if (!stats[lower]) {
        stats[lower] = {
          points: 0,
          completedLevels: 0,
          createdLevels: 0,
          verifiedLevels: 0,
          hardestDemonRank: Infinity,
          hardestDemonStr: "",
          hardestDemonId: "",
          hardestProgressPercent: 0,
          hardestProgressStr: "",
          hardestProgressId: "",
          completedLevelsList: [],
          createdLevelsList: [],
          roles: []
        };
      }
      return stats[lower];
    };

    levels.forEach(level => {
      // Verifiers
      const vName = typeof level.verifier === 'string' ? level.verifier.trim() : "";
      if (vName && vName.toLowerCase() !== "tmg archive" && vName.toLowerCase() !== "not top 20") {
        const pStat = getStats(vName);
        if (level.isActive) {
          pStat.points += (level.points || 0);
          pStat.completedLevels += 1;
          pStat.verifiedLevels += 1;
          pStat.completedLevelsList.push({ name: level.name, progress: 100, url: level.video, id: level.id });
          
          if (level.rank < pStat.hardestDemonRank) {
            pStat.hardestDemonRank = level.rank;
            pStat.hardestDemonStr = level.name;
            pStat.hardestDemonId = level.id;
          }
        }
      }

      // Creators
      const cName = typeof level.creator === 'string' ? level.creator.trim() : "";
      if (cName && cName.toLowerCase() !== "tmg archive" && cName.toLowerCase() !== "not top 20") {
        const pStat = getStats(cName);
        pStat.createdLevels += 1;
        pStat.createdLevelsList.push({ name: level.name, id: level.id });
      }
    });

    submissions.forEach(sub => {
      const sName = typeof sub.username === 'string' ? sub.username.trim() : "";
      if (sName && sName.toLowerCase() !== "tmg archive" && sName.toLowerCase() !== "not top 20") {
        const pStat = getStats(sName);
        const level = levels.find(l => (l.name || "").toLowerCase() === (sub.levelName || "").toLowerCase());
        
        if (level && level.isActive) {
          // If 100% completion
          if (sub.progress === 100 && !pStat.completedLevelsList.find(c => (c.name || "").toLowerCase() === (sub.levelName || "").toLowerCase())) {
            pStat.points += (level.points || 0);
            pStat.completedLevels += 1;
            pStat.completedLevelsList.push({ name: level.name, progress: 100, url: sub.videoProof, id: level.id });

            if (level.rank < pStat.hardestDemonRank) {
              pStat.hardestDemonRank = level.rank;
              pStat.hardestDemonStr = level.name;
              pStat.hardestDemonId = level.id;
            }
          }
          
          // Progress check
          if (sub.progress < 100) {
            const currentHardestProgLevel = levels.find(l => l.name === pStat.hardestProgressStr);
            const currentRank = currentHardestProgLevel ? currentHardestProgLevel.rank : Infinity;
            
            if (level.rank < currentRank || (level.rank === currentRank && sub.progress > pStat.hardestProgressPercent)) {
              pStat.hardestProgressPercent = sub.progress;
              pStat.hardestProgressStr = level.name;
              pStat.hardestProgressId = level.id;
            }
          }
        }
      }
    });

    const parsedPlayers: Player[] = Object.keys(stats).map(key => {
      const stat = stats[key];
      const originalNameLevelV = levels.find(l => (l.verifier || "").toLowerCase() === key);
      const originalNameLevelC = levels.find(l => (l.creator || "").toLowerCase() === key);
      const originalSubName = submissions.find(s => (s.username || "").toLowerCase() === key);
      
      let displayName = key;
      if (originalNameLevelV) displayName = originalNameLevelV.verifier;
      else if (originalNameLevelC) displayName = originalNameLevelC.creator;
      else if (originalSubName) displayName = originalSubName.username;

      // Assign roles
      const roles: string[] = [];
      if (stat.points > 20) roles.push("Слеер");
      if (stat.verifiedLevels > 0) roles.push("Верифер");
      if (stat.createdLevels > 0) roles.push("Креатор");
      if (stat.createdLevels > 3) roles.push("Хостер");
      
      // Admin check - either by exact name or env variable
      const expectedAdmin = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
      if (key === expectedAdmin.toLowerCase()) roles.push("Админ");

      const profile = profiles[key] || {};

      return {
        id: `player-${key.replace(/\s+/g, '-')}`,
        rank: 0, 
        username: displayName,
        points: Number(stat.points.toFixed(2)),
        completedLevels: stat.completedLevels,
        createdLevels: stat.createdLevels,
        verifiedLevels: stat.verifiedLevels,
        hardestDemon: stat.hardestDemonStr || "None",
        hardestDemonId: stat.hardestDemonId,
        country: profile.country || "UN",
        roles,
        description: profile.description,
        discord: profile.discord,
        gdUsername: profile.gdUsername,
        hardestProgressStr: stat.hardestProgressStr,
        hardestProgressId: stat.hardestProgressId,
        hardestProgressPercent: stat.hardestProgressPercent,
        completedLevelsList: stat.completedLevelsList.sort((a,b) => (b.progress || 0) - (a.progress || 0)), // you can sort by rank if wanted
        createdLevelsList: stat.createdLevelsList
      };
    });

    parsedPlayers.sort((a, b) => b.points - a.points);
    parsedPlayers.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    return parsedPlayers;
  }, [levels, submissions, profiles]);

  return { players, loading: levelsLoading || submissionsLoading };
}

