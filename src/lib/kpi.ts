import { isSameIstDay } from "@/lib/format";
import type { DoorBooking, NightRow } from "@/lib/types";

export type TonightKpis = {
  /** Paid seats still coming (CONFIRMED). */
  expectedGuests: number;
  /** Seats already confirmed at door (ATTENDED). */
  checkedIn: number;
  /** NO_SHOW seats tonight. */
  noShows: number;
  /** All paid seats tonight (confirmed + arrived + no-show). */
  totalPaidSeats: number;
  /** Open seats still sellable across tonight’s nights. */
  seatsLeftTonight: number;
  /** Capacity of tonight’s open nights. */
  capacityTonight: number;
  /** How many open nights start tonight. */
  nightsTonight: number;
  /** Next upcoming night (any day). */
  nextNight: NightRow | null;
};

export function computeTonightKpis(
  nights: NightRow[],
  bookings: DoorBooking[],
  now = new Date(),
): TonightKpis {
  const nightsTonight = nights.filter(
    (n) => n.status !== "CANCELLED" && isSameIstDay(n.startsAt, now),
  );
  const tonightIds = new Set(nightsTonight.map((n) => n.id));

  const tonightBookings = bookings.filter((b) =>
    tonightIds.size > 0
      ? tonightIds.has(b.table.id)
      : isSameIstDay(b.table.startsAt, now),
  );

  const expectedGuests = tonightBookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((s, b) => s + b.seatsBooked, 0);
  const checkedIn = tonightBookings
    .filter((b) => b.status === "ATTENDED")
    .reduce((s, b) => s + b.seatsBooked, 0);
  const noShows = tonightBookings
    .filter((b) => b.status === "NO_SHOW")
    .reduce((s, b) => s + b.seatsBooked, 0);
  const totalPaidSeats = expectedGuests + checkedIn + noShows;
  const seatsLeftTonight = nightsTonight.reduce(
    (s, n) => s + Math.max(n.seatsLeft, 0),
    0,
  );
  const capacityTonight = nightsTonight.reduce((s, n) => s + n.capacity, 0);

  const upcoming = [...nights]
    .filter((n) => n.status === "OPEN" || n.status === "FULL")
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .find(
      (n) =>
        new Date(n.startsAt).getTime() >= now.getTime() - 2 * 60 * 60 * 1000,
    );

  return {
    expectedGuests,
    checkedIn,
    noShows,
    totalPaidSeats,
    seatsLeftTonight,
    capacityTonight,
    nightsTonight: nightsTonight.length,
    nextNight: upcoming ?? null,
  };
}
