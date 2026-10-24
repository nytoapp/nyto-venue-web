import type { VenueUser } from "@/lib/types";

export const MOCK_OTP = "123456";

const MOCK_USER: VenueUser = {
  id: "mock-venue-owner",
  email: "venue@nyto.app",
  fullName: "Ameerpet Kitchen",
  firstName: "Ameerpet",
  role: "VENUE_STAFF",
};

function fakeToken(kind: "access" | "refresh") {
  const exp =
    Math.floor(Date.now() / 1000) + (kind === "access" ? 3600 : 86400 * 30);
  const payload = btoa(JSON.stringify({ sub: MOCK_USER.id, exp, kind }));
  return `mock.${payload}.sig`;
}

export async function mockRequestOtp(email: string) {
  await delay(400);
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    throw new Error("Enter a valid venue email.");
  }
  const [local, domain] = normalized.split("@");
  return { maskedEmail: `${local.slice(0, 2)}•••@${domain}` };
}

export async function mockVerifyOtp(email: string, code: string) {
  await delay(500);
  if (code.trim() !== MOCK_OTP) {
    throw new Error("Invalid code. Use 123456 in demo mode.");
  }
  return {
    accessToken: fakeToken("access"),
    refreshToken: fakeToken("refresh"),
    user: { ...MOCK_USER, email: email.trim().toLowerCase() },
  };
}

export function isMockAuth() {
  return process.env.NEXT_PUBLIC_AUTH_MODE !== "live";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
