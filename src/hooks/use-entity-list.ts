"use client";

import { useEffect, useRef, useState } from "react";

export function useEntityList<T>(load: () => Promise<T>) {
  const loadRef = useRef(load);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;
    loadRef.current()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }

  return { data, error, loading, reload };
}
