import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

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

  useEffect(() => {
    // Check local storage for session
    const checkSession = async () => {
      const savedEmail = localStorage.getItem('obsidian_user_email');
      if (savedEmail) {
        setUser({ uid: savedEmail, email: savedEmail });
        
        const expectedAdminEmail = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
        if (savedEmail === expectedAdminEmail || savedEmail === `${expectedAdminEmail}@obsidian.local` || savedEmail === 'admin@obsidian.local' || savedEmail === 'markleonov2010@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const loginWithGoogle = async () => {
    throw new Error('Google login disabled. Please use email and password.');
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const expectedAdminEmail = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const expectedAdminPass = import.meta.env.VITE_ADMIN_PASSWORD || '123123';
    
    let isEnvAdmin = false;
    // Allow login if it matches the VITE env credentials
    if ((email === expectedAdminEmail || email === `${expectedAdminEmail}@obsidian.local`) && pass === expectedAdminPass) {
      isEnvAdmin = true;
      // Ensure the admin exists in the database
      await setDoc(doc(db, 'app_users', email), {
        email,
        password: pass,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }

    if (!isEnvAdmin) {
      const userDoc = await getDoc(doc(db, 'app_users', email));
      
      if (!userDoc.exists()) {
        throw new Error("User not found.");
      }
      
      const userData = userDoc.data();
      if (userData.password !== pass) {
        throw new Error("Invalid password.");
      }
    }
    
    localStorage.setItem('obsidian_user_email', email);
    setUser({ uid: email, email });
    
    if (email === expectedAdminEmail || email === `${expectedAdminEmail}@obsidian.local` || email === 'admin@obsidian.local' || email === 'markleonov2010@gmail.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    
    return { uid: email, email };
  };
  
  const registerWithEmail = async (email: string, pass: string) => {
    const freshRegUsername = email.split('@')[0].toLowerCase();
    
    const snap = await getDocs(collection(db, 'app_users'));
    const userAlreadyExists = snap.docs.some(doc => {
      const existingEmail = doc.id;
      const existingUsername = existingEmail.split('@')[0].toLowerCase();
      return existingUsername === freshRegUsername;
    });

    if (userAlreadyExists) {
      throw new Error("User already exists with this username/email. Please login.");
    }
    
    await setDoc(doc(db, 'app_users', email), {
      email,
      password: pass,
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('obsidian_user_email', email);
    setUser({ uid: email, email });
    
    const expectedAdminEmail = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    if (email === expectedAdminEmail || email === `${expectedAdminEmail}@obsidian.local` || email === 'admin@obsidian.local' || email === 'markleonov2010@gmail.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    
    return { uid: email, email };
  };

  const logout = async () => {
    localStorage.removeItem('obsidian_user_email');
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


