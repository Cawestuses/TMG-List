import { useState, useEffect } from "react";
import { ChangelogItem } from "../types";

let cachedLog: ChangelogItem[] | null = null;
let isFetching = false;
let subscribers: ((logs: ChangelogItem[]) => void)[] = [];

export function useChangelog() {
  const [logs, setLogs] = useState<ChangelogItem[]>(cachedLog || []);
  const [loading, setLoading] = useState(!cachedLog);

  useEffect(() => {
    if (cachedLog) {
      setLogs(cachedLog);
      setLoading(false);
      return;
    }

    const handler = (data: ChangelogItem[]) => {
      setLogs(data);
      setLoading(false);
    };

    subscribers.push(handler);

    if (!isFetching) {
      isFetching = true;
      const envUrl = import.meta.env.VITE_API_URL || "";
      const isLocalOrCloudRun = typeof window !== "undefined" && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"));
      const API_BASE_URL = (envUrl.includes("onrender.com") || isLocalOrCloudRun) ? "" : envUrl;
      fetch(`${API_BASE_URL}/api/changelog`)
        .then(res => res.json())
        .then((data: ChangelogItem[]) => {
          cachedLog = data;
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

  return { logs, loading };
}
