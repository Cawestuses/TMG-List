import { useState, useEffect } from "react";
import { FutureLevel } from "../types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

// Global cache for client side
let cachedFutureLevels: FutureLevel[] | null = null;
let isFetching = false;
let subscribers: ((levels: FutureLevel[]) => void)[] = [];

export function updateFutureLevelsCache(data: FutureLevel[]) {
  cachedFutureLevels = [...data];
  subscribers.forEach(sub => sub(cachedFutureLevels!));
}

export function useFutureLevels() {
  const [levels, setLevels] = useState<FutureLevel[]>(cachedFutureLevels || []);
  const [loading, setLoading] = useState(!cachedFutureLevels);

  useEffect(() => {
    if (cachedFutureLevels) {
      setLevels(cachedFutureLevels);
      setLoading(false);
      return;
    }

    const handler = (data: FutureLevel[]) => {
      setLevels(data);
      setLoading(false);
    };

    subscribers.push(handler);

    if (!isFetching) {
      isFetching = true;
      getDocs(collection(db, "future_levels")).then(snap => {
        const data = snap.docs.map(doc => doc.data() as FutureLevel);
        // Maybe sort them alphabetically or by some order if we had one
        cachedFutureLevels = data;
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

  return { futureLevels: levels, loading };
}
