import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword,
  updateEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  username: string;
}

export interface LoginUpdateResult {
  success: boolean;
  verificationSent?: boolean;
  firebaseAuthUpdateBlocked?: boolean;
  newEmail: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isElderModer: boolean;
  isModerator: boolean;
  role: string;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserLogin: (currentPassword: string, newLoginInput: string) => Promise<LoginUpdateResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string>('user');
  const [isElderModer, setIsElderModer] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkIsAdmin = (email: string | null) => {
    if (!email) return false;
    const normalizedEmail = email.trim().toLowerCase();
    
    return normalizedEmail.startsWith('infinity_starmaizik') || 
           normalizedEmail.startsWith('infinify_starmaizik') || 
           normalizedEmail === 'markleonov2010@gmail.com';
  };

  const fetchAndSetUserRole = async (email: string | null) => {
    if (!email) {
      setRole('user');
      setIsElderModer(false);
      setIsModerator(false);
      return;
    }
    const username = email.split('@')[0];
    const normalizedUsername = username.trim().toLowerCase();
    
    let userRole = 'user';
    const isStaticAdmin = checkIsAdmin(email);
    if (normalizedUsername === 'infinity_starmaizik' || normalizedUsername === 'infinify_starmaizik') {
      userRole = 'admin';
    } else if (isStaticAdmin) {
      userRole = 'admin';
    } else {
      try {
        const docSnap = await getDoc(doc(db, "user_profiles", normalizedUsername));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role) {
            userRole = data.role;
          }
        }
      } catch (err) {
        console.error("Failed to load user profile role:", err);
      }
    }
    
    setRole(userRole);
    setIsElderModer(userRole === 'elder_moder' || userRole === 'admin' || isStaticAdmin);
    setIsModerator(userRole === 'moderator' || userRole === 'elder_moder' || userRole === 'admin' || isStaticAdmin);
  };

  const getActiveUserProfile = async (uid?: string, email?: string | null, currentUsername?: string) => {
    try {
      if (uid) {
        const q = query(collection(db, "user_profiles"), where("uid", "==", uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: d.id, data: d.data() };
        }
      }
      if (email) {
        const q = query(collection(db, "user_profiles"), where("claimedBy", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: d.id, data: d.data() };
        }
      }
      const un = currentUsername || (email ? email.split('@')[0] : "");
      if (un) {
        const norm = un.trim().toLowerCase();
        const docSnap = await getDoc(doc(db, "user_profiles", norm));
        if (docSnap.exists()) {
          return { id: docSnap.id, data: docSnap.data() };
        }
      }
    } catch (err) {
      console.error("Error in getActiveUserProfile:", err);
    }
    return null;
  };

  const fetchUserProfileUsername = async (firebaseUser: FirebaseUser): Promise<string> => {
    const fallbackUsername = firebaseUser.email ? firebaseUser.email.split('@')[0] : "User";
    const profile = await getActiveUserProfile(firebaseUser.uid, firebaseUser.email);
    if (profile && profile.data && profile.data.username) {
      return profile.data.username;
    }
    return fallbackUsername;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const username = await fetchUserProfileUsername(firebaseUser);
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, username });
        setIsAdmin(checkIsAdmin(firebaseUser.email));
        await fetchAndSetUserRole(firebaseUser.email);
      } else {
        setUser(null);
        setIsAdmin(false);
        setRole('user');
        setIsElderModer(false);
        setIsModerator(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    throw new Error('Google login disabled. Please use email and password.');
  };

  const loginWithEmail = async (loginInput: string, pass: string) => {
    const trimmedInput = loginInput.trim();
    let emailToTry = trimmedInput.includes('@') ? trimmedInput : `${trimmedInput}@obsidian.local`;

    const normalizedInput = (trimmedInput.includes('@') ? trimmedInput.split('@')[0] : trimmedInput).toLowerCase();
    
    try {
      // Direct doc check
      const directDoc = await getDoc(doc(db, "user_profiles", normalizedInput));
      if (directDoc.exists() && directDoc.data().claimedBy) {
        emailToTry = directDoc.data().claimedBy;
      } else {
        // Query by username or claimedBy
        const qUser = query(collection(db, "user_profiles"), where("username", "==", trimmedInput));
        const snapUser = await getDocs(qUser);
        if (!snapUser.empty && snapUser.docs[0].data().claimedBy) {
          emailToTry = snapUser.docs[0].data().claimedBy;
        }
      }
    } catch (e) {
      console.error("Error looking up profile before login:", e);
    }

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, emailToTry, pass);
    } catch (err: any) {
      const fallbackEmail = trimmedInput.includes('@') ? trimmedInput : `${trimmedInput}@obsidian.local`;
      if (emailToTry !== fallbackEmail) {
        try {
          userCredential = await signInWithEmailAndPassword(auth, fallbackEmail, pass);
        } catch (fallbackErr) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const loggedUser = userCredential.user;
    const username = await fetchUserProfileUsername(loggedUser);
    const uObj = { uid: loggedUser.uid, email: loggedUser.email, username };
    setUser(uObj);
    setIsAdmin(checkIsAdmin(loggedUser.email));
    await fetchAndSetUserRole(loggedUser.email);
    
    return uObj;
  };
  
  const registerWithEmail = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;
    
    const username = await fetchUserProfileUsername(newUser);
    const uObj = { uid: newUser.uid, email: newUser.email, username };
    setUser(uObj);
    setIsAdmin(checkIsAdmin(newUser.email));
    await fetchAndSetUserRole(newUser.email);
    
    return uObj;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setRole('user');
    setIsElderModer(false);
    setIsModerator(false);
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Not authenticated');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };

  const updateUserLogin = async (currentPassword: string, newLoginInput: string): Promise<LoginUpdateResult> => {
    if (!auth.currentUser) {
      throw new Error('Not authenticated');
    }
    const trimmed = newLoginInput.trim();
    if (!trimmed) {
      throw new Error('Login cannot be empty');
    }

    const newEmail = trimmed.includes('@') ? trimmed : `${trimmed}@obsidian.local`;
    const newUsername = newEmail.split('@')[0];
    const normalizedNewUsername = newUsername.trim().toLowerCase();

    const activeProfile = await getActiveUserProfile(auth.currentUser.uid, auth.currentUser.email, user?.username);
    const oldDocId = activeProfile ? activeProfile.id : (auth.currentUser.email ? auth.currentUser.email.split('@')[0].toLowerCase() : "");
    const oldProfileData = activeProfile ? activeProfile.data : {};
    
    const currentUsername = oldProfileData.username || user?.username || (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : "");
    const normalizedCurrentUsername = currentUsername.trim().toLowerCase();

    if (normalizedNewUsername === normalizedCurrentUsername) {
      throw new Error('New login is identical to current login');
    }

    // Check if target username is already taken by ANOTHER user
    const targetDocSnap = await getDoc(doc(db, "user_profiles", normalizedNewUsername));
    if (targetDocSnap.exists()) {
      const data = targetDocSnap.data();
      if (data.claimed && data.uid && data.uid !== auth.currentUser.uid) {
        throw new Error('This username or login is already taken');
      }
    }

    const currentAuthEmail = auth.currentUser.email || oldProfileData.claimedBy || `${oldDocId}@obsidian.local`;
    if (currentAuthEmail) {
      try {
        const credential = EmailAuthProvider.credential(currentAuthEmail, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } catch (authErr: any) {
        // If reauthentication with currentAuthEmail failed, try oldProfileData.claimedBy if different
        if (oldProfileData.claimedBy && oldProfileData.claimedBy !== currentAuthEmail) {
          const credential = EmailAuthProvider.credential(oldProfileData.claimedBy, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        } else {
          throw authErr;
        }
      }
    }

    let verificationSent = false;
    let firebaseAuthUpdateBlocked = false;

    try {
      await updateEmail(auth.currentUser, newEmail);
    } catch (err: any) {
      console.warn("Firebase Auth updateEmail warning:", err.code, err.message);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/email-change-needs-verification') {
        try {
          await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
          verificationSent = true;
        } catch (vErr: any) {
          firebaseAuthUpdateBlocked = true;
        }
      } else {
        firebaseAuthUpdateBlocked = true;
      }
    }

    const updatedClaimedBy = (!verificationSent && !firebaseAuthUpdateBlocked && auth.currentUser.email) 
      ? auth.currentUser.email 
      : (oldProfileData.claimedBy || currentAuthEmail || newEmail);

    // Save new doc in user_profiles
    await setDoc(doc(db, "user_profiles", normalizedNewUsername), {
      ...oldProfileData,
      claimed: true,
      claimedBy: updatedClaimedBy,
      uid: auth.currentUser.uid,
      username: newUsername,
      claimedAt: oldProfileData.claimedAt || new Date().toISOString()
    }, { merge: true });

    // Delete old doc from user_profiles if doc ID changed
    if (oldDocId && oldDocId !== normalizedNewUsername) {
      try {
        await deleteDoc(doc(db, "user_profiles", oldDocId));
      } catch (e) {
        console.error("Failed to delete old profile doc:", e);
      }
    }

    // Clean up any stale doc in user_profiles where uid == auth.currentUser.uid and doc.id != normalizedNewUsername
    try {
      const qStale = query(collection(db, "user_profiles"), where("uid", "==", auth.currentUser.uid));
      const snapStale = await getDocs(qStale);
      for (const staleDoc of snapStale.docs) {
        if (staleDoc.id !== normalizedNewUsername) {
          await deleteDoc(doc(db, "user_profiles", staleDoc.id));
        }
      }
    } catch (e) {
      console.error("Failed to clean up stale profile docs:", e);
    }

    // Update all collections across the site to reflect the new username and email
    const oldNamesToMatch = new Set<string>();
    if (currentUsername) oldNamesToMatch.add(currentUsername.trim().toLowerCase());
    if (normalizedCurrentUsername) oldNamesToMatch.add(normalizedCurrentUsername);
    if (oldDocId) oldNamesToMatch.add(oldDocId.trim().toLowerCase());
    if (auth.currentUser.email) oldNamesToMatch.add(auth.currentUser.email.split('@')[0].trim().toLowerCase());

    const isMatch = (val: any) => typeof val === 'string' && oldNamesToMatch.has(val.trim().toLowerCase());

    try {
      const currentUid = auth.currentUser.uid;

      // 1. record_submissions
      const subsSnap = await getDocs(collection(db, "record_submissions"));
      for (const subDoc of subsSnap.docs) {
        const sData = subDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (sData.userId === currentUid || isMatch(sData.username) || isMatch(sData.submittedBy)) {
          updates.username = newUsername;
          updates.userEmail = newEmail;
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "record_submissions", subDoc.id), updates);
        }
      }

      // 2. levels (verifier, creator, publisher, creators array)
      const levelsSnap = await getDocs(collection(db, "levels"));
      for (const levelDoc of levelsSnap.docs) {
        const lData = levelDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (isMatch(lData.verifier)) {
          updates.verifier = newUsername;
          updated = true;
        }
        if (isMatch(lData.creator)) {
          updates.creator = newUsername;
          updated = true;
        }
        if (isMatch(lData.publisher)) {
          updates.publisher = newUsername;
          updated = true;
        }
        if (Array.isArray(lData.creators) && lData.creators.some((c: string) => isMatch(c))) {
          updates.creators = lData.creators.map((c: string) => isMatch(c) ? newUsername : c);
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "levels", levelDoc.id), updates);
        }
      }

      // 3. verifiers
      const verifiersSnap = await getDocs(collection(db, "verifiers"));
      for (const vDoc of verifiersSnap.docs) {
        const vData = vDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (isMatch(vData.name)) {
          updates.name = newUsername;
          updated = true;
        }
        if (isMatch(vData.username)) {
          updates.username = newUsername;
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "verifiers", vDoc.id), updates);
        }
      }

      // 4. beauty_levels
      const beautySnap = await getDocs(collection(db, "beauty_levels"));
      for (const bDoc of beautySnap.docs) {
        const bData = bDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (isMatch(bData.creator)) {
          updates.creator = newUsername;
          updated = true;
        }
        if (isMatch(bData.verifier)) {
          updates.verifier = newUsername;
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "beauty_levels", bDoc.id), updates);
        }
      }

      // 5. future_levels
      const futureSnap = await getDocs(collection(db, "future_levels"));
      for (const fDoc of futureSnap.docs) {
        const fData = fDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (isMatch(fData.creator)) {
          updates.creator = newUsername;
          updated = true;
        }
        if (isMatch(fData.verifier)) {
          updates.verifier = newUsername;
          updated = true;
        }
        if (isMatch(fData.publisher)) {
          updates.publisher = newUsername;
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "future_levels", fDoc.id), updates);
        }
      }

      // 6. notifications
      const notifSnap = await getDocs(collection(db, "notifications"));
      for (const nDoc of notifSnap.docs) {
        const nData = nDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (nData.userId === currentUid) {
          updates.userEmail = newEmail;
          updated = true;
        }
        if (isMatch(nData.username)) {
          updates.username = newUsername;
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "notifications", nDoc.id), updates);
        }
      }

      // 7. moderator_logs
      const logsSnap = await getDocs(collection(db, "moderator_logs"));
      for (const lDoc of logsSnap.docs) {
        const lData = lDoc.data();
        let updated = false;
        const updates: Record<string, any> = {};

        if (isMatch(lData.moderatorUsername)) {
          updates.moderatorUsername = newUsername;
          updated = true;
        }

        if (updated) {
          await updateDoc(doc(db, "moderator_logs", lDoc.id), updates);
        }
      }

      // 8. Clear server cache
      const envUrl = import.meta.env.VITE_API_URL || "";
      const isLocalOrCloudRun = typeof window !== "undefined" && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
      const API_BASE_URL = (envUrl.includes("onrender.com") || isLocalOrCloudRun) ? "" : envUrl;
      fetch(`${API_BASE_URL}/api/clear-cache`, { method: 'POST' }).catch(() => {});

    } catch (e) {
      console.error("Failed to update site-wide references for new username:", e);
    }

    const targetEmail = (!verificationSent && !firebaseAuthUpdateBlocked && auth.currentUser.email) ? auth.currentUser.email : (updatedClaimedBy || newEmail);
    setUser({ uid: auth.currentUser.uid, email: targetEmail, username: newUsername });
    setIsAdmin(checkIsAdmin(targetEmail));
    await fetchAndSetUserRole(targetEmail);

    return {
      success: true,
      verificationSent,
      firebaseAuthUpdateBlocked,
      newEmail
    };
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isAdmin, isElderModer, isModerator, role, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateUserPassword, updateUserLogin } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



