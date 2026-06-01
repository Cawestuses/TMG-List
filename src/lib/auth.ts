import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

export interface User {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
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
  const [loading, setLoading] = useState(true);

  const checkIsAdmin = (email: string | null) => {
    if (!email) return false;
    const expectedAdminEmail = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const alternateAdminEmail = 'Infinity_starmaizik@obsidian.local';
    const alternateAdminEmail2 = 'admin@obsidian.local';
    const alternateAdminEmail3 = 'markleonov2010@gmail.com';
    
    return email === expectedAdminEmail || 
           email === `${expectedAdminEmail}@obsidian.local` || 
           email === alternateAdminEmail || 
           email === alternateAdminEmail2 ||
           email === alternateAdminEmail3;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        setIsAdmin(checkIsAdmin(firebaseUser.email));
      } else {
        setUser(null);
        setIsAdmin(false);
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
    
    return { uid: loggedUser.uid, email: loggedUser.email };
  };
  
  const registerWithEmail = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;
    
    setUser({ uid: newUser.uid, email: newUser.email });
    setIsAdmin(checkIsAdmin(newUser.email));
    
    return { uid: newUser.uid, email: newUser.email };
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isAdmin, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout } },
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



