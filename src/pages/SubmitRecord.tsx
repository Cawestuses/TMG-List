import { useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLevels } from "../hooks/useLevels";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";

export default function SubmitRecord() {
  const { t } = useTranslation();
  const { levels } = useLevels();
  const { user } = useAuth();
  
  const [levelName, setLevelName] = useState("");
  const [progress, setProgress] = useState("");
  const [videoProof, setVideoProof] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be|twitch\.tv)\/.+$/;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("You must be logged in to submit a record.");
      return;
    }

    if (!levelName || !progress || !videoProof) {
      alert("Please fill in all fields.");
      return;
    }

    if (!videoRegex.test(videoProof)) {
      alert("Please enter a valid YouTube or Twitch URL.");
      return;
    }

    setIsSubmitting(true);
    
    const username = user?.username || (user?.email ? user.email.split('@')[0] : "Player");
    
    try {
      const envUrl = import.meta.env.VITE_API_URL || "";
      const isLocalOrCloudRun = typeof window !== "undefined" && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
      const API_BASE_URL = (envUrl.includes("onrender.com") || isLocalOrCloudRun) ? "" : envUrl;
      const res = await fetch(`${API_BASE_URL}/api/submit-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          levelName,
          progress: Number(progress),
          videoProof,
          userEmail: user.email,
          userId: user.uid
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
      
      alert(t("submit.success", "Record submitted successfully!"));
      setLevelName("");
      setProgress("");
      setVideoProof("");
    } catch (error: any) {
      console.error("Error submitting record:", error);
      alert(error.message || t("submit.error", "Failed to submit record. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 text-center mt-20">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tight mb-4">{t("submit.title")}</h1>
          <p className="text-zinc-400 mb-8">You must be logged in to submit a record.</p>
          <Link 
            to="/login"
            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-black tracking-tight mb-2">{t("submit.title")}</h1>
        <p className="text-zinc-400">{t("submit.subtitle")}</p>
      </div>

      <div className="glass-card border border-white/5 rounded-2xl p-6 md:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t("submit.levelName")}</label>
            <select 
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-all backdrop-blur-sm font-sans text-sm appearance-none" 
              disabled={isSubmitting}
              required
            >
              <option value="" className="text-zinc-500 bg-zinc-800"></option>
              {levels.map(level => (
                <option key={level.id} value={level.name} className="text-black bg-white">{level.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t("submit.progress")}</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-300/50 transition-all backdrop-blur-sm font-mono text-sm" 
              placeholder="100" 
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t("submit.videoProof")}</label>
            <input 
              type="url" 
              value={videoProof}
              onChange={(e) => setVideoProof(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d8d0b6]/50 transition-all backdrop-blur-sm font-mono text-sm" 
              placeholder={t("submit.videoProofPlaceholder")} 
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-[#d2c89e] to-[#d8d0b6] font-bold rounded-xl shadow-lg shadow-[#d8d0b6]/20 hover:shadow-[#d8d0b6]/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? "Submitting..." : t("submit.submitBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}

