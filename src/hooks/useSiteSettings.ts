import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SiteSettings {
  logoUrl?: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading site settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      const ref = doc(db, 'settings', 'general');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await setDoc(ref, newSettings, { merge: true });
      } else {
        await setDoc(ref, newSettings);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      throw err;
    }
  };

  return { settings, loading, updateSettings };
}
