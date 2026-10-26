"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, doorTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  ErrorBanner,
  KpiCard,
  PageHeader,
  Skeleton,
} from "@/components/ui/Page";
import { listDoorBookings, listNights } from "@/lib/api/venue";
import {
  bookingTableLabel,
  formatNightWhen,
  guestLabel,
  isSameIstDay,
  moneyInr,
  statusLabel,
  tableTypeLabel,
} from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import { computeTonightKpis } from "@/lib/kpi";
import { MOCK_BOOKINGS, MOCK_NIGHTS } from "@/lib/mock/data";
import { applyMockFloorAttendance } from "@/lib/mock/floor";
import type { DoorBooking } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

function payMethod(method: string | null | undefined): string {
  if (!method) return "—";
  const m = method.toUpperCase();
  if (m === "UPI") return "UPI";
  if (m === "CARD") return "Card";
  return method;
}

export default function TonightPage() {
  const { mockMode } = useAuth();
  const { venue, loading: venueLoading } = useVenue();
  const venueId = venue?.id;

  const nightsRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) return MOCK_NIGHTS;
      const res = await listNights(token, venueId!);
      return res.tables;
    },
    [venueId, mockMode],
  );

  const bookingsRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) {
        return applyMockFloorAttendance(structuredClone(MOCK_BOOKINGS));
      }
      const res = await listDoorBookings(token, venueId!);
      return res.bookings;
    },
    [venueId, mockMode],
  );

  const nights = nightsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const kpis = computeTonightKpis(nights, bookings);

  const tonightBookings = useMemo(
    () => bookings.filter((b) => isSameIstDay(b.table.startsAt)),
    [bookings],
  );

  /** Group guests under the table/night they booked — critical for floor staff. */
  const byTable = useMemo(() => {
    const map = new Map<
      string,
      { table: DoorBooking["table"]; guests: DoorBooking[] }
    >();
    for (const b of tonightBookings) {
      const existing = map.get(b.table.id);
      if (existing) existing.guests.push(b);
      else map.set(b.table.id, { table: b.table, guests: [b] });
    }
    return [...map.values()].sort(
      (a, b) =>
        new Date(a.table.startsAt).getTime() -
        new Date(b.table.startsAt).getTime(),
    );
  }, [tonightBookings]);

  const loading = venueLoading || nightsRes.loading || bookingsRes.loading;
  const error = nightsRes.error || bookingsRes.error;
  const paid = Math.max(kpis.totalPaidSeats, 1);
  const capacity = Math.max(kpis.capacityTonight, 1);

  return (
    <div className="v-rise mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Tonight’s service"
        title="Today's guests"
        description={`Who paid for a seat at ${venue?.name ?? "your venue"} tonight, grouped by table. Confirm arrivals under Check-in.`}
        action={
          <Link href="/door">
            <Button>Go to check-in</Button>
          </Link>
        }
      />

      {error ? (
        <div className="mt-6">
          <ErrorBanner message={error} />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Waiting"
            value={kpis.expectedGuests + kpis.noShows}
            meta={`of ${kpis.totalPaidSeats} paid seats tonight`}
            progress={((kpis.expectedGuests + kpis.noShows) / paid) * 100}
            hint="Paid · not checked in yet"
            tone="accent"
          />
          <KpiCard
            label="Checked in"
            value={kpis.checkedIn}
            meta={`of ${kpis.totalPaidSeats} paid seats tonight`}
            progress={(kpis.checkedIn / paid) * 100}
            hint="Confirmed at the door · ready to seat"
            tone="success"
          />
          <KpiCard
            label="Seats still open"
            value={kpis.seatsLeftTonight}
            meta={`${kpis.capacityTonight - kpis.seatsLeftTonight} of ${kpis.capacityTonight} capacity filled`}
            progress={
              ((capacity - kpis.seatsLeftTonight) / capacity) * 100
            }
            hint={
              kpis.nightsTonight
                ? `${kpis.nightsTonight} table${kpis.nightsTonight === 1 ? "" : "s"} running tonight`
                : "No tables scheduled tonight"
            }
          />
        </div>
      )}

      {!loading && kpis.nightsTonight === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-white px-5 py-4 shadow-[var(--shadow-sm)]">
          <p className="text-[13px] text-text-muted">
            Nothing starts tonight.
            {kpis.nextNight ? (
              <>
                {" "}
                Next:{" "}
                <span className="font-semibold text-ink">
                  {formatNightWhen(kpis.nextNight.startsAt)}
                </span>{" "}
                · {moneyInr(kpis.nextNight.seatPrice)}/seat ·{" "}
                {kpis.nextNight.seatsLeft} left.
              </>
            ) : (
              <> Publish a night when ready.</>
            )}
          </p>
        </div>
      ) : null}

      <section className="mt-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Guests by table
          </h2>
          <p className="text-[12px] text-text-faint">
            {tonightBookings.length} bookings · {byTable.length} table
            {byTable.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-64" />
        ) : byTable.length === 0 ? (
          <EmptyState
            title="No paid guests tonight"
            body="When someone books and pays in the NYTO app, they appear here under their table as Waiting until check-in."
          />
        ) : (
          byTable.map(({ table, guests }) => {
            const label = bookingTableLabel(table);
            const arrived = guests
              .filter((g) => g.status === "ATTENDED")
              .reduce((s, g) => s + g.seatsBooked, 0);
            const seats = guests.reduce((s, g) => s + g.seatsBooked, 0);
            return (
              <div
                key={table.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle bg-bg-soft/70 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-deep">
                      Table
                    </p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-ink">
                      {label.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-text-muted">
                      {label.subtitle}
                      {table.capacity
                        ? ` · ${table.capacity} seat capacity`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">
                      {tableTypeLabel(table.tableType)}
                    </Badge>
                    <Badge tone="neutral">
                      {arrived}/{seats} arrived
                    </Badge>
                  </div>
                </div>

                <div className="hidden grid-cols-[1.3fr_0.85fr_0.55fr_0.7fr_auto] gap-3 border-b border-border-subtle px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint md:grid">
                  <span>Guest</span>
                  <span>Code</span>
                  <span>Seats</span>
                  <span>Paid</span>
                  <span className="text-right">Status</span>
                </div>

                <ul>
                  {[...guests]
                    .sort((a, b) => {
                      if (a.status === "ATTENDED" && b.status !== "ATTENDED")
                        return 1;
                      if (b.status === "ATTENDED" && a.status !== "ATTENDED")
                        return -1;
                      return (
                        guestLabel(a.user).localeCompare(guestLabel(b.user))
                      );
                    })
                    .map((b) => (
                      <li
                        key={b.id}
                        className="grid gap-2 border-b border-border-subtle px-5 py-3.5 last:border-b-0 md:grid-cols-[1.3fr_0.85fr_0.55fr_0.7fr_auto] md:items-center md:gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-ink">
                            {guestLabel(b.user)}
                          </p>
                          <p className="truncate text-[12px] text-text-faint">
                            {b.user.phone ?? "No phone on file"}
                          </p>
                        </div>
                        <p className="font-mono text-[13px] tracking-wide text-ink">
                          {b.checkInCode ?? "—"}
                        </p>
                        <p className="text-[13px] font-medium text-text-muted">
                          {b.seatsBooked}
                        </p>
                        <div>
                          <p className="text-[13px] font-semibold text-ink">
                            {moneyInr(b.amountPaid ?? b.payment?.amount)}
                          </p>
                          <p className="text-[12px] text-text-faint">
                            {payMethod(b.payment?.method)}
                          </p>
                        </div>
                        <div className="md:justify-self-end">
                          <Badge tone={doorTone(b.status)}>
                            {statusLabel(b.status)}
                          </Badge>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
