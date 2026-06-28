import { useState, useEffect } from "react";
import { Level } from "../types";

// Global cache for client side
let cachedLevels: Level[] | null = null;
let isFetching = false;
let subscribers: ((levels: Level[]) => void)[] = [];

export function updateLevelsCache(data: Level[]) {
  cachedLevels = [...data].sort((a, b) => a.rank - b.rank);
  subscribers.forEach(sub => sub(cachedLevels!));
}

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
      const envUrl = import.meta.env.VITE_API_URL || "";
      const isLocalOrCloudRun = typeof window !== "undefined" && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
      const API_BASE_URL = (envUrl.includes("onrender.com") || isLocalOrCloudRun) ? "" : envUrl;
      fetch(`${API_BASE_URL}/api/levels`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch levels");
          return res.json();
        })
        .then((data: Level[]) => {
          if (Array.isArray(data)) {
            data.sort((a, b) => a.rank - b.rank);
            cachedLevels = data;
            subscribers.forEach(sub => sub(data));
          }
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
