import { useState, FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { useTranslation } from "react-i18next";
import { GlowCard } from "../components/ui/GlowCard";
import { Navigate, useNavigate } from "react-router-dom";
import { collection, getDocs, getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function AuthPage() {
  const { user, loginWithEmail, registerWithEmail, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    let emailToUse = email;
    if (!email.includes("@")) {
      emailToUse = `${email}@obsidian.local`;
    }

    try {
      if (isLogin) {
        await loginWithEmail(emailToUse, password);
        navigate("/");
      } else {
        const username = email.includes("@") ? email.split("@")[0] : email;
        const normalizedUsername = username.trim().toLowerCase();
        
        // Fetch levels and submissions to check if player exists
        const levelsSnap = await getDocs(collection(db, "levels"));
        const levels = levelsSnap.docs.map(doc => doc.data());
        
        const subsSnap = await getDocs(collection(db, "record_submissions"));
        const submissions = subsSnap.docs.map(doc => doc.data());
        
        const isCreator = levels.some(l => (l.creator || "").trim().toLowerCase() === normalizedUsername);
        const isVerifier = levels.some(l => (l.verifier || "").trim().toLowerCase() === normalizedUsername);
        const isSlayer = submissions.some(s => s.status === "accepted" && (s.username || "").trim().toLowerCase() === normalizedUsername);
        
        const isPlayer = isCreator || isVerifier || isSlayer;
        
        let alreadyClaimed = false;
        try {
          const profileDoc = await getDoc(doc(db, "user_profiles", normalizedUsername));
          if (profileDoc.exists() && profileDoc.data().claimed) {
            alreadyClaimed = true;
          }
        } catch (e) {
          console.error("Error checking claim status:", e);
        }

        await registerWithEmail(emailToUse, password);

        if (isPlayer && !alreadyClaimed) {
          // Find original case of name for redirection
          let targetUsername = username;
          const matchingCreator = levels.find(l => (l.creator || "").trim().toLowerCase() === normalizedUsername);
          const matchingVerifier = levels.find(l => (l.verifier || "").trim().toLowerCase() === normalizedUsername);
          const matchingSlayer = submissions.find(s => s.status === "accepted" && (s.username || "").trim().toLowerCase() === normalizedUsername);

          if (matchingVerifier && matchingVerifier.verifier) {
            targetUsername = matchingVerifier.verifier;
          } else if (matchingCreator && matchingCreator.creator) {
            targetUsername = matchingCreator.creator;
          } else if (matchingSlayer && matchingSlayer.username) {
            targetUsername = matchingSlayer.username;
          }

          // Claim the profile
          await setDoc(doc(db, "user_profiles", normalizedUsername), {
            claimed: true,
            claimedBy: emailToUse,
            claimedAt: new Date().toISOString()
          }, { merge: true });
          
          navigate(`/player/${encodeURIComponent(targetUsername)}`);
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication failed. Check your password constraints.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          {isLogin ? "Login" : "Register"}
        </h1>
        <p className="text-zinc-400 font-medium">
          {isLogin ? "Welcome back to Obsidian List" : "Create a new Obsidian List account"}
        </p>
      </div>

      <GlowCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Email or Username
            </label>
            <input 
              type="text" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm" 
              placeholder="player@example.com" 
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm" 
              placeholder="••••••••" 
              required
              minLength={6}
            />
          </div>

          {authError && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {authError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-400 font-bold hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </div>
      </GlowCard>
    </div>
  );
}
