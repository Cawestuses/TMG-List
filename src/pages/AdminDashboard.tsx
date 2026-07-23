import React, { useState, useEffect } from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { useAuth } from "../lib/auth";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, updateDoc, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Level, Verifier, FutureLevel, BeautyLevel, RecordSubmission, ChangelogItem } from "../types";
import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { calculatePointsForRank } from "../hooks/usePlayers";
import { updateLevelsCache } from "../hooks/useLevels";
import { updateFutureLevelsCache } from "../hooks/useFutureLevels";
import { updateBeautyLevelsCache } from "../hooks/useBeautyLevels";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { Upload, Image as ImageIcon, X, Trash2 } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firebaseError";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || "";
  const isLocalOrCloudRun = typeof window !== "undefined" && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
  return (envUrl.includes("onrender.com") || isLocalOrCloudRun) ? "" : envUrl;
};

export default function AdminDashboard() {
  const { user, isAdmin, isElderModer, isModerator, role: userRole, loading, logout } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"levels" | "verifiers" | "future" | "beauty" | "submissions" | "users" | "changelog" | "logs" | "settings">("levels");
  
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [isEditingChangelog, setIsEditingChangelog] = useState<ChangelogItem | null>(null);
  const [changelogToDelete, setChangelogToDelete] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [beautyLevels, setBeautyLevels] = useState<any[]>([]);
  const [isEditingBeauty, setIsEditingBeauty] = useState<any | null>(null);
  const [beautyToDelete, setBeautyToDelete] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<RecordSubmission[]>([]);
  const [isEditingLevel, setIsEditingLevel] = useState<Level | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);

  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [isEditingVerifier, setIsEditingVerifier] = useState<Verifier | null>(null);
  const [verifierToDelete, setVerifierToDelete] = useState<string | null>(null);
  
  const [futureLevels, setFutureLevels] = useState<FutureLevel[]>([]);
  const [isEditingFuture, setIsEditingFuture] = useState<FutureLevel | null>(null);
  const [futureToDelete, setFutureToDelete] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [isFixingRanks, setIsFixingRanks] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const [isImportingFuture, setIsImportingFuture] = useState(false);
  const [importFutureText, setImportFutureText] = useState("");
  const [importFutureError, setImportFutureError] = useState("");

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState("https://docs.google.com/spreadsheets/d/1X5X9m74H6eTfP8e5a-Cbe6R8d3z9H1Z6iV6h5L6X_-0/export?format=csv");
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState("");

  // Role and Log States (Task 5)
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");
  const [logsList, setLogsList] = useState<any[]>([]);

  // Submissions reject/accept modal states (Task 1)
  const [submissionWithComment, setSubmissionWithComment] = useState<{ id: string; action: "accept" | "reject" | "delete"; submission: RecordSubmission } | null>(null);
  const [moderatorComment, setModeratorComment] = useState("");

  const hasAccess = isAdmin || isElderModer || isModerator;

  const { settings, updateSettings } = useSiteSettings();
  const [logoInput, setLogoInput] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (settings.logoUrl !== undefined) {
      setLogoInput(settings.logoUrl);
    }
  }, [settings]);

  useEffect(() => {
    if (hasAccess) {
      loadLevels();
      loadBeautyLevels();
      loadVerifiers();
      loadFutureLevels();
      loadSubmissions();
      loadChangelogs();
      if (isElderModer || isAdmin) {
        loadProfiles();
        loadLogs();
      }
    }
  }, [hasAccess, isElderModer, isAdmin]);

  const loadChangelogs = async () => {
    try {
      const snap = await getDocs(collection(db, "changelog"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ChangelogItem);
      setChangelogs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Error loading changelogs:", err);
      handleFirestoreError(err, OperationType.LIST, "changelog");
    }
  };

  const loadSubmissions = async () => {
    try {
      const snap = await getDocs(collection(db, "record_submissions"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RecordSubmission);
      setSubmissions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Error loading submissions:", err);
      handleFirestoreError(err, OperationType.LIST, "record_submissions");
    }
  };

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const snap = await getDocs(collection(db, "user_profiles"));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProfiles(data);
    } catch (err) {
      console.error("Error loading profiles:", err);
      handleFirestoreError(err, OperationType.LIST, "user_profiles");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadLogs = async () => {
    try {
      const snap = await getDocs(collection(db, "moderator_logs"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setLogsList(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error("Failed to load moderator action logs:", err);
      handleFirestoreError(err, OperationType.LIST, "moderator_logs");
    }
  };

  const handleUpdateRole = async (profileId: string, newRole: string) => {
    try {
      if (userRole === "elder_moder" && ["admin", "elder_moder"].includes(newRole)) {
         return alert("You do not have permission to assign this role.");
      }
      await updateDoc(doc(db, "user_profiles", profileId), { role: newRole });
      await loadProfiles();
      
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "moderator_logs", logId), {
        id: logId,
        moderatorEmail: user?.email || "",
        moderatorUsername: user?.username || (user?.email ? user.email.split('@')[0] : "Admin"),
        action: "updated_role",
        details: `Changed role of user "${profileId}" to "${newRole}"`,
        timestamp: new Date().toISOString()
      });
      alert(`User role updated successfully to "${newRole}"`);
    } catch (err: any) {
      console.error("Failed to update role:", err);
      alert("Error updating role: " + err.message);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (!isAdmin) return;
    setProfileToDelete(profileId);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    try {
      await deleteDoc(doc(db, "user_profiles", profileToDelete));
      await loadProfiles();
      
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "moderator_logs", logId), {
        id: logId,
        moderatorEmail: user?.email || "",
        moderatorUsername: user?.username || (user?.email ? user.email.split('@')[0] : "Admin"),
        action: "deleted_profile",
        details: `Deleted user profile entry: "${profileToDelete}".`,
        timestamp: new Date().toISOString()
      });
      setProfileToDelete(null);
    } catch (err: any) {
      console.error(err);
      setProfileToDelete(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSettings({ logoUrl: logoInput });
      
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "moderator_logs", logId), {
        id: logId,
        moderatorEmail: user?.email || "",
        moderatorUsername: user?.username || (user?.email ? user.email.split('@')[0] : "Admin"),
        action: "updated_settings",
        details: `Updated site logo URL`,
        timestamp: new Date().toISOString()
      });
      
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 700 * 1024) { // 700KB limit for firestore document (Base64 is ~33% larger)
        alert("Файл слишком большой. Пожалуйста, сожмите картинку до 700KB или используйте URL.");
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoInput(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const loadLevels = async () => {
    const snap = await getDocs(collection(db, "levels"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Level));
    const sorted = data.sort((a, b) => a.rank - b.rank);
    setLevels(sorted);
    updateLevelsCache(sorted);
  };
  
  const loadBeautyLevels = async () => {
    const snap = await getDocs(collection(db, "beauty_levels"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BeautyLevel[];
    const sorted = data.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    setBeautyLevels(sorted);
    updateBeautyLevelsCache(sorted);
  };
  
  const loadVerifiers = async () => {
    const snap = await getDocs(collection(db, "verifiers"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Verifier));
    setVerifiers(data);
  };
  
  const loadFutureLevels = async () => {
    const snap = await getDocs(collection(db, "future_levels"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FutureLevel));
    setFutureLevels(data);
    updateFutureLevelsCache(data);
    const API_BASE_URL = getApiBaseUrl();
    fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
  };

  const handleDeleteLevel = (id: string) => {
    setLevelToDelete(id);
  };

  const confirmDeleteLevel = async () => {
    if (levelToDelete) {
      const lvl = levels.find(l => l.id === levelToDelete);
      const batch = writeBatch(db);
      batch.delete(doc(db, "levels", levelToDelete));

      if (lvl) {
         levels.forEach(l => {
            if (l.rank > lvl.rank) {
               batch.update(doc(db, "levels", l.id), {
                  rank: l.rank - 1,
                  points: calculatePointsForRank(l.rank - 1)
               });
            }
         });
      }
      
      await batch.commit();
      setLevelToDelete(null);
      await loadLevels();
      const API_BASE_URL = getApiBaseUrl();
      fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleDeleteBeauty = (id: string) => {
    setBeautyToDelete(id);
  };

  const confirmDeleteBeauty = async () => {
    if (beautyToDelete) {
      const lvl = beautyLevels.find(l => l.id === beautyToDelete);
      const batch = writeBatch(db);
      batch.delete(doc(db, "beauty_levels", beautyToDelete));

      if (lvl) {
         beautyLevels.forEach(l => {
            if (l.rank > lvl.rank) {
               batch.update(doc(db, "beauty_levels", l.id), {
                  rank: l.rank - 1
               });
            }
         });
      }
      
      await batch.commit();
      setBeautyToDelete(null);
      await loadBeautyLevels();
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
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      setSubmissionWithComment({ id, action: "delete", submission: sub });
      setModeratorComment("");
    }
  };

  const handleAcceptSubmission = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      setSubmissionWithComment({ id, action: "accept", submission: sub });
      setModeratorComment("");
    }
  };

  const handleRejectSubmission = async (id: string) => {
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      setSubmissionWithComment({ id, action: "reject", submission: sub });
      setModeratorComment("");
    }
  };

  const confirmSubmissionAction = async () => {
    if (!submissionWithComment) return;
    const { id, action, submission } = submissionWithComment;
    const status = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "deleted";
    
    try {
      if (action === "delete") {
        await deleteDoc(doc(db, "record_submissions", id));
      } else {
        await updateDoc(doc(db, "record_submissions", id), { status: status });
      }

      // Recalculate victors immediately
      if (submission.levelName) {
        const lvl = levels.find(l => l.name.trim().toLowerCase() === submission.levelName.trim().toLowerCase());
        if (lvl) {
          const subsSnap = await getDocs(query(
            collection(db, "record_submissions"),
            where("levelName", "==", lvl.name)
          ));
          let count = 0;
          subsSnap.forEach(s => {
             const data = s.data();
             if (data.status === "accepted" && Number(data.progress) === 100) {
               count++;
             }
          });
          if (lvl.victors !== count) {
            await updateDoc(doc(db, "levels", lvl.id), { victors: count });
            await loadLevels(); // Refresh the list for Admin Dashboard
            const API_BASE_URL = getApiBaseUrl();
            fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
          }
        }
      }
      
      // 2. Add notification for the user (Task 1)
      const notificationId = `notif-${Date.now()}`;
      await setDoc(doc(db, "notifications", notificationId), {
        id: notificationId,
        userId: submission.userId || "",
        userEmail: submission.userEmail || "",
        levelName: submission.levelName || "",
        progress: submission.progress || 100,
        status: status,
        comment: moderatorComment.trim(),
        read: false,
        timestamp: new Date().toISOString(),
        videoProof: submission.videoProof || "",
        moderator: user?.email || "Admin"
      });
      
      // 3. Add Moderator Action Log (Task 5)
      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "moderator_logs", logId), {
        id: logId,
        moderatorEmail: user?.email || "",
        moderatorUsername: user?.username || (user?.email ? user.email.split('@')[0] : "Admin"),
        action: action === "accept" ? "approved_record" : action === "reject" ? "rejected_record" : "deleted_record",
        details: `${action === "accept" ? "Approved" : action === "reject" ? "Rejected" : "Deleted"} submission for level "${submission.levelName}" by player "${submission.username}" with progress ${submission.progress}%. Comment: "${moderatorComment.trim()}"`,
        timestamp: new Date().toISOString()
      });
      
      setSubmissionWithComment(null);
      setModeratorComment("");
      await loadSubmissions();
      if (isElderModer || isAdmin) {
        await loadLogs();
      }
    } catch (err: any) {
      console.error("Failed to confirm submission action:", err);
      alert("Error confirming action: " + err.message);
    }
  };

  const fixRanksAndPoints = async () => {
    if (!window.confirm("Are you sure you want to recalculate all ranks and points? This will sort levels by their current rank and sequentially assign ranks starting from 1.")) return;
    setIsFixingRanks(true);
    try {
      const sortedLevels = [...levels].sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.name.localeCompare(b.name);
      });
      const batch = writeBatch(db);
      let updatedCount = 0;
      sortedLevels.forEach((level, index) => {
        const correctRank = index + 1;
        const correctPoints = calculatePointsForRank(correctRank);
        if (level.rank !== correctRank || level.points !== correctPoints) {
          batch.update(doc(db, "levels", level.id), {
            rank: correctRank,
            points: correctPoints
          });
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        await batch.commit();
        const logId = `log-${Date.now()}`;
        await setDoc(doc(db, "moderator_logs", logId), {
          id: logId,
          moderatorEmail: user?.email || "",
          moderatorUsername: user?.username || (user?.email ? user.email.split('@')[0] : "Admin"),
          action: "fixed_ranks",
          details: `Triggered automatic fix for level ranks and points. Corrected ${updatedCount} levels.`,
          timestamp: new Date().toISOString()
        });
        await loadLevels();
        const API_BASE_URL = getApiBaseUrl();
        fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
        alert(`Ranks and points successfully fixed for ${updatedCount} levels!`);
      } else {
        alert("All levels already have the correct ranks and points.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error fixing ranks: " + err.message);
    } finally {
      setIsFixingRanks(false);
    }
  };

  const handleDeleteChangelog = (id: string) => {
    setChangelogToDelete(id);
  };

  const confirmDeleteChangelog = async () => {
    if (changelogToDelete) {
      await deleteDoc(doc(db, "changelog", changelogToDelete));
      setChangelogToDelete(null);
      await loadChangelogs();
      const API_BASE_URL = getApiBaseUrl();
      fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
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
      const API_BASE_URL = getApiBaseUrl();
      fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
    } catch (err) {
      console.error(err);
      alert("Failed to save changelog.");
    }
  };

  const handleImageFile = (file: File, targetType: "level" | "future" | "beauty" = "level") => {
    if (!file) return;
    if (targetType === "future" && !isEditingFuture) return;
    if (targetType === "level" && !isEditingLevel) return;
    if (targetType === "beauty" && !isEditingBeauty) return;
    
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    
    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessingImage(false);
          return;
        }

        // Keep document extremely lightweight by scaling to high quality standard width
        const maxWidth = 640;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        if (targetType === "future") {
          setIsEditingFuture(prev => prev ? { ...prev, thumbnail: base64 } : null);
        } else if (targetType === "beauty") {
          setIsEditingBeauty(prev => prev ? { ...prev, thumbnail: base64 } : null);
        } else {
          setIsEditingLevel(prev => prev ? { ...prev, thumbnail: base64 } : null);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        alert("Failed to compile image structure. Try another file.");
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      alert("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const saveLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingLevel) return;
    
    const newRank = Number(isEditingLevel.rank);
    const customPoints = Number(isEditingLevel.points) !== undefined && !isNaN(Number(isEditingLevel.points))
      ? Number(isEditingLevel.points)
      : calculatePointsForRank(newRank);

    const levelToSave: Level = {
      ...isEditingLevel,
      rank: newRank,
      points: customPoints,
      victors: Number(isEditingLevel.victors),
      isActive: Boolean(isEditingLevel.isActive),
      geometryDashId: String(isEditingLevel.geometryDashId || ""),
      thumbnail: String(isEditingLevel.thumbnail || "")
    };

    const isNew = !levels.find(l => l.id === levelToSave.id);
    const oldLevel = levels.find(l => l.id === levelToSave.id);
    const oldRank = oldLevel ? oldLevel.rank : null;

    try {
      const batch = writeBatch(db);

      if (isNew) {
         levels.forEach(l => {
            if (l.rank >= newRank) {
               batch.update(doc(db, "levels", l.id), {
                 rank: l.rank + 1,
                 points: calculatePointsForRank(l.rank + 1)
               });
            }
         });
      } else if (oldRank !== null && oldRank !== newRank) {
         levels.forEach(l => {
            if (l.id === levelToSave.id) return;
            if (oldRank < newRank) {
               if (l.rank > oldRank && l.rank <= newRank) {
                  batch.update(doc(db, "levels", l.id), {
                    rank: l.rank - 1,
                    points: calculatePointsForRank(l.rank - 1)
                  });
               }
            } else {
               if (l.rank >= newRank && l.rank < oldRank) {
                  batch.update(doc(db, "levels", l.id), {
                    rank: l.rank + 1,
                    points: calculatePointsForRank(l.rank + 1)
                  });
               }
            }
         });
      }

      batch.set(doc(db, "levels", levelToSave.id || `lvl-${Date.now()}`), levelToSave);
      await batch.commit();

      const logId = `log-${Date.now()}`;
      await setDoc(doc(db, "moderator_logs", logId), {
        id: logId,
        moderatorEmail: user?.email || "",
        moderatorUsername: user?.username || (user?.email ? user.email.split('@')[0] : "Admin"),
        action: isNew ? "added_level" : "edited_level",
        details: `${isNew ? "Added" : "Edited"} level "${levelToSave.name}" at rank ${levelToSave.rank} (points automatically calculated: ${levelToSave.points})`,
        timestamp: new Date().toISOString()
      });

      setIsEditingLevel(null);
      await loadLevels();
      const API_BASE_URL = getApiBaseUrl();
      fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});
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

  const saveBeautyLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingBeauty) return;
    
    const newRank = Number(isEditingBeauty.rank);

    const beautyToSave = {
      ...isEditingBeauty,
      rank: newRank
    };

    const isNew = !beautyLevels.find(l => l.id === beautyToSave.id);
    const oldLevel = beautyLevels.find(l => l.id === beautyToSave.id);
    const oldRank = oldLevel ? oldLevel.rank : null;

    try {
      const batch = writeBatch(db);

      if (isNew) {
         beautyLevels.forEach(l => {
            if (l.rank >= newRank) {
               batch.update(doc(db, "beauty_levels", l.id), {
                 rank: l.rank + 1
               });
            }
         });
      } else if (oldRank !== null && oldRank !== newRank) {
         beautyLevels.forEach(l => {
            if (l.id === beautyToSave.id) return;
            if (oldRank < newRank) {
               if (l.rank > oldRank && l.rank <= newRank) {
                  batch.update(doc(db, "beauty_levels", l.id), {
                    rank: l.rank - 1
                  });
               }
            } else {
               if (l.rank >= newRank && l.rank < oldRank) {
                  batch.update(doc(db, "beauty_levels", l.id), {
                    rank: l.rank + 1
                  });
               }
            }
         });
      }

      batch.set(doc(db, "beauty_levels", beautyToSave.id || `beauty-${Date.now()}`), beautyToSave);
      await batch.commit();

      setIsEditingBeauty(null);
      await loadBeautyLevels();
    } catch (err) {
      console.error(err);
      alert("Failed to save beauty level. " + err);
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
          isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          geometryDashId: item.geometryDashId || ""
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
      const API_BASE_URL = getApiBaseUrl();
      const res = await fetch(`${API_BASE_URL}/api/sync-sheets`, {
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

  if (loading) return <div className="min-h-screen text-white pt-32 text-center">{t("common.loading", "Loading...")}</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-32 text-center text-white">
        <h1 className="text-3xl font-bold mb-6">{t("admin.accessDenied")}</h1>
        <p className="mb-6">{t("admin.accessDeniedMessage")}</p>
        <button onClick={logout} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl">
          {t("admin.signOut")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 text-white px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-heading">{t("admin.title")}</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">{user.username || user.email?.replace('@obsidian.local', '')}</span>
          <button onClick={logout} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm">{t("admin.signOut")}</button>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab("levels")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "levels" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
        >
          {t("admin.tabs.levels")}
        </button>
        <button 
          onClick={() => setActiveTab("future")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "future" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
        >
          {t("admin.tabs.future")}
        </button>
        <button 
          onClick={() => setActiveTab("beauty")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "beauty" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
        >
          Топ по красоте
        </button>
        <button 
          onClick={() => setActiveTab("verifiers")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "verifiers" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
        >
          {t("admin.tabs.verifiers")}
        </button>
        <button 
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "submissions" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
        >
          {t("admin.tabs.submissions")}
        </button>
        {(isElderModer || isAdmin) && (
          <>
            <button 
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 font-bold transition-colors ${activeTab === "users" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
            >
              {t("admin.tabs.users")}
            </button>
            <button 
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 font-bold transition-colors ${activeTab === "logs" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
            >
              {t("admin.tabs.logs")}
            </button>
          </>
        )}
        <button 
          onClick={() => setActiveTab("changelog")}
          className={`px-4 py-2 font-bold transition-colors ${activeTab === "changelog" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
        >
          {t("admin.tabs.changelog")}
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-bold transition-colors ${activeTab === "settings" ? "text-[#d8d0b6] border-b-2 border-[#d8d0b6]" : "text-white/60 hover:text-white"}`}
          >
            {t("admin.tabs.settings", "Настройки")}
          </button>
        )}
      </div>

      {activeTab === "levels" && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              onClick={() => setIsEditingLevel({
                id: `lvl-${Date.now()}`, rank: levels.length + 1, name: "", difficulty: "Extreme Demon", points: 0, creator: "", verifier: "", victors: 0, video: "", isActive: true, thumbnail: "", geometryDashId: ""
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              {t("admin.levels.addButton")}
            </button>
            <button 
              onClick={() => setIsImporting(true)}
              className="px-4 py-2 bg-[#d8d0b6]/20 text-[#d8d0b6] border border-[#d8d0b6]/30 rounded-lg text-sm font-bold uppercase"
            >
              {t("admin.levels.importJSON")}
            </button>
            <button 
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-4 py-2 bg-[#cfbe94]/20 text-[#cfbe94] border border-amber-300/30 rounded-lg text-sm font-bold uppercase"
            >
              {t("admin.levels.syncSheets")}
            </button>
            <button 
              onClick={fixRanksAndPoints}
              disabled={isFixingRanks}
              className="px-4 py-2 bg-[#d8d0b6]/20 text-[#d8d0b6] border border-[#d8d0b6]/30 rounded-lg text-sm font-bold uppercase disabled:opacity-50"
            >
              {isFixingRanks ? t("admin.levels.fixing") : t("admin.levels.fixRanks")}
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">{t("admin.levels.rank")}</th>
                  <th className="p-4">{t("admin.levels.name")}</th>
                  <th className="p-4">{t("admin.levels.creatorVerifier")}</th>
                  <th className="p-4">{t("admin.levels.points")}</th>
                  <th className="p-4">{t("admin.levels.active")}</th>
                  <th className="p-4 text-right">{t("admin.levels.actions")}</th>
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
                       {level.isActive ? <span className="text-emerald-400 text-xs">{t("admin.levels.activeStatus")}</span> : <span className="text-zinc-500 text-xs">{t("admin.levels.inactiveStatus")}</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingLevel({...level})} className="text-[#cfbe94] hover:underline mr-4">{t("admin.levels.edit")}</button>
                      <button onClick={() => handleDeleteLevel(level.id)} className="text-red-400 hover:underline">{t("admin.levels.delete")}</button>
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
                id: `fut-${Date.now()}`, name: "", creator: "", video: "", status: "Verifying", thumbnail: ""
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              {t("admin.future.addButton")}
            </button>
            <button 
              onClick={() => setIsImportingFuture(true)}
              className="px-4 py-2 bg-[#d8d0b6]/20 text-[#d8d0b6] border border-[#d8d0b6]/30 rounded-lg text-sm font-bold uppercase"
            >
              {t("admin.future.importJSON")}
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-4xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4">{t("admin.future.name")}</th>
                  <th className="p-4">{t("admin.future.creatorVerifier")}</th>
                  <th className="p-4">{t("admin.future.status")}</th>
                  <th className="p-4 text-right">{t("admin.future.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {futureLevels.map(future => (
                  <tr key={future.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-bold">{future.name}</td>
                    <td className="p-4 text-white/60">{future.creator}</td>
                    <td className="p-4 text-[#cfbe94] font-medium">{future.status}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingFuture({...future})} className="text-[#cfbe94] hover:underline mr-4">Edit</button>
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

      {activeTab === "beauty" && (
        <>
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setIsEditingBeauty({
                id: `beauty-${Date.now()}`, name: "", creator: "", video: "", thumbnail: "", rank: beautyLevels.length + 1
              })} 
              className="px-4 py-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded-lg text-sm font-bold uppercase"
            >
              + Add Beauty Level
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4 w-20 text-center">Rank</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Creator</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {beautyLevels.map(lvl => (
                  <tr key={lvl.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-center font-mono text-[#d8d0b6] font-bold text-lg">{lvl.rank}</td>
                    <td className="p-4 font-bold">{lvl.name}</td>
                    <td className="p-4 text-white/60">{lvl.creator}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setIsEditingBeauty({...lvl})} className="text-[#cfbe94] hover:underline mr-4">Edit</button>
                      <button onClick={() => handleDeleteBeauty(lvl.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {beautyLevels.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-white/40">No beauty levels found.</td>
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
                      <button onClick={() => setIsEditingVerifier({...verifier})} className="text-[#cfbe94] hover:underline mr-4">Edit</button>
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
                    <td className="p-4 font-bold hover:text-[#cfbe94]">
                      <Link to={`/player/${encodeURIComponent(submission.username)}`} target="_blank">
                        {submission.username}
                      </Link>
                    </td>
                    <td className="p-4 hover:text-[#cfbe94] font-medium">
                      {(() => {
                        const lvl = levels.find(l => l.name.toLowerCase() === submission.levelName.toLowerCase());
                        return lvl ? (
                          <Link to={`/level/${lvl.id}`} target="_blank">{submission.levelName}</Link>
                        ) : (
                          submission.levelName
                        );
                      })()}
                    </td>
                    <td className="p-4 text-[#cfbe94] font-medium">{submission.progress}%</td>
                    <td className="p-4 text-white/60 capitalize">{submission.status}</td>
                    <td className="p-4"><a href={submission.videoProof} target="_blank" rel="noopener noreferrer" className="text-[#cfbe94] hover:underline">Link</a></td>
                    <td className="p-4 text-right">
                      {submission.status === "pending" && (
                        <>
                          <button onClick={() => handleAcceptSubmission(submission.id)} className="text-emerald-400 hover:underline mr-4">Accept</button>
                          <button onClick={() => handleRejectSubmission(submission.id)} className="text-[#cfbe94] hover:underline mr-4">Reject</button>
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

      {activeTab === "users" && (isElderModer || isAdmin) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div>
              <h2 className="text-2xl font-bold font-heading">User Roles & Profiles</h2>
              <p className="text-white/50 text-xs mt-1">Manage user roles dynamically. Changes take effect instantly across the application.</p>
            </div>
            <input 
              type="text" 
              placeholder="Search by username..." 
              value={usersSearch} 
              onChange={(e) => setUsersSearch(e.target.value)} 
              className="bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white w-full sm:w-64 focus:outline-none focus:border-[#d8d0b6]/50"
            />
          </div>
          {loadingProfiles ? (
            <div className="text-center py-8 text-white/50">Loading profiles...</div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40">
                    <th className="p-4">Profile ID</th>
                    <th className="p-4">User Details</th>
                    <th className="p-4">GD Username / Country</th>
                    <th className="p-4">Claimed By</th>
                    <th className="p-4">Current Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles
                    .filter(p => !usersSearch || p.id.toLowerCase().includes(usersSearch.toLowerCase()) || (p.username || "").toLowerCase().includes(usersSearch.toLowerCase()))
                    .map(profile => (
                      <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold font-mono text-[#d8d0b6]">{profile.id}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{profile.username || profile.id}</div>
                          <div className="text-xs text-white/40">{profile.description || "No description"}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-zinc-300 font-mono text-xs">{profile.gdUsername || "N/A"}</div>
                          <div className="text-xs text-emerald-400 font-bold">{profile.country || "RU"}</div>
                        </td>
                        <td className="p-4 text-xs text-white/60 font-mono">
                          {profile.claimed ? (
                            <>
                              <span className="text-emerald-400 font-bold">Claimed:</span>
                              <div className="text-[10px] text-white/40 mt-0.5">{profile.claimedBy}</div>
                            </>
                          ) : (
                            <span className="text-white/30">Unclaimed</span>
                          )}
                        </td>
                        <td className="p-4 flex items-center gap-2">
                          <select
                            value={profile.role || "user"}
                            onChange={(e) => handleUpdateRole(profile.id, e.target.value)}
                            disabled={
                              profile.id === 'infinity_starmaizik' || 
                              profile.id === 'infinify_starmaizik' ||
                              (userRole === 'elder_moder' && ['admin', 'elder_moder'].includes(profile.role || 'user')) ||
                              (profile.id.toLowerCase() === user?.email?.split('@')[0].toLowerCase())
                            }
                            className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white cursor-pointer focus:border-[#d8d0b6] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            {(isAdmin || profile.role === 'elder_moder') && <option value="elder_moder">Elder Moder</option>}
                            {(isAdmin || profile.role === 'admin') && <option value="admin">Admin</option>}
                          </select>
                          {isAdmin && profile.id !== 'infinity_starmaizik' && profile.id !== 'infinify_starmaizik' && (
                            <button onClick={() => handleDeleteProfile(profile.id)} className="text-red-500 hover:text-red-400 p-2" title="Delete Profile Table Entry">✕</button>
                          )}
                        </td>
                      </tr>
                  ))}
                  {profiles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/40">No user profiles matched.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "logs" && (isElderModer || isAdmin) && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-2xl font-bold font-heading">Moderation Action Logs</h2>
              <p className="text-white/50 text-xs mt-1">Audit log of all actions taken by list coordinators and moderators.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={loadLogs} 
                className="px-4 py-2 bg-[#d8d0b6]/20 text-[#d8d0b6] hover:bg-[#d8d0b6]/30 border border-[#d8d0b6]/35 text-xs font-bold rounded-lg uppercase tracking-wide transition-colors"
              >
                Refresh Logs
              </button>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4 w-48">Timestamp</th>
                  <th className="p-4 w-48">Moderator</th>
                  <th className="p-4 w-40">Action</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logsList.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-zinc-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs font-semibold">
                      <div className="text-[#d8d0b6] font-mono">@{log.moderatorUsername}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{log.moderatorEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        (log.action || '').includes('approve') || (log.action || '').includes('accept') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        (log.action || '').includes('reject') ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                        (log.action || '').includes('role') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        'bg-zinc-500/10 text-zinc-300 border border-zinc-500/20'
                      }`}>
                        {log.action || 'unknown'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-white/80 max-w-sm whitespace-normal break-words leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))}
                {logsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-white/40">No moderator logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                      <button onClick={() => setIsEditingChangelog({...log})} className="text-[#cfbe94] hover:underline mr-4">Edit</button>
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
                 <label className="block text-xs uppercase text-white/50 mb-1">Geometry Dash ID</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.geometryDashId || ""} onChange={(e) => setIsEditingLevel({...isEditingLevel, geometryDashId: e.target.value})} placeholder="e.g. 12345678" required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Rank</label>
                 <input type="number" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.rank} onChange={(e) => {
                    const newRank = Number(e.target.value);
                    setIsEditingLevel({
                      ...isEditingLevel,
                      rank: newRank,
                      points: calculatePointsForRank(newRank)
                    });
                 }} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Points</label>
                 <input type="number" step="any" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.points} onChange={(e) => setIsEditingLevel({...isEditingLevel, points: Number(e.target.value)})} required />
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
                 <label className="block text-xs uppercase text-white/50 mb-1">Victors</label>
                 <input type="number" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.victors} onChange={(e) => setIsEditingLevel({...isEditingLevel, victors: parseInt(e.target.value, 10)})} required />
              </div>
              <div className="col-span-2">
                 <label className="block text-xs uppercase text-white/50 mb-1">Video URL / #</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingLevel.video} onChange={(e) => setIsEditingLevel({...isEditingLevel, video: e.target.value})} required />
              </div>
              <div className="col-span-2 space-y-3">
                 <label className="block text-xs uppercase text-white/50">Level Preview (Thumbnail)</label>
                 
                 {/* Drag and Drop Zone */}
                 <div 
                   onDragOver={(e) => {
                     e.preventDefault();
                     setDragActive(true);
                   }}
                   onDragLeave={(e) => {
                     e.preventDefault();
                     setDragActive(false);
                   }}
                   onDrop={(e) => {
                     e.preventDefault();
                     setDragActive(false);
                     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                       handleImageFile(e.dataTransfer.files[0]);
                     }
                   }}
                   className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer ${
                     dragActive 
                       ? "border-[#d8d0b6] bg-[#d8d0b6]/10 scale-[1.02]" 
                       : "border-white/10 hover:border-white/25 hover:bg-white/5 bg-black/40"
                   }`}
                   onClick={() => document.getElementById("thumbnail-file-input")?.click()}
                 >
                   <input 
                     type="file" 
                     id="thumbnail-file-input" 
                     className="hidden" 
                     accept="image/*" 
                     onChange={(e) => {
                       if (e.target.files && e.target.files[0]) {
                         handleImageFile(e.target.files[0]);
                       }
                     }} 
                   />
                   
                   {isProcessingImage ? (
                     <div className="flex flex-col items-center gap-2">
                       <div className="w-6 h-6 border-2 border-[#d8d0b6] border-t-transparent rounded-full animate-spin" />
                       <span className="text-xs text-[#d8d0b6] font-semibold uppercase tracking-wide">Compressing...</span>
                     </div>
                   ) : isEditingLevel.thumbnail ? (
                     <div className="space-y-3 w-full">
                       <div className="relative w-full max-w-[240px] h-[135px] mx-auto rounded-lg overflow-hidden border border-white/20">
                         <img 
                           src={isEditingLevel.thumbnail} 
                           alt="Thumbnail preview" 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                         />
                         <button 
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             setIsEditingLevel({ ...isEditingLevel, thumbnail: "" });
                           }}
                           className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors"
                           title="Remove preview"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       <p className="text-[10px] text-white/50 tracking-wide font-mono">Image attached. Drag another file or click to replace.</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2">
                       <div className="p-3 bg-[#d8d0b6]/10 text-[#d8d0b6] rounded-full border border-[#d8d0b6]/20 transition-transform">
                         <Upload className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-xs font-semibold text-white/80">Drag & drop preview image here</p>
                         <p className="text-[10px] text-white/40 mt-1">or click to browse from files</p>
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Keep alternative URL paste as secondary choice */}
                 <div className="flex items-center gap-2 py-1">
                   <div className="h-px bg-white/10 flex-1" />
                   <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">or paste direct image URL</span>
                   <div className="h-px bg-white/10 flex-1" />
                 </div>

                 <input 
                   type="text"
                   className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                   value={isEditingLevel.thumbnail || ""} 
                   onChange={(e) => setIsEditingLevel({...isEditingLevel, thumbnail: e.target.value})} 
                   placeholder="Enter direct URL (e.g. YouTube thumbnail link)" 
                 />
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-2">
                 <input type="checkbox" id="isActive" checked={isEditingLevel.isActive} onChange={(e) => setIsEditingLevel({...isEditingLevel, isActive: e.target.checked})} />
                 <label htmlFor="isActive" className="text-sm">Is Active (accounts for leaderboards)</label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingLevel(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Save</button>
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
              <button type="submit" className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Save</button>
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
              <div className="space-y-3">
                 <label className="block text-xs uppercase text-white/50">Level Preview (Thumbnail)</label>
                 
                 {/* Drag and Drop Zone */}
                 <div 
                   onDragOver={(e) => {
                     e.preventDefault();
                     setDragActive(true);
                   }}
                   onDragLeave={(e) => {
                     e.preventDefault();
                     setDragActive(false);
                   }}
                   onDrop={(e) => {
                     e.preventDefault();
                     setDragActive(false);
                     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                       handleImageFile(e.dataTransfer.files[0], "future");
                     }
                   }}
                   className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer ${
                     dragActive 
                       ? "border-[#d8d0b6] bg-[#d8d0b6]/10 scale-[1.02]" 
                       : "border-white/10 hover:border-white/25 hover:bg-white/5 bg-black/40"
                   }`}
                   onClick={() => document.getElementById("future-thumbnail-file-input")?.click()}
                 >
                   <input 
                     type="file" 
                     id="future-thumbnail-file-input" 
                     className="hidden" 
                     accept="image/*" 
                     onChange={(e) => {
                       if (e.target.files && e.target.files[0]) {
                         handleImageFile(e.target.files[0], "future");
                       }
                     }} 
                   />
                   
                   {isProcessingImage ? (
                     <div className="flex flex-col items-center gap-2">
                       <div className="w-6 h-6 border-2 border-[#d8d0b6] border-t-transparent rounded-full animate-spin" />
                       <span className="text-xs text-[#d8d0b6] font-semibold uppercase tracking-wide">Compressing...</span>
                     </div>
                   ) : isEditingFuture.thumbnail ? (
                     <div className="space-y-3 w-full">
                       <div className="relative w-full max-w-[240px] h-[135px] mx-auto rounded-lg overflow-hidden border border-white/20">
                         <img 
                           src={isEditingFuture.thumbnail} 
                           alt="Thumbnail preview" 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                         />
                         <button 
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             setIsEditingFuture({ ...isEditingFuture, thumbnail: "" });
                           }}
                           className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors"
                           title="Remove preview"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       <p className="text-[10px] text-white/50 tracking-wide font-mono">Image attached. Drag another file or click to replace.</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2">
                       <div className="p-3 bg-[#d8d0b6]/10 text-[#d8d0b6] rounded-full border border-[#d8d0b6]/20 transition-transform">
                         <Upload className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-xs font-semibold text-white/80">Drag & drop preview image here</p>
                         <p className="text-[10px] text-white/40 mt-1">or click to browse from files</p>
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Keep alternative URL paste as secondary choice */}
                 <div className="flex items-center gap-2 py-1">
                   <div className="h-px bg-white/10 flex-1" />
                   <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">or paste direct image URL</span>
                   <div className="h-px bg-white/10 flex-1" />
                 </div>

                 <input 
                   type="text"
                   className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                   value={isEditingFuture.thumbnail || ""} 
                   onChange={(e) => setIsEditingFuture({...isEditingFuture, thumbnail: e.target.value})} 
                   placeholder="Enter direct URL (e.g. YouTube thumbnail link)" 
                 />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingFuture(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Save</button>
            </div>
          </form>
        </div>
      )}

      {isEditingBeauty && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={saveBeautyLevel} className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{beautyLevels.find(f => f.id === isEditingBeauty.id) ? "Edit Beauty Level" : "New Beauty Level"}</h2>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Rank</label>
                 <input type="number" className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingBeauty.rank} onChange={(e) => setIsEditingBeauty({...isEditingBeauty, rank: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Name</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingBeauty.name} onChange={(e) => setIsEditingBeauty({...isEditingBeauty, name: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Creator</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingBeauty.creator} onChange={(e) => setIsEditingBeauty({...isEditingBeauty, creator: e.target.value})} required />
              </div>
              <div>
                 <label className="block text-xs uppercase text-white/50 mb-1">Video Link</label>
                 <input className="w-full bg-black border border-white/10 rounded p-2 text-white" value={isEditingBeauty.video} onChange={(e) => setIsEditingBeauty({...isEditingBeauty, video: e.target.value})} />
              </div>
              
              <div className="space-y-3">
                 <label className="block text-xs uppercase text-white/50">Level Preview (Thumbnail)</label>
                 
                 {/* Drag and Drop Zone */}
                 <div 
                   onDragOver={(e) => {
                     e.preventDefault();
                     setDragActive(true);
                   }}
                   onDragLeave={(e) => {
                     e.preventDefault();
                     setDragActive(false);
                   }}
                   onDrop={(e) => {
                     e.preventDefault();
                     setDragActive(false);
                     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                       handleImageFile(e.dataTransfer.files[0], "beauty");
                     }
                   }}
                   className={`border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer ${
                     dragActive 
                       ? "border-[#d8d0b6] bg-[#d8d0b6]/10 scale-[1.02]" 
                       : "border-white/10 hover:border-white/25 hover:bg-white/5 bg-black/40"
                   }`}
                   onClick={() => document.getElementById("beauty-thumbnail-file-input")?.click()}
                 >
                   <input 
                     type="file" 
                     id="beauty-thumbnail-file-input" 
                     className="hidden" 
                     accept="image/*" 
                     onChange={(e) => {
                       if (e.target.files && e.target.files[0]) {
                         handleImageFile(e.target.files[0], "beauty");
                       }
                     }} 
                   />
                   
                   {isProcessingImage ? (
                     <div className="flex flex-col items-center gap-2">
                       <div className="w-6 h-6 border-2 border-[#d8d0b6] border-t-transparent rounded-full animate-spin" />
                       <span className="text-xs text-[#d8d0b6] font-semibold uppercase tracking-wide">Compressing...</span>
                     </div>
                   ) : isEditingBeauty.thumbnail ? (
                     <div className="space-y-3 w-full">
                       <div className="relative w-full max-w-[240px] h-[135px] mx-auto rounded-lg overflow-hidden border border-white/20">
                         <img 
                           src={isEditingBeauty.thumbnail} 
                           alt="Thumbnail preview" 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                         />
                         <button 
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             setIsEditingBeauty({ ...isEditingBeauty, thumbnail: "" });
                           }}
                           className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-red-600 text-white rounded-full transition-colors"
                           title="Remove preview"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>
                       </div>
                       <p className="text-[10px] text-white/50 tracking-wide font-mono">Image attached. Drag another file or click to replace.</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2">
                       <div className="p-3 bg-[#d8d0b6]/10 text-[#d8d0b6] rounded-full border border-[#d8d0b6]/20 transition-transform">
                         <Upload className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-xs font-semibold text-white/80">Drag & drop preview image here</p>
                         <p className="text-[10px] text-white/40 mt-1">or click to browse from files</p>
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Keep alternative URL paste as secondary choice */}
                 <div className="flex items-center gap-2 py-1">
                   <div className="h-px bg-white/10 flex-1" />
                   <span className="text-[10px] uppercase text-white/30 font-semibold tracking-wider">or paste direct image URL</span>
                   <div className="h-px bg-white/10 flex-1" />
                 </div>

                 <input 
                   type="text"
                   className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs text-white" 
                   value={isEditingBeauty.thumbnail || ""} 
                   onChange={(e) => setIsEditingBeauty({...isEditingBeauty, thumbnail: e.target.value})} 
                   placeholder="Enter direct URL (e.g. YouTube thumbnail link)" 
                 />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsEditingBeauty(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Save</button>
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
              <button type="submit" className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Save</button>
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

      {beautyToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this beauty level?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setBeautyToDelete(null)} className="px-4 py-2 rounded text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmDeleteBeauty} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white">Delete</button>
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
              <button onClick={handleImportText} className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Import</button>
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
              <button onClick={handleImportFutureText} className="px-4 py-2 bg-[#bfae7d] hover:bg-[#d8d0b6] rounded font-bold text-white">Import</button>
            </div>
          </div>
        </div>
      )}

      {isSheetsModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-2 font-heading text-[#cfbe94]">Sync Levels from Google Sheets (CSV)</h2>
            <p className="text-sm text-white/60 mb-4">
              Publish your Google Sheet to the web as a CSV (**File &gt; Share &gt; Publish to web &gt; Comma-separated values (.csv)**), then paste the generated URL below:
            </p>
            <input 
              type="text"
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:outline-none focus:border-amber-300 font-mono"
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
                className="px-4 py-2 bg-gradient-to-r from-[#d2c89e] to-[#d8d0b6] hover:-translate-y-0.5 rounded-xl font-bold text-white text-sm shadow-lg shadow-[#cfbe94]/15 transition-all disabled:opacity-50"
                disabled={isSyncingSheets}
              >
                {isSyncingSheets ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {profileToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4 text-red-500">Delete Profile</h2>
            <p className="mb-6 text-sm text-white/70">Are you sure you want to permanently delete profile <strong className="text-white">"{profileToDelete}"</strong>? <br/><br/>This deletes the database record, but not their Firebase Auth login.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setProfileToDelete(null)} className="px-4 py-2 rounded-xl text-white/60 hover:text-white transition-colors text-sm font-bold">Cancel</button>
              <button onClick={confirmDeleteProfile} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-colors text-sm shadow-lg shadow-red-600/20">Delete</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && isAdmin && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 font-heading">{t("admin.tabs.settings", "Настройки")}</h2>
          <div className="mb-6">
            <label className="block text-sm font-bold text-white/60 mb-2">URL логотипа сайта (Site Logo URL)</label>
            <input 
              type="text" 
              value={logoInput} 
              onChange={e => setLogoInput(e.target.value)} 
              placeholder="https://example.com/logo.png"
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[#d8d0b6] outline-none"
            />
            <p className="text-sm text-white/40 mt-2">Оставьте пустым, чтобы использовать текстовый логотип.</p>
            <div className="mt-2">
               <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                 <Upload className="w-4 h-4" />
                 Загрузить картинку (до 700KB)
                 <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
               </label>
            </div>
            {logoInput && (
              <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-xl">
                <p className="text-xs text-white/50 mb-2">Превью:</p>
                <img src={logoInput} alt="Preview" className="h-12 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} onLoad={(e) => (e.currentTarget.style.display = 'block')} />
              </div>
            )}
          </div>
          <button 
            onClick={handleSaveSettings} 
            disabled={isSavingSettings}
            className="px-6 py-3 bg-[#d8d0b6] text-black font-bold rounded-xl hover:bg-[#cfbe94] transition-colors disabled:opacity-50"
          >
            {isSavingSettings ? "Сохранение..." : "Сохранить настройки"}
          </button>
        </div>
      )}

      {submissionWithComment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto w-full h-full">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-2 font-heading text-[#d8d0b6]">
              {submissionWithComment.action === "accept" ? "Accept Record Submission" : submissionWithComment.action === "reject" ? "Reject Record Submission" : "Delete Record Submission"}
            </h2>
            <div className="space-y-2 mb-4 bg-black/40 p-3 rounded-lg border border-white/5 text-xs text-white/70">
              <p><strong>Player:</strong> {submissionWithComment.submission.username}</p>
              <p><strong>Level Name:</strong> {submissionWithComment.submission.levelName}</p>
              <p><strong>Progress:</strong> {submissionWithComment.submission.progress}%</p>
              <p><strong>Video Proof:</strong> <a href={submissionWithComment.submission.videoProof} target="_blank" rel="noopener noreferrer" className="text-[#cfbe94] underline hover:text-orange-200">Open Link</a></p>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs uppercase text-white/50 mb-1">
                {submissionWithComment.action === "accept" ? "Optional Comment for Player" : submissionWithComment.action === "reject" ? "Reason for Rejection (Highly Recommended)" : "Reason for Deletion (Optional)"}
              </label>
              <textarea
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d8d0b6] h-24"
                value={moderatorComment}
                onChange={e => setModeratorComment(e.target.value)}
                placeholder={submissionWithComment.action === "accept" ? "e.g. GG! Incredible run!" : submissionWithComment.action === "reject" ? "e.g. Video proof is missing the raw attempt/clicks, or incorrect details." : "e.g. Spam submission."}
                required={submissionWithComment.action === "reject"}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setSubmissionWithComment(null);
                  setModeratorComment("");
                }}
                className="px-4 py-2 rounded-xl text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSubmissionAction}
                disabled={submissionWithComment.action === "reject" && !moderatorComment.trim()}
                className={`px-4 py-2 rounded-xl font-bold text-white text-sm transition-all ${
                  submissionWithComment.action === "accept" 
                    ? "bg-emerald-600 hover:bg-emerald-500" 
                    : submissionWithComment.action === "reject"
                    ? "bg-[#bfae7d] hover:bg-[#d8d0b6] disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
