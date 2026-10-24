"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, doorTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Page";
import { checkInGuest, listDoorBookings } from "@/lib/api/venue";
import {
  bookingTableLabel,
  guestLabel,
  isSameIstDay,
  moneyInr,
  statusLabel,
  tableTypeLabel,
} from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import { MOCK_BOOKINGS } from "@/lib/mock/data";
import type { DoorBooking } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

type Filter = "ALL" | "WAITING" | "ATTENDED";

export default function DoorPage() {
  const { mockMode, getToken } = useAuth();
  const { venue } = useVenue();
  const venueId = venue?.id;
  const [filter, setFilter] = useState<Filter>("WAITING");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [localBookings, setLocalBookings] = useState<DoorBooking[] | null>(
    null,
  );

  // Always start blank when opening this page (no leftover / autofill junk).
  useEffect(() => {
    setCode("");
    setFlash(null);
  }, [venueId]);

  const bookingsRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) return structuredClone(MOCK_BOOKINGS);
      const res = await listDoorBookings(token, venueId!);
      return res.bookings;
    },
    [venueId, mockMode],
  );

  const bookings = localBookings ?? bookingsRes.data ?? [];
  const tonight = useMemo(
    () => bookings.filter((b) => isSameIstDay(b.table.startsAt)),
    [bookings],
  );

  const isWaiting = (status: string) =>
    status === "CONFIRMED" || status === "NO_SHOW";

  const visible = tonight.filter((b) => {
    if (filter === "ALL") return true;
    if (filter === "WAITING") return isWaiting(b.status);
    return b.status === "ATTENDED";
  });

  const counts = {
    ALL: tonight.length,
    WAITING: tonight.filter((b) => isWaiting(b.status)).length,
    ATTENDED: tonight.filter((b) => b.status === "ATTENDED").length,
  };

  async function runCheckIn(rawCode: string) {
    const trimmed = rawCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      setFlash({
        ok: false,
        text: "Type the code from the guest’s NYTO app, then confirm.",
      });
      return;
    }
    setBusy(true);
    setFlash(null);
    try {
      if (mockMode) {
        const hit = bookings.find(
          (b) => (b.checkInCode || "").toUpperCase() === trimmed,
        );
        if (!hit) {
          throw new Error("No booking for that code at this venue.");
        }
        if (hit.status === "ATTENDED") {
          setFlash({
            ok: true,
            text: `${guestLabel(hit.user)} is already checked in.`,
          });
        } else {
          setLocalBookings(
            bookings.map((b) =>
              b.id === hit.id
                ? {
                    ...b,
                    status: "ATTENDED" as const,
                    checkedInAt: new Date().toISOString(),
                  }
                : b,
            ),
          );
          setFlash({
            ok: true,
            text: `${guestLabel(hit.user)} checked in · ${hit.seatsBooked} seat${hit.seatsBooked === 1 ? "" : "s"}`,
          });
          setFilter("ATTENDED");
        }
        setCode("");
        return;
      }
      const token = await getToken();
      if (!token || !venueId) throw new Error("Not signed in");
      await checkInGuest(token, venueId, trimmed);
      setFlash({ ok: true, text: `Checked in · ${trimmed}` });
      setCode("");
      setLocalBookings(null);
      setFilter("ATTENDED");
      await bookingsRes.reload();
    } catch (err) {
      setFlash({
        ok: false,
        text: err instanceof Error ? err.message : "Check-in failed",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onCheckIn(e: FormEvent) {
    e.preventDefault();
    await runCheckIn(code);
  }

  return (
    <div className="v-rise mx-auto max-w-5xl">
      <PageHeader
        eyebrow="At the door"
        title="Check-in"
        description="Guest shows the code from the NYTO app. Type it once above → they move to Checked in. The list below is who to expect."
      />

      <form
        onSubmit={onCheckIn}
        className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-md)]"
        autoComplete="off"
      >
        <Label>Guest check-in code</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Type code here"
            name="nyto-checkin-code"
            id="nyto-checkin-code"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            autoFocus
            className="h-14 font-mono text-[22px] tracking-[0.22em] uppercase sm:flex-1"
          />
          <Button
            type="submit"
            disabled={busy || code.trim().length < 4}
            className="h-14 min-w-[160px] text-[15px]"
          >
            {busy ? "Confirming…" : "Confirm arrival"}
          </Button>
        </div>
        {flash ? (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-[13px] font-medium ${
              flash.ok
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {flash.text}
          </p>
        ) : mockMode ? (
          <p className="mt-3 text-[12px] text-text-faint">
            Demo tip — try typing{" "}
            <button
              type="button"
              className="font-mono font-semibold text-accent-deep hover:underline"
              onClick={() => setCode("AK7M2P")}
            >
              AK7M2P
            </button>
            {" · "}
            <button
              type="button"
              className="font-mono font-semibold text-accent-deep hover:underline"
              onClick={() => setCode("CX1N8T")}
            >
              CX1N8T
            </button>
            {" · "}
            <button
              type="button"
              className="font-mono font-semibold text-accent-deep hover:underline"
              onClick={() => setCode("DH3W5Y")}
            >
              DH3W5Y
            </button>
          </p>
        ) : (
          <p className="mt-3 text-[12px] text-text-faint">
            Field stays empty until you type or tap Confirm on a guest below.
          </p>
        )}
      </form>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["WAITING", "Waiting"],
            ["ATTENDED", "Checked in"],
            ["ALL", "All guests"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition ${
              filter === key
                ? "border-accent bg-accent-wash text-accent-deep"
                : "border-border bg-white text-text-muted hover:border-accent/30 hover:text-ink"
            }`}
          >
            {label}
            <span className="ml-1.5 tabular-nums text-text-faint">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {bookingsRes.error ? (
        <div className="mt-4">
          <ErrorBanner message={bookingsRes.error} />
        </div>
      ) : null}

      <section className="mt-4">
        {bookingsRes.loading && !localBookings ? (
          <Skeleton className="h-56" />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No guests in this list"
            body="Waiting = paid, not checked in yet. Checked in = confirmed at the door."
          />
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
            {visible.map((b) => {
              const table = bookingTableLabel(b.table);
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink">
                      {guestLabel(b.user)}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-ink">
                      Table · {table.title}
                      <span className="font-normal text-text-muted">
                        {" "}
                        · {table.subtitle}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-text-faint">
                      <span className="font-mono tracking-wide text-text-muted">
                        {b.checkInCode ?? "—"}
                      </span>
                      {" · "}
                      {b.seatsBooked} seat{b.seatsBooked === 1 ? "" : "s"}
                      {" · "}
                      {moneyInr(b.amountPaid ?? b.payment?.amount)}
                      {b.payment?.method
                        ? ` · ${b.payment.method.toUpperCase() === "CARD" ? "Card" : b.payment.method}`
                        : ""}
                      {b.user.phone ? ` · ${b.user.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">
                      {tableTypeLabel(b.table.tableType)}
                    </Badge>
                    <Badge tone={doorTone(b.status)}>
                      {statusLabel(b.status)}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
