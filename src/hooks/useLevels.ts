import { useState, useEffect } from "react";
import { Level } from "../types";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

// Global cache for client side
let cachedLevels: Level[] | null = null;
let isFetching = false;
let subscribers: ((levels: Level[]) => void)[] = [];

export function useLevels() {
  const [levels, setLevels] = useState<Level[]>(cachedLevels || []);
  const [loading, setLoading] = useState(!cachedLevels);

  useEffect(() => {
    if (cachedLevels) {
      setLevels(cachedLevels);
      setLoading(false);
      return;
    }

    const handler = (data: Level[]) => {
      setLevels(data);
      setLoading(false);
    };

    subscribers.push(handler);

    if (!isFetching) {
      isFetching = true;
      getDocs(collection(db, "levels")).then(snap => {
        const data = snap.docs.map(doc => doc.data() as Level);
        data.sort((a, b) => a.rank - b.rank);
        cachedLevels = data;
        subscribers.forEach(sub => sub(data));
        isFetching = false;
      }).catch(err => {
        console.error(err);
        isFetching = false;
      });
    }

    return () => {
      subscribers = subscribers.filter(sub => sub !== handler);
    };
  }, []);

  return { levels, loading };
}
