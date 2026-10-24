"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { listMyVenues } from "@/lib/api/venue";
import {
  getActiveVenueId,
  setActiveVenueId,
} from "@/lib/auth-storage";
import { MOCK_VENUE } from "@/lib/mock/data";
import type { VenueRow } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";

type VenueState = {
  venues: VenueRow[];
  venue: VenueRow | null;
  loading: boolean;
  error: string | null;
  canPublish: boolean;
  selectVenue: (venueId: string) => void;
  reload: () => Promise<void>;
};

const VenueContext = createContext<VenueState | null>(null);

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const { user, getToken, mockMode, ready } = useAuth();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setVenues([]);
      setVenueId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mockMode) {
        setVenues([MOCK_VENUE]);
        const stored = getActiveVenueId();
        const next = stored === MOCK_VENUE.id ? stored : MOCK_VENUE.id;
        setVenueId(next);
        setActiveVenueId(next);
        return;
      }
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const res = await listMyVenues(token);
      const list = res.venues ?? [];
      setVenues(list);
      const stored = getActiveVenueId();
      const stillValid = list.some((v) => v.id === stored);
      const next = stillValid ? stored! : list[0]?.id ?? null;
      setVenueId(next);
      if (next) setActiveVenueId(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load venues");
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, mockMode, user]);

  useEffect(() => {
    if (!ready) return;
    void reload();
  }, [ready, reload]);

  const selectVenue = useCallback((id: string) => {
    setVenueId(id);
    setActiveVenueId(id);
  }, []);

  const venue = useMemo(
    () => venues.find((v) => v.id === venueId) ?? null,
    [venues, venueId],
  );

  const canPublish = venue?.hostedBy === "PARTNER";

  const value = useMemo(
    () => ({
      venues,
      venue,
      loading,
      error,
      canPublish,
      selectVenue,
      reload,
    }),
    [venues, venue, loading, error, canPublish, selectVenue, reload],
  );

  return (
    <VenueContext.Provider value={value}>{children}</VenueContext.Provider>
  );
}

export function useVenue() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error("useVenue must be used within VenueProvider");
  return ctx;
}
