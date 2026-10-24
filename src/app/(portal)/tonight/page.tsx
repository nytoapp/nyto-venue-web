"use client";

import Link from "next/link";
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
  formatClock,
  formatNightWhen,
  guestLabel,
  isSameIstDay,
  moneyInr,
  statusLabel,
} from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import { computeTonightKpis } from "@/lib/kpi";
import { MOCK_BOOKINGS, MOCK_NIGHTS } from "@/lib/mock/data";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

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
      if (mockMode) return MOCK_BOOKINGS;
      const res = await listDoorBookings(token, venueId!);
      return res.bookings;
    },
    [venueId, mockMode],
  );

  const nights = nightsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const kpis = computeTonightKpis(nights, bookings);
  const tonightBookings = bookings
    .filter((b) => isSameIstDay(b.table.startsAt))
    .sort(
      (a, b) =>
        new Date(a.table.startsAt).getTime() -
        new Date(b.table.startsAt).getTime(),
    );

  const loading = venueLoading || nightsRes.loading || bookingsRes.loading;
  const error = nightsRes.error || bookingsRes.error;

  return (
    <div className="v-rise mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Service board"
        title="Tonight"
        description={`Who paid for a seat at ${venue?.name ?? "your venue"} tonight. Same bookings as the guest app + Admin. Use Door to check them in.`}
        action={
          <Link href="/door">
            <Button>Open door</Button>
          </Link>
        }
      />

      {error ? (
        <div className="mt-6">
          <ErrorBanner message={error} />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Expected"
            value={kpis.expectedGuests}
            hint="Paid seats not yet at the door"
            tone="accent"
          />
          <KpiCard
            label="Checked in"
            value={kpis.checkedIn}
            hint="Scanned · ready to seat"
            tone="success"
          />
          <KpiCard
            label="Seats left"
            value={kpis.seatsLeftTonight}
            hint={
              kpis.nightsTonight
                ? `${kpis.nightsTonight} open night${kpis.nightsTonight === 1 ? "" : "s"} tonight`
                : "No nights tonight"
            }
          />
          <KpiCard
            label="No-shows"
            value={kpis.noShows}
            hint="Marked after service window"
            tone={kpis.noShows ? "warning" : "default"}
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
              <> Publish under Nights when ready.</>
            )}
          </p>
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Arrivals
          </h2>
          <p className="text-[12px] text-text-faint">Synced with app bookings</p>
        </div>

        {loading ? (
          <Skeleton className="h-48" />
        ) : tonightBookings.length === 0 ? (
          <EmptyState
            title="No paid guests tonight"
            body="When someone books and pays in the NYTO app, they show here as Expected — then Checked in after Door scan."
          />
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
            {tonightBookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {guestLabel(b.user)}
                  </p>
                  <p className="text-[12px] text-text-faint">
                    {formatClock(b.table.startsAt)} · {b.seatsBooked} seat
                    {b.seatsBooked === 1 ? "" : "s"}
                    {b.checkInCode ? (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-mono tracking-wide text-text-muted">
                          {b.checkInCode}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <Badge tone={doorTone(b.status)}>{statusLabel(b.status)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
