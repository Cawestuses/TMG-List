import React, { useState, useEffect } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../lib/auth";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Level, Verifier, FutureLevel, RecordSubmission, ChangelogItem } from "../types";
import { Navigate, Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user, isAdmin, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"levels" | "verifiers" | "future" | "submissions" | "users" | "changelog">("levels");
  
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [isEditingChangelog, setIsEditingChangelog] = useState<ChangelogItem | null>(null);
  const [changelogToDelete, setChangelogToDelete] = useState<string | null>(null);
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [submissions, setSubmissions] = useState<RecordSubmission[]>([]);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [isEditingLevel, setIsEditingLevel] = useState<Level | null>(null);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);

  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [isEditingVerifier, setIsEditingVerifier] = useState<Verifier | null>(null);
  const [verifierToDelete, setVerifierToDelete] = useState<string | null>(null);
  
  const [futureLevels, setFutureLevels] = useState<FutureLevel[]>([]);
  const [isEditingFuture, setIsEditingFuture] = useState<FutureLevel | null>(null);
  const [futureToDelete, setFutureToDelete] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const [isImportingFuture, setIsImportingFuture] = useState(false);
  const [importFutureText, setImportFutureText] = useState("");
  const [importFutureError, setImportFutureError] = useState("");

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState("https://docs.google.com/spreadsheets/d/1X5X9m74H6eTfP8e5a-Cbe6R8d3z9H1Z6iV6h5L6X_-0/export?format=csv");
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadLevels();
      loadVerifiers();
      loadFutureLevels();
      loadSubmissions();
      loadChangelogs();
    }
  }, [isAdmin]);

  const loadChangelogs = async () => {
    const snap = await getDocs(collection(db, "changelog"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ChangelogItem);
    setChangelogs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const loadSubmissions = async () => {
    const snap = await getDocs(collection(db, "record_submissions"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RecordSubmission);
    setSubmissions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const loadLevels = async () => {
    const snap = await getDocs(collection(db, "levels"));
    const data = snap.docs.map(doc => doc.data() as Level);
    setLevels(data.sort((a, b) => a.rank - b.rank));
  };
  
  const loadVerifiers = async () => {
    const snap = await getDocs(collection(db, "verifiers"));
    const data = snap.docs.map(doc => doc.data() as Verifier);
    setVerifiers(data);
  };
  
  const loadFutureLevels = async () => {
    const snap = await getDocs(collection(db, "future_levels"));
    const data = snap.docs.map(doc => doc.data() as FutureLevel);
    setFutureLevels(data);
  };

  const handleDeleteLevel = (id: string) => {
    setLevelToDelete(id);
  };

  const confirmDeleteLevel = async () => {
    if (levelToDelete) {
      await deleteDoc(doc(db, "levels", levelToDelete));
      setLevelToDelete(null);
      await loadLevels();
    }
  };

  const handleDeleteVerifier = (id: string) => {
    setVerifierToDelete(id);
  };

  const confirmDeleteVerifier = async () => {
    if (verifierToDelete) {
      await deleteDoc(doc(db, "verifiers", verifierToDelete));
      setVerifierToDelete(null);
      await loadVerifiers();
    }
  };
  
  const handleDeleteFuture = (id: string) => {
    setFutureToDelete(id);
  };

  const confirmDeleteFuture = async () => {
    if (futureToDelete) {
      await deleteDoc(doc(db, "future_levels", futureToDelete));
      setFutureToDelete(null);
      await loadFutureLevels();
    }
  };

  const handleDeleteSubmission = (id: string) => {
    setSubmissionToDelete(id);
  };

  const confirmDeleteSubmission = async () => {
    if (submissionToDelete) {
      await deleteDoc(doc(db, "record_submissions", submissionToDelete));
      setSubmissionToDelete(null);
      await loadSubmissions();
    }
  };

  const handleAcceptSubmission = async (id: string) => {
    await updateDoc(doc(db, "record_submissions", id), { status: "accepted" });
    await loadSubmissions();
  };

  const handleRejectSubmission = async (id: string) => {
    await updateDoc(doc(db, "record_submissions", id), { status: "rejected" });
    await loadSubmissions();
  };

  const handleDeleteChangelog = (id: string) => {
    setChangelogToDelete(id);
  };

  const confirmDeleteChangelog = async () => {
    if (changelogToDelete) {
      await deleteDoc(doc(db, "changelog", changelogToDelete));
      setChangelogToDelete(null);
      await loadChangelogs();
      fetch('/api/clear-cache', { method: 'POST' });
    }
  };

  const saveChangelog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingChangelog) return;
    try {
      await setDoc(doc(db, "changelog", isEditingChangelog.id || `log-${Date.now()}`), {
        date: isEditingChangelog.date || new Date().toISOString(),
        content: isEditingChangelog.content
      });
      setIsEditingChangelog(null);
      await loadChangelogs();
      fetch('/api/clear-cache', { method: 'POST' });
    } catch (err) {
      console.error(err);
      alert("Failed to save changelog.");
    }
  };

  const saveLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingLevel) return;
    
    // Convert to proper types
    const levelToSave: Level = {
      ...isEditingLevel,
      rank: Number(isEditingLevel.rank),
      points: Number(isEditingLevel.points),
      victors: Number(isEditingLevel.victors),
      isActive: Boolean(isEditingLevel.isActive)
    };

    const isNew = !levels.find(l => l.id === levelToSave.id);

    try {
      if (isNew) {
        const batch = writeBatch(db);
        levels.forEach(l => {
          if (l.rank >= levelToSave.rank) {
            batch.update(doc(db, "levels", l.id), { rank: Number(l.rank) + 1 });
          }
        });
        batch.set(doc(db, "levels", levelToSave.id || `lvl-${Date.now()}`), levelToSave);
        await batch.commit();
      } else {
        await setDoc(doc(db, "levels", levelToSave.id), levelToSave);
      }
      
      setIsEditingLevel(null);
      await loadLevels();
    } catch (err) {
      console.error(err);
      alert("Failed to save level. " + err);
    }
  };

  const saveVerifier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingVerifier) return;
    
    const verifierToSave: Verifier = {
      ...isEditingVerifier
    };

    try {
      await setDoc(doc(db, "verifiers", verifierToSave.id || `ver-${Date.now()}`), verifierToSave);
      setIsEditingVerifier(null);
      await loadVerifiers();
    } catch (err) {
      console.error(err);
      alert("Failed to save verifier. " + err);
    }
  };

  const saveFuture = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingFuture) return;
    
    const futureToSave: FutureLevel = {
      ...isEditingFuture
    };

    try {
      await setDoc(doc(db, "future_levels", futureToSave.id || `fut-${Date.now()}`), futureToSave);
      setIsEditingFuture(null);
      await loadFutureLevels();
    } catch (err) {
      console.error(err);
      alert("Failed to save future level. " + err);
    }
  };

  const handleImportText = async () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error("Target should be a JSON array of levels.");
      }

      for (const item of parsed) {
        const id = item.id || `lvl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const level: Level = {
          id,
          rank: Number(item.rank) || 999,
          name: item.name || "Unknown",
          difficulty: item.difficulty || "Extreme Demon",
          points: Number(item.points) || 0,
          creator: item.creator || "",
          verifier: item.verifier || "",
          victors: Number(item.victors) || 0,
          video: item.video || "",
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true
        };
        await setDoc(doc(db, "levels", id), level);
      }
      setIsImporting(false);
      setImportText("");
      await loadLevels();
      alert("Imported successfully!");
    } catch (err: any) {
      setImportError(err.message || "Invalid JSON format");
    }
  };

  const handleImportFutureText = async () => {
    setImportFutureError("");
    try {
      const parsed = JSON.parse(importFutureText);
      if (!Array.isArray(parsed)) {
        throw new Error("Target should be a JSON array of future levels.");
      }

      for (const item of parsed) {
        const id = item.id || `fut-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const future: FutureLevel = {
          id,
          name: item.name || "Unknown",
          creator: item.creator || "",
          video: item.video || "",
          status: item.status || "Verifying"
        };
        await setDoc(doc(db, "future_levels", id), future);
      }
      setIsImportingFuture(false);
      setImportFutureText("");
      await loadFutureLevels();
      alert("Imported future levels successfully!");
    } catch (err: any) {
      setImportFutureError(err.message || "Invalid JSON format");
    }
  };

  const handleSyncSheets = async () => {
    if (!sheetsUrl.trim()) {
      alert("Please enter a valid Google Sheets CSV URL.");
      return;
    }
    setIsSyncingSheets(true);
    setSyncLogs("Connecting and loading data from Google Sheets...\n");
    try {
      const res = await fetch("/api/sync-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sheetUrl: sheetsUrl })
      });
      const data = await res.json();
      if (data.status === "success" || data.message) {
        setSyncLogs(prev => prev + `Success!\n\nLogs:\n${(data.logs || []).join("\n")}`);
        alert("Levels synchronized successfully from Google Sheets!");
        await loadLevels();
      } else {
        throw new Error(data.error || "Failed to synchronize sheets.");
      }
    } catch (err: any) {
      setSyncLogs(prev => prev + `Error: ${err.message}`);
      alert("Error: " + err.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  if (loading) return <div className="min-h-screen text-white pt-32 text-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-32 text-center text-white">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="mb-6">You do not have administrative privileges.</p>
        <button onClick={logout} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 text-white px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">{user.email?.replace('@obsidian.local', '')}</span>
          <button onClick={logout} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">Sign out</button>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab("levels")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "levels" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/60 hover:text-white"}`}
        >
          Levels
        </button>
        <button 
          onClick={() => setActiveTab("future")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "future" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/60 hover:text-white"}`}
        >
          Future List
        </button>
        <button 
          onClick={() => setActiveTab("verifiers")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "verifiers" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/60 hover:text-white"}`}
        >
          Verifiers
        </button>
        <button 
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "submissions" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/60 hover:text-white"}`}
        >
          Submissions
        </button>
        <button 
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "users" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/60 hover:text-white"}`}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab("changelog")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "changelog" ? "text-purple-400 border-b-2 border-purple-400" : "text-white/60 hover:text-white"}`}
        >
          Changelog
        </button>
      </div>

      {activeTab === "levels" && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              onClick={() => setIsEditingLevel({
                id: `lvl-${Date.now()}`, rank: levels.length + 1, name: "", difficulty: "Extreme Demon", points: 0, creator: "", verifier: "", victors: 0, video: "", isActive: true
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              + Add New Level
            </button>
            <button 
              onClick={() => setIsImporting(true)}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-bold uppercase"
            >
              Import JSON
            </button>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-bold uppercase"
            >
              Sync from Google Sheets
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">Rank</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Creator / Verifier</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {levels.map(level => (
                  <tr key={level.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">#{level.rank}</td>
                    <td className="p-4 font-bold">{level.name}</td>
                    <td className="p-4 text-white/60">{level.creator} / {level.verifier}</td>
                    <td className="p-4">{level.points}</td>
                    <td className="p-4">
                       {level.isActive ? <span className="text-emerald-400 text-xs">ACTIVE</span> : <span className="text-zinc-500 text-xs">INACTIVE</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingLevel({...level})} className="text-blue-400 hover:underline mr-4">Edit</button>
                      <button onClick={() => handleDeleteLevel(level.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {levels.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/40">No levels found. Try clicking "Sync from Data Sheet".</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "future" && (
        <>
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setIsEditingFuture({
                id: `fut-${Date.now()}`, name: "", creator: "", video: "", status: "Verifying"
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              + Add Future Level
            </button>
            <button 
              onClick={() => setIsImportingFuture(true)}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-bold uppercase"
            >
              Import JSON
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-4xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">Name</th>
                  <th className="p-4">Creator / Verifier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {futureLevels.map(future => (
                  <tr key={future.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-bold">{future.name}</td>
                    <td className="p-4 text-white/60">{future.creator}</td>
                    <td className="p-4 text-cyan-400 font-medium">{future.status}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingFuture({...future})} className="text-blue-400 hover:underline mr-4">Edit</button>
                      <button onClick={() => handleDeleteFuture(future.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {futureLevels.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-white/40">No future levels found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "verifiers" && (
        <>
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setIsEditingVerifier({
                id: `ver-${Date.now()}`, name: ""
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              + Add New Verifier
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-3xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifiers.map(verifier => (
                  <tr key={verifier.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-mono text-white/60 text-xs">{verifier.id}</td>
                    <td className="p-4 font-bold">{verifier.name}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingVerifier({...verifier})} className="text-blue-400 hover:underline mr-4">Edit</button>
                      <button onClick={() => handleDeleteVerifier(verifier.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {verifiers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-white/40">No verifiers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "submissions" && (
        <>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-5xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">Date</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Video</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(submission => (
                  <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-white/60">{new Date(submission.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-bold hover:text-cyan-400">
                      <Link to={`/player/${encodeURIComponent(submission.username)}`} target="_blank">
                        {submission.username}
                      </Link>
                    </td>
                    <td className="p-4 hover:text-cyan-400 font-medium">
                      {(() => {
                        const lvl = levels.find(l => l.name.toLowerCase() === submission.levelName.toLowerCase());
                        return lvl ? (
                          <Link to={`/level/${lvl.id}`} target="_blank">{submission.levelName}</Link>
                        ) : (
                          submission.levelName
                        );
                      })()}
                    </td>
                    <td className="p-4 text-cyan-400 font-medium">{submission.progress}%</td>
                    <td className="p-4 text-white/60 capitalize">{submission.status}</td>
                    <td className="p-4"><a href={submission.videoProof} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Link</a></td>
                    <td className="p-4 text-right">
                      {submission.status === "pending" && (
                        <>
                          <button onClick={() => handleAcceptSubmission(submission.id)} className="text-emerald-400 hover:underline mr-4">Accept</button>
                          <button onClick={() => handleRejectSubmission(submission.id)} className="text-[#a855f7] hover:underline mr-4">Reject</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteSubmission(submission.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/40">No record submissions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-8 max-w-2xl text-center mx-auto">
          <h2 className="text-xl font-bold mb-4 font-heading">Users are now managed securely</h2>
          <p className="text-white/60 mb-6">
            For security reasons, app users are no longer stored in public database tables. All users are now safely isolated in Firebase Authentication. 
          </p>
          <p className="text-white/60 mb-8">
            Please use the <strong className="text-white">Authentication &gt; Users</strong> tab in your <a href="https://console.firebase.google.com" target="_blank" className="text-emerald-400 hover:underline">Firebase Console</a> to manage (view, add, or delete) users.
          </p>
        </div>
      )}

      {activeTab === "changelog" && (
        <>
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setIsEditingChangelog({
                id: `log-${Date.now()}`, date: new Date().toISOString(), content: ""
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              + Add Changelog
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-3xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">Date</th>
                  <th className="p-4">Content</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {changelogs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-white/60">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="p-4 font-bold max-w-sm truncate">{log.content}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingChangelog({...log})} className="text-blue-400 hover:underline mr-4">Edit</button>
                      <button onClick={() => handleDeleteChangelog(log.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {changelogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-white/40">No changelog entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isEditingLevel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={saveLevel} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-xl">
            <h2 className="text-xl font-bold mb-4">{levels.find(l => l.id === isEditingLevel.id) ? "Edit Level" : "New Level"}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">ID</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.id} onChange={(e) => setIsEditingLevel({...isEditingLevel, id: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Rank</label>
                 <input type="number" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.rank} onChange={(e) => setIsEditingLevel({...isEditingLevel, rank: Number(e.target.value)})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Name</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.name} onChange={(e) => setIsEditingLevel({...isEditingLevel, name: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Difficulty</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.difficulty} onChange={(e) => setIsEditingLevel({...isEditingLevel, difficulty: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Creator</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.creator} onChange={(e) => setIsEditingLevel({...isEditingLevel, creator: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Verifier</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.verifier} onChange={(e) => setIsEditingLevel({...isEditingLevel, verifier: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Points</label>
                 <input type="number" step="0.1" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.points} onChange={(e) => setIsEditingLevel({...isEditingLevel, points: parseFloat(e.target.value)})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Victors</label>
                 <input type="number" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.victors} onChange={(e) => setIsEditingLevel({...isEditingLevel, victors: parseInt(e.target.value, 10)})} required />
              </div>
              <div className="col-span-2">
                 <label className="block text-xs uppercase text-white/50 mb-1">Video URL / #</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.video} onChange={(e) => setIsEditingLevel({...isEditingLevel, video: e.target.value})} required />
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-2">
                 <input type="checkbox" id="isActive" checked={isEditingLevel.isActive} onChange={(e) => setIsEditingLevel({...isEditingLevel, isActive: e.target.checked})} />
                 <label htmlFor="isActive" className="text-sm">Is Active (accounts for leaderboards)</label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingLevel(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      {isEditingVerifier && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={saveVerifier} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{verifiers.find(v => v.id === isEditingVerifier.id) ? "Edit Verifier" : "New Verifier"}</h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">ID (leave to generate)</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingVerifier.id} onChange={(e) => setIsEditingVerifier({...isEditingVerifier, id: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Name</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingVerifier.name} onChange={(e) => setIsEditingVerifier({...isEditingVerifier, name: e.target.value})} required />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingVerifier(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      {isEditingFuture && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={saveFuture} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{futureLevels.find(f => f.id === isEditingFuture.id) ? "Edit Future Level" : "New Future Level"}</h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Name</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingFuture.name} onChange={(e) => setIsEditingFuture({...isEditingFuture, name: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Creator / Verifier</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingFuture.creator} onChange={(e) => setIsEditingFuture({...isEditingFuture, creator: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Video Link</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingFuture.video} onChange={(e) => setIsEditingFuture({...isEditingFuture, video: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Status</label>
                 <select className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingFuture.status} onChange={(e) => setIsEditingFuture({...isEditingFuture, status: e.target.value})} required>
                    <option value="Verifying">Verifying</option>
                    <option value="Building">Building</option>
                    <option value="Layout">Layout</option>
                    <option value="Decorating">Decorating</option>
                    <option value="Dropped">Dropped</option>
                 </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingFuture(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      {isEditingChangelog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={saveChangelog} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{changelogs.find(l => l.id === isEditingChangelog.id) ? "Edit Changelog" : "New Changelog"}</h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Date</label>
                 <input type="datetime-local" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={(isEditingChangelog.date || '').slice(0, 16)} onChange={(e) => setIsEditingChangelog({...isEditingChangelog, date: new Date(e.target.value).toISOString()})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Content</label>
                 <textarea className="w-full bg-black border border-white/10 rounded p-2 text-white h-24" value={isEditingChangelog.content} onChange={(e) => setIsEditingChangelog({...isEditingChangelog, content: e.target.value})} required />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingChangelog(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      {levelToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this level?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setLevelToDelete(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmDeleteLevel} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {verifierToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this verifier?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setVerifierToDelete(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmDeleteVerifier} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {futureToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this future level?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setFutureToDelete(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmDeleteFuture} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {submissionToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this record submission?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setSubmissionToDelete(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmDeleteSubmission} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {changelogToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this changelog entry?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setChangelogToDelete(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmDeleteChangelog} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Import Levels (JSON)</h2>
            <p className="text-sm text-white/60 mb-4">Paste an array of level objects here. Make sure it matches the <code>Level</code> schema.</p>
            {importError && <p className="text-red-400 text-sm mb-4">{importError}</p>}
            <textarea 
              className="w-full h-64 bg-black border border-white/10 rounded p-4 text-sm font-mono text-white mb-4"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={'[\n  {\n    "rank": 1,\n    "name": "Level Name",\n    ...\n  }\n]'}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsImporting(false)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={handleImportText} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white">Import</button>
            </div>
          </div>
        </div>
      )}

      {isImportingFuture && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Import Future Levels (JSON)</h2>
            <p className="text-sm text-white/60 mb-4">Paste an array of future level objects here. Make sure it matches the <code>FutureLevel</code> schema.</p>
            {importFutureError && <p className="text-red-400 text-sm mb-4">{importFutureError}</p>}
            <textarea 
              className="w-full h-64 bg-black border border-white/10 rounded p-4 text-sm font-mono text-white mb-4"
              value={importFutureText}
              onChange={e => setImportFutureText(e.target.value)}
              placeholder={'[\n  {\n    "name": "Level Name",\n    "creator": "Player",\n    "status": "Verifying",\n    "video": "https://youtu.be/..."\n  }\n]'}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsImportingFuture(false)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={handleImportFutureText} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white">Import</button>
            </div>
          </div>
        </div>
      )}

      {isSheetsModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-2 font-heading text-cyan-400">Sync Levels from Google Sheets (CSV)</h2>
            <p className="text-sm text-white/60 mb-4">
              Publish your Google Sheet to the web as a CSV (**File &gt; Share &gt; Publish to web &gt; Comma-separated values (.csv)**), then paste the generated URL below:
            </p>
            <input 
              type="text"
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:outline-none focus:border-cyan-500 font-mono"
              value={sheetsUrl}
              onChange={e => setSheetsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
            />
            
            {syncLogs && (
              <div className="bg-black/50 border border-white/5 rounded-xl p-3 mb-4 max-h-48 overflow-y-auto">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-2">Sync Status Logs</p>
                <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">{syncLogs}</pre>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setIsSheetsModalOpen(false);
                  setSyncLogs("");
                }} 
                className="px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-colors"
                disabled={isSyncingSheets}
              >
                Close
              </button>
              <button 
                onClick={handleSyncSheets} 
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:-translate-y-0.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-cyan-500/15 transition-all disabled:opacity-50"
                disabled={isSyncingSheets}
              >
                {isSyncingSheets ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
