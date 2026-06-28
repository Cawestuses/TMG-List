import { useState, useEffect } from "react";
import { BeautyLevel } from "../types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

// Global cache for client side
let cachedBeautyLevels: BeautyLevel[] | null = null;
let isFetching = false;
let subscribers: ((levels: BeautyLevel[]) => void)[] = [];

export function updateBeautyLevelsCache(data: BeautyLevel[]) {
  cachedBeautyLevels = [...data].sort((a, b) => a.rank - b.rank);
  subscribers.forEach(sub => sub(cachedBeautyLevels!));
}

export function useBeautyLevels() {
  const [levels, setLevels] = useState<BeautyLevel[]>(cachedBeautyLevels || []);
  const [loading, setLoading] = useState(!cachedBeautyLevels);

  useEffect(() => {
    if (cachedBeautyLevels) {
      setLevels(cachedBeautyLevels);
      setLoading(false);
      return;
    }

    const handler = (data: BeautyLevel[]) => {
      setLevels(data);
      setLoading(false);
    };

    subscribers.push(handler);

    if (!isFetching) {
      isFetching = true;
      getDocs(collection(db, "beauty_levels")).then(snap => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BeautyLevel));
        data.sort((a, b) => a.rank - b.rank);
        cachedBeautyLevels = data;
        subscribers.forEach(sub => sub(data));
        isFetching = false;
      }).catch(err => {
        console.error("Failed to fetch beauty levels", err);
        isFetching = false;
      });
    }

    return () => {
      subscribers = subscribers.filter(sub => sub !== handler);
    };
  }, []);

  return { levels, loading };
}
