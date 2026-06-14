import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
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

  const loginWithEmail = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const loggedUser = userCredential.user;
    
    setUser({ uid: loggedUser.uid, email: loggedUser.email });
    setIsAdmin(checkIsAdmin(loggedUser.email));
    await fetchAndSetUserRole(loggedUser.email);
    
    return { uid: loggedUser.uid, email: loggedUser.email };
  };
  
  const registerWithEmail = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;
    
    setUser({ uid: newUser.uid, email: newUser.email });
    setIsAdmin(checkIsAdmin(newUser.email));
    await fetchAndSetUserRole(newUser.email);
    
    return { uid: newUser.uid, email: newUser.email };
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setRole('user');
    setIsElderModer(false);
    setIsModerator(false);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isAdmin, isElderModer, isModerator, role, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout } },
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



