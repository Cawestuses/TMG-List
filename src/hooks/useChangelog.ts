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
      fetch("/api/changelog")
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
