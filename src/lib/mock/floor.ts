import type { DoorBooking } from "@/lib/types";

const ATTENDED_KEY = "nyto.venue.mock.attendedBookings";

function readAttendedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(ATTENDED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** Persist mock check-ins so Tonight and Door stay in sync this session. */
export function markMockBookingAttended(bookingId: string): void {
  if (typeof window === "undefined") return;
  const next = new Set(readAttendedIds());
  next.add(bookingId);
  sessionStorage.setItem(ATTENDED_KEY, JSON.stringify([...next]));
}

export function applyMockFloorAttendance(
  bookings: DoorBooking[],
): DoorBooking[] {
  const attended = new Set(readAttendedIds());
  if (attended.size === 0) return bookings;
  return bookings.map((b) =>
    attended.has(b.id)
      ? {
          ...b,
          status: "ATTENDED" as const,
          checkedInAt: b.checkedInAt ?? new Date().toISOString(),
        }
      : b,
  );
}
