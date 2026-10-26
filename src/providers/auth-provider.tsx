"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  logout as apiLogout,
  refreshSession,
  requestEmailOtp,
  verifyEmailOtp,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  clearActiveVenueId,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveSession,
} from "@/lib/auth-storage";
import {
  isMockAuth,
  mockRequestOtp,
  mockVerifyOtp,
} from "@/lib/mock/auth";
import type { VenueUser } from "@/lib/types";

type AuthState = {
  ready: boolean;
  user: VenueUser | null;
  token: string | null;
  error: string | null;
  mockMode: boolean;
  requestOtp: (email: string) => Promise<{
    maskedEmail: string;
    otpSent?: boolean;
    deliveryMode?: string;
  }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);
const REFRESH_SKEW_MS = 60_000;

function accessTokenNeedsRefresh(token: string): boolean {
  try {
    if (token.startsWith("mock.")) return false;
    const payload = token.split(".")[1];
    if (!payload) return true;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    if (!json.exp) return true;
    return json.exp * 1000 <= Date.now() + REFRESH_SKEW_MS;
  } catch {
    return true;
  }
}

function assertVenueRole(role: string) {
  if (role !== "VENUE_STAFF" && role !== "ADMIN") {
    throw new ApiError(
      "This account is not a venue partner. Use the venue staff email.",
      403,
    );
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<VenueUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const userRef = useRef<VenueUser | null>(null);
  userRef.current = user;
  const mockMode = isMockAuth();

  const applyUser = useCallback((accessToken: string, u: VenueUser) => {
    assertVenueRole(String(u.role));
    setToken(accessToken);
    setUser(u);
  }, []);

  const rotateSession = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    refreshInFlight.current = (async () => {
      const refresh = getRefreshToken();
      if (!refresh) return null;
      if (mockMode || refresh.startsWith("mock.")) {
        return getAccessToken();
      }
      try {
        const rotated = await refreshSession(refresh);
        const stored = getStoredUser<VenueUser>();
        saveSession({
          accessToken: rotated.accessToken,
          refreshToken: rotated.refreshToken,
          user: stored ?? userRef.current,
        });
        setToken(rotated.accessToken);
        return rotated.accessToken;
      } catch {
        clearSession();
        setUser(null);
        setToken(null);
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    return refreshInFlight.current;
  }, [mockMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let access = getAccessToken();
        const refresh = getRefreshToken();
        const stored = getStoredUser<VenueUser>();
        if ((!access && !refresh) || !stored) {
          if (!cancelled) setReady(true);
          return;
        }
        if (!access || accessTokenNeedsRefresh(access)) {
          access = await rotateSession();
        }
        if (!access) {
          clearSession();
          return;
        }
        try {
          applyUser(access, stored);
        } catch {
          clearSession();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser, rotateSession]);

  useEffect(() => {
    if (!ready) return;
    const onAuth = pathname.startsWith("/login");
    if (!user && !onAuth) router.replace("/login");
    if (user && onAuth) router.replace("/tonight");
  }, [ready, user, pathname, router]);

  const requestOtp = useCallback(
    async (email: string) => {
      setError(null);
      if (mockMode) return mockRequestOtp(email);
      return requestEmailOtp(email);
    },
    [mockMode],
  );

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      setError(null);
      const res = mockMode
        ? await mockVerifyOtp(email, code)
        : await verifyEmailOtp(email, code);
      assertVenueRole(String(res.user.role));
      saveSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
      applyUser(res.accessToken, res.user);
      router.replace("/tonight");
    },
    [applyUser, mockMode, router],
  );

  const logout = useCallback(async () => {
    await apiLogout(token, getRefreshToken());
    clearSession();
    clearActiveVenueId();
    setUser(null);
    setToken(null);
    router.replace("/login");
  }, [router, token]);

  const getToken = useCallback(async () => {
    let access = getAccessToken();
    if (!access) return null;
    if (accessTokenNeedsRefresh(access)) {
      access = await rotateSession();
    }
    return access;
  }, [rotateSession]);

  const value = useMemo(
    () => ({
      ready,
      user,
      token,
      error,
      mockMode,
      requestOtp,
      verifyOtp,
      logout,
      getToken,
    }),
    [ready, user, token, error, mockMode, requestOtp, verifyOtp, logout, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
