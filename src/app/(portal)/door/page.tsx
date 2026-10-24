"use client";

import { FormEvent, useMemo, useState } from "react";
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
  formatClock,
  guestLabel,
  isSameIstDay,
  statusLabel,
} from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import { MOCK_BOOKINGS } from "@/lib/mock/data";
import type { DoorBooking } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

type Filter = "ALL" | "CONFIRMED" | "ATTENDED" | "NO_SHOW";

export default function DoorPage() {
  const { mockMode, getToken } = useAuth();
  const { venue } = useVenue();
  const venueId = venue?.id;
  const [filter, setFilter] = useState<Filter>("CONFIRMED");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [localBookings, setLocalBookings] = useState<DoorBooking[] | null>(
    null,
  );

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

  const visible = tonight.filter((b) =>
    filter === "ALL" ? true : b.status === filter,
  );

  const counts = {
    ALL: tonight.length,
    CONFIRMED: tonight.filter((b) => b.status === "CONFIRMED").length,
    ATTENDED: tonight.filter((b) => b.status === "ATTENDED").length,
    NO_SHOW: tonight.filter((b) => b.status === "NO_SHOW").length,
  };

  async function runCheckIn(rawCode: string) {
    const trimmed = rawCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      setFlash({ ok: false, text: "Enter the guest check-in code from the app." });
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
            text: `Checked in ${guestLabel(hit.user)} · ${hit.seatsBooked} seat${hit.seatsBooked === 1 ? "" : "s"}`,
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
        eyebrow="Front of house"
        title="Door"
        description="Guest shows the app check-in code → you confirm. Marks Checked in only — never refunds or cancels."
      />

      <form
        onSubmit={onCheckIn}
        className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-md)]"
      >
        <Label>Check-in code</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AK7M2P"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="h-14 font-mono text-[22px] tracking-[0.22em] uppercase sm:flex-1"
          />
          <Button
            type="submit"
            disabled={busy}
            className="h-14 min-w-[160px] text-[15px]"
          >
            {busy ? "Checking…" : "Check in"}
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
            Demo: AK7M2P · CX1N8T · DH3W5Y
          </p>
        ) : null}
      </form>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["CONFIRMED", "Expected"],
            ["ATTENDED", "Checked in"],
            ["ALL", "All"],
            ["NO_SHOW", "No-show"],
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
            title="Nobody in this filter"
            body="Expected = paid, not arrived. Checked in = door done. Stuck? Open Support."
          />
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
            {visible.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">
                    {guestLabel(b.user)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-faint">
                    <span className="font-mono tracking-wide text-text-muted">
                      {b.checkInCode ?? "—"}
                    </span>
                    {" · "}
                    {formatClock(b.table.startsAt)} · {b.seatsBooked} seat
                    {b.seatsBooked === 1 ? "" : "s"}
                    {b.user.phone ? ` · ${b.user.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={doorTone(b.status)}>{statusLabel(b.status)}</Badge>
                  {b.status === "CONFIRMED" && b.checkInCode ? (
                    <Button
                      type="button"
                      className="h-9 px-3 text-[12px]"
                      disabled={busy}
                      onClick={() => void runCheckIn(b.checkInCode!)}
                    >
                      Check in
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
