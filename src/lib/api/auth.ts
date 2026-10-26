import { apiRequest } from "@/lib/api/client";
import type { VenueUser } from "@/lib/types";

export async function requestEmailOtp(email: string) {
  return apiRequest<{
    ok: true;
    otpSent: boolean;
    deliveryMode?: "resend" | "dev_log" | "skipped_test" | string;
    maskedEmail: string;
    expiresAt: string;
    resendAfterSeconds: number;
  }>("/auth/email/otp/request", {
    method: "POST",
    body: { email },
  });
}

export async function verifyEmailOtp(email: string, code: string) {
  return apiRequest<{
    ok: true;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: VenueUser;
  }>("/auth/email/otp/verify", {
    method: "POST",
    body: { email, code },
  });
}

export async function refreshSession(refreshToken: string) {
  return apiRequest<{
    ok: true;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export async function venueAccessCheck(token: string, venueId?: string) {
  const q = venueId ? `?venueId=${encodeURIComponent(venueId)}` : "";
  return apiRequest<{
    ok: true;
    surface: string;
    userId: string;
    role: string;
    venueId?: string;
    venueIds?: string[];
  }>(`/venue/access-check${q}`, { token });
}

export async function logout(token: string | null, refreshToken: string | null) {
  if (!refreshToken) return;
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
      token: token ?? undefined,
      body: { refreshToken },
    });
  } catch {
    // Local clear still happens.
  }
}
