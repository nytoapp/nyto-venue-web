"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";

export function useVenueResource<T>(
  enabled: boolean,
  loader: (token: string) => Promise<T>,
  deps: unknown[] = [],
) {
  const { getToken, mockMode } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token && !mockMode) {
        throw new ApiError("Not signed in", 401);
      }
      const result = await loader(token ?? "mock");
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, getToken, mockMode, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
