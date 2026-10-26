"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
  KpiCard,
  PageHeader,
  Skeleton,
} from "@/components/ui/Page";
import { TagInput } from "@/components/ui/TagInput";
import {
  createNight,
  listMenus,
  listNights,
  patchNight,
} from "@/lib/api/venue";
import {
  formatNightWhen,
  moneyInr,
  paymentTypeLabel,
  statusLabel,
  tableTypeLabel,
} from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import {
  hydrateMenu,
  menuCategories,
  menuCourses,
  menuStatus,
} from "@/lib/menu-meta";
import { MOCK_MENUS, MOCK_NIGHTS } from "@/lib/mock/data";
import type { NightRow } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

function localDayKey(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(value) && value.length <= 16) {
    return value.slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NightsPage() {
  const searchParams = useSearchParams();
  const preselectMenuId = searchParams.get("menuId");
  const { mockMode, getToken } = useAuth();
  const { venue, canPublish } = useVenue();
  const venueId = venue?.id;
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [localNights, setLocalNights] = useState<NightRow[] | null>(null);
  const [cancelTarget, setCancelTarget] = useState<NightRow | null>(null);

  const [menuId, setMenuId] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [seatPrice, setSeatPrice] = useState("");
  const [capacity, setCapacity] = useState("6");
  const [tableType, setTableType] = useState("WEEKLY");
  const [priceTier, setPriceTier] = useState<"DAYTIME" | "EVENING">("EVENING");
  const [paymentType, setPaymentType] = useState<
    "ALL_INCLUSIVE" | "PAY_OWN_BILL"
  >("ALL_INCLUSIVE");
  const [vibeCopy, setVibeCopy] = useState("");
  const [inclusions, setInclusions] = useState<string[]>([]);

  const nightsRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) return structuredClone(MOCK_NIGHTS);
      const res = await listNights(token, venueId!);
      return res.tables;
    },
    [venueId, mockMode],
  );

  const menusRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) return MOCK_MENUS.map(hydrateMenu);
      const res = await listMenus(token, venueId!);
      return res.menus.map(hydrateMenu);
    },
    [venueId, mockMode],
  );

  const nights = [...(localNights ?? nightsRes.data ?? [])].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const menus = menusRes.data ?? [];
  const publishedMenus = useMemo(
    () => menus.filter((m) => menuStatus(m) === "PUBLISHED"),
    [menus],
  );
  const selectedMenu = useMemo(
    () => publishedMenus.find((m) => m.id === menuId) ?? null,
    [publishedMenus, menuId],
  );

  const activeNights = nights.filter((n) => n.status !== "CANCELLED");
  const bookable = activeNights.filter(
    (n) => n.status === "OPEN" || n.status === "FULL",
  );
  const seatsLeft = bookable.reduce((s, n) => s + n.seatsLeft, 0);
  const seatsTaken = bookable.reduce((s, n) => s + n.seatsTaken, 0);
  const capacityTotal = bookable.reduce((s, n) => s + n.capacity, 0) || 1;

  const { needsAttention, onTheBoard, cancelledNights } = useMemo(() => {
    const attention: NightRow[] = [];
    const board: NightRow[] = [];
    const cancelled: NightRow[] = [];
    for (const n of nights) {
      if (n.status === "CANCELLED") {
        cancelled.push(n);
        continue;
      }
      const paid = n.paidSeats ?? n.seatsTaken;
      const minRun = n.minSeatsToRun ?? 3;
      const under =
        n.status === "OPEN" && (n.underfilled ?? paid < minRun);
      if (under) attention.push(n);
      else board.push(n);
    }
    return {
      needsAttention: attention,
      onTheBoard: board,
      cancelledNights: cancelled,
    };
  }, [nights]);

  const duplicateNightHint = useMemo(() => {
    if (!menuId || !startsLocal) return null;
    const day = localDayKey(startsLocal);
    const hits = nights.filter((n) => {
      if (n.status === "CANCELLED") return false;
      if (n.menu?.id !== menuId) return false;
      return localDayKey(n.startsAt) === day;
    });
    if (hits.length === 0) return null;
    return `Same menu already on ${formatNightWhen(hits[0].startsAt)} — fine if intentional.`;
  }, [menuId, startsLocal, nights]);

  function applyMenu(id: string) {
    setMenuId(id);
    const menu =
      publishedMenus.find((m) => m.id === id) ?? menus.find((m) => m.id === id);
    if (!menu) return;
    const fromMenu = menuCourses(menu);
    if (fromMenu.length) setInclusions(fromMenu);
    const cats = menuCategories(menu);
    if (cats.length === 1) setTableType(cats[0]);
  }

  function openForm(preferMenuId?: string | null) {
    setShowForm(true);
    setFormError(null);
    const prefer =
      (preferMenuId &&
        publishedMenus.find((m) => m.id === preferMenuId)?.id) ||
      menuId ||
      publishedMenus[0]?.id;
    if (prefer) applyMenu(prefer);
  }

  useEffect(() => {
    if (!preselectMenuId || menusRes.loading) return;
    if (!publishedMenus.some((m) => m.id === preselectMenuId)) {
      setFormError(
        "That menu isn’t published yet. Publish it under Menus first.",
      );
      return;
    }
    openForm(preselectMenuId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectMenuId, menusRes.loading, publishedMenus.length]);

  function resetFormFields() {
    setStartsLocal("");
    setSeatPrice("");
    setCapacity("6");
    setVibeCopy("");
    setInclusions([]);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const price = Math.round(Number(seatPrice));
    const caps = Math.round(Number(capacity));
    if (!startsLocal) {
      setFormError("Pick date & time for the night.");
      return;
    }
    if (!menuId) {
      setFormError("Pick a published menu.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
      setFormError("Set a whole-rupee seat price guests will pay (₹).");
      return;
    }
    if (!Number.isFinite(caps) || caps < 2 || caps > 12) {
      setFormError("Capacity must be 2–12.");
      return;
    }
    if (inclusions.length === 0) {
      setFormError("Add at least one inclusion.");
      return;
    }
    setBusy(true);
    try {
      const startsAt = new Date(startsLocal).toISOString();
      const menu = menus.find((m) => m.id === menuId)!;
      if (mockMode) {
        const row: NightRow = {
          id: `night-${Date.now()}`,
          venueId: venueId!,
          startsAt,
          priceTier,
          seatPrice: price,
          capacity: caps,
          status: "OPEN",
          tableType,
          paymentType,
          vibeCopy: vibeCopy.trim() || null,
          inclusions: [...inclusions],
          menu: {
            id: menu.id,
            name: menu.name,
            description: menu.description,
            dietaryType: menu.dietaryType,
          },
          seatsTaken: 0,
          seatsLeft: caps,
        };
        setLocalNights([row, ...nights]);
        setShowForm(false);
        resetFormFields();
        return;
      }
      if (!canPublish) {
        throw new Error("NYTO-curated venue — nights are published in Admin.");
      }
      const token = await getToken();
      if (!token || !venueId) throw new Error("Not signed in");
      await createNight(token, venueId, {
        menuId,
        startsAt,
        priceTier,
        seatPrice: price,
        capacity: caps,
        tableType: tableType as "WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES",
        paymentType,
        vibeCopy: vibeCopy.trim() || undefined,
        inclusions,
      });
      setLocalNights(null);
      await nightsRes.reload();
      setShowForm(false);
      resetFormFields();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create night");
    } finally {
      setBusy(false);
    }
  }

  function requestCancelNight(night: NightRow) {
    const paid = night.paidSeats ?? night.seatsTaken;
    const minRun = night.minSeatsToRun ?? 3;
    if (paid >= minRun) {
      setFormError(
        `This night has ${paid} paid seats (min to run is ${minRun}). Contact NYTO to cancel.`,
      );
      return;
    }
    setFormError(null);
    setCancelTarget(night);
  }

  async function confirmCancelNight() {
    const night = cancelTarget;
    if (!night) return;
    setBusy(true);
    setFormError(null);
    try {
      if (mockMode) {
        setLocalNights(
          nights.map((n) =>
            n.id === night.id ? { ...n, status: "CANCELLED" } : n,
          ),
        );
        setCancelTarget(null);
        return;
      }
      const token = await getToken();
      if (!token || !venueId) throw new Error("Not signed in");
      await patchNight(token, venueId, night.id, { status: "CANCELLED" });
      setLocalNights(null);
      await nightsRes.reload();
      setCancelTarget(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Cancel failed");
      setCancelTarget(null);
    } finally {
      setBusy(false);
    }
  }

  const loading = nightsRes.loading && !localNights;

  return (
    <div className="v-rise mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Bookable inventory"
        title="Publish nights"
        description="Create the tables guests book in the app. Attach a published menu, set time, seats, and price."
        action={
          canPublish || mockMode ? (
            <Button
              type="button"
              onClick={() => (showForm ? setShowForm(false) : openForm())}
            >
              {showForm ? "Close" : "Schedule night"}
            </Button>
          ) : undefined
        }
      />

      {formError ? (
        <div className="mt-6">
          <ErrorBanner message={formError} />
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
            label="Bookable nights"
            value={bookable.length}
            meta={`${activeNights.length} total on the board`}
            progress={
              activeNights.length
                ? (bookable.length / activeNights.length) * 100
                : 0
            }
            hint="Open or full · live in the app"
            tone="accent"
          />
          <KpiCard
            label="Seats left"
            value={seatsLeft}
            meta={`${seatsTaken} of ${capacityTotal} taken`}
            progress={(seatsTaken / capacityTotal) * 100}
            hint="Across all bookable nights"
            tone="success"
          />
          <KpiCard
            label="Fill rate"
            value={`${Math.round((seatsTaken / capacityTotal) * 100)}%`}
            meta={`${publishedMenus.length} published menus ready`}
            progress={(seatsTaken / capacityTotal) * 100}
            hint="Taken ÷ capacity"
          />
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-md)]"
        >
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
            New night
          </p>
          <p className="mt-1 text-[14px] text-text-muted">
            Guests book this date · menu stays reusable.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={startsLocal}
                onChange={(e) => setStartsLocal(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div>
              <Label>Seat price (₹)</Label>
              <Input
                inputMode="numeric"
                value={seatPrice}
                onChange={(e) => setSeatPrice(e.target.value)}
                placeholder="1199"
                required
              />
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                inputMode="numeric"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div>
              <Label>Table type</Label>
              <Select
                value={tableType}
                onChange={(e) => setTableType(e.target.value)}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="WOMEN_LED">Women-led</option>
                <option value="COUPLES">Couples</option>
                <option value="SINGLES">Singles</option>
              </Select>
            </div>
            <div>
              <Label>Price tier</Label>
              <Select
                value={priceTier}
                onChange={(e) =>
                  setPriceTier(e.target.value as "DAYTIME" | "EVENING")
                }
              >
                <option value="EVENING">Evening</option>
                <option value="DAYTIME">Daytime</option>
              </Select>
            </div>
            <div>
              <Label>Bill type</Label>
              <Select
                value={paymentType}
                onChange={(e) =>
                  setPaymentType(
                    e.target.value as "ALL_INCLUSIVE" | "PAY_OWN_BILL",
                  )
                }
              >
                <option value="ALL_INCLUSIVE">All-inclusive</option>
                <option value="PAY_OWN_BILL">Pay own bill</option>
              </Select>
            </div>
            <div>
              <Label>Published menu</Label>
              <Select
                value={menuId}
                onChange={(e) => applyMenu(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {publishedMenus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {selectedMenu ? (
            <p className="mt-3 text-[14px] text-text-muted">
              <span className="font-semibold text-ink">{selectedMenu.name}</span>
              {" — "}
              {menuCourses(selectedMenu).join(" · ") || "No courses"}
            </p>
          ) : null}
          {duplicateNightHint ? (
            <p className="mt-2 text-[13px] font-medium text-warning">
              {duplicateNightHint}
            </p>
          ) : null}

          <div className="mt-4">
            <Label>What’s on the table</Label>
            <TagInput
              value={inclusions}
              onChange={setInclusions}
              placeholder="Course, press Enter"
            />
          </div>

          <div className="mt-4">
            <Label>Vibe line (optional)</Label>
            <Textarea
              value={vibeCopy}
              onChange={(e) => setVibeCopy(e.target.value)}
              placeholder="Long table · strangers · one set menu"
              className="min-h-[56px]"
              maxLength={180}
            />
          </div>

          <div className="mt-5">
            <Button
              type="submit"
              disabled={busy || publishedMenus.length === 0}
              className="h-12 min-w-[160px] text-[15px]"
            >
              {busy ? "Saving…" : "Publish night"}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : nights.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No nights yet"
            body="Schedule a night with a published menu so guests can book in the app."
          />
        </div>
      ) : (
        <>
          {needsAttention.length > 0 ? (
            <section className="mt-8 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                    Action needed
                  </h2>
                  <p className="mt-0.5 text-[13px] text-text-faint">
                    Under the guest minimum — cancel & refund anyone who’s paid
                  </p>
                </div>
                <p className="text-[13px] tabular-nums text-text-faint">
                  {needsAttention.length}
                </p>
              </div>
              <ul className="overflow-hidden rounded-2xl border border-warning/30 bg-white shadow-[var(--shadow-sm)]">
                {needsAttention.map((n) => {
                  const paid = n.paidSeats ?? n.seatsTaken;
                  const minRun = n.minSeatsToRun ?? 3;
                  const fill =
                    n.capacity > 0
                      ? Math.round((n.seatsTaken / n.capacity) * 100)
                      : 0;
                  const canCancel = canPublish || mockMode;
                  return (
                    <li
                      key={n.id}
                      className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                            {formatNightWhen(n.startsAt)}
                          </p>
                          <Badge tone="warning">Needs guests</Badge>
                        </div>
                        <p className="mt-1 truncate text-[13px] text-text-muted">
                          {[
                            n.menu?.name ?? "No menu",
                            tableTypeLabel(n.tableType),
                            moneyInr(n.seatPrice),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-3 max-w-xs">
                          <div className="flex items-baseline justify-between gap-2 text-[12px]">
                            <span className="font-semibold tabular-nums text-ink">
                              {paid}/{n.capacity} paid
                            </span>
                            <span className="text-text-faint">
                              need {minRun} to run
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-soft">
                            <div
                              className="h-full rounded-full bg-warning"
                              style={{ width: `${Math.min(fill, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {canCancel ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="h-11 shrink-0 self-start sm:self-center"
                          disabled={busy}
                          onClick={() => requestCancelNight(n)}
                        >
                          {paid === 0 ? "Cancel night" : "Cancel & refund"}
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="mt-8 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                  On the board
                </h2>
                <p className="mt-0.5 text-[13px] text-text-faint">
                  Live tables guests can book
                </p>
              </div>
              <p className="text-[13px] tabular-nums text-text-faint">
                {onTheBoard.length}
              </p>
            </div>

            {onTheBoard.length === 0 ? (
              <EmptyState
                title="Nothing else on the board"
                body="Healthy nights land here. Underfilled ones stay in Action needed above."
              />
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
                <li className="hidden grid-cols-[minmax(0,1.5fr)_7.5rem_6.5rem_auto] gap-4 border-b border-border-subtle bg-bg-soft/70 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint md:grid">
                  <span>When</span>
                  <span>Seats</span>
                  <span>Price</span>
                  <span className="text-right">Status</span>
                </li>
                {onTheBoard.map((n) => {
                  const fill =
                    n.capacity > 0
                      ? Math.round((n.seatsTaken / n.capacity) * 100)
                      : 0;
                  const tone =
                    n.status === "FULL" ? "warning" : "success";
                  return (
                    <li
                      key={n.id}
                      className="grid gap-2 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_7.5rem_6.5rem_auto] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
                          {formatNightWhen(n.startsAt)}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-text-muted">
                          {[
                            n.menu?.name ?? "No menu",
                            tableTypeLabel(n.tableType),
                            paymentTypeLabel(n.paymentType),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold tabular-nums text-ink">
                          {n.seatsTaken}/{n.capacity}
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-soft">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${Math.min(fill, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-text-faint">
                          {n.seatsLeft} left
                        </p>
                      </div>
                      <p className="text-[14px] font-semibold tabular-nums text-ink">
                        {moneyInr(n.seatPrice)}
                      </p>
                      <div className="md:justify-self-end">
                        <Badge tone={tone}>{statusLabel(n.status)}</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {cancelledNights.length > 0 ? (
            <section className="mt-8 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                    Cancelled
                  </h2>
                  <p className="mt-0.5 text-[13px] text-text-faint">
                    Off the board · not bookable
                  </p>
                </div>
                <p className="text-[13px] tabular-nums text-text-faint">
                  {cancelledNights.length}
                </p>
              </div>
              <ul className="overflow-hidden rounded-2xl border border-border bg-white opacity-80 shadow-[var(--shadow-sm)]">
                {cancelledNights.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-ink">
                        {formatNightWhen(n.startsAt)}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-text-muted">
                        {[n.menu?.name ?? "No menu", tableTypeLabel(n.tableType)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Badge tone="neutral">{statusLabel(n.status)}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {cancelTarget ? (
        <CancelNightModal
          night={cancelTarget}
          busy={busy}
          onClose={() => {
            if (!busy) setCancelTarget(null);
          }}
          onConfirm={() => void confirmCancelNight()}
        />
      ) : null}
    </div>
  );
}

function CancelNightModal({
  night,
  busy,
  onClose,
  onConfirm,
}: {
  night: NightRow;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const paid = night.paidSeats ?? night.seatsTaken;
  const minRun = night.minSeatsToRun ?? 3;
  const withRefund = paid > 0;
  const when = formatNightWhen(night.startsAt);
  const menuName = night.menu?.name ?? "This night";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-night-title"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-danger">
          {withRefund ? "Cancel & refund" : "Cancel night"}
        </p>
        <h3
          id="cancel-night-title"
          className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-ink"
        >
          {when}
        </h3>
        <p className="mt-1 text-[14px] text-text-muted">{menuName}</p>

        {withRefund ? (
          <div className="mt-5 space-y-2 rounded-xl border border-danger/15 bg-danger/5 px-4 py-3 text-[14px] leading-relaxed text-text">
            <p>
              Only <span className="font-semibold text-ink">{paid}</span> paid
              seat{paid === 1 ? "" : "s"} — need {minRun} to run.
            </p>
            <p className="text-text-muted">
              Guests get a full refund and a notification that the night is off.
            </p>
          </div>
        ) : (
          <p className="mt-5 text-[14px] leading-relaxed text-text-muted">
            No paid seats yet. This night comes off the board and guests can no
            longer book it.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Keep night
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy
              ? "Cancelling…"
              : withRefund
                ? "Cancel & refund guests"
                : "Cancel night"}
          </Button>
        </div>
      </div>
    </div>
  );
}
