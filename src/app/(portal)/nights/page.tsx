"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Page";
import { InclusionChips, TagInput } from "@/components/ui/TagInput";
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
  splitInclusions,
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
  /** Only published menus can go on a bookable night. */
  const publishedMenus = useMemo(
    () => menus.filter((m) => menuStatus(m) === "PUBLISHED"),
    [menus],
  );
  const selectedMenu = useMemo(
    () => publishedMenus.find((m) => m.id === menuId) ?? null,
    [publishedMenus, menuId],
  );

  /** Soft warn: same published menu on the same calendar day (not a hard block). */
  const duplicateNightHint = useMemo(() => {
    if (!menuId || !startsLocal) return null;
    const day = localDayKey(startsLocal);
    const hits = nights.filter((n) => {
      if (n.status === "CANCELLED") return false;
      if (n.menu?.id !== menuId) return false;
      return localDayKey(n.startsAt) === day;
    });
    if (hits.length === 0) return null;
    const when = formatNightWhen(hits[0].startsAt);
    return `Heads up: ${selectedMenu?.name ?? "this menu"} is already on ${when}. Reusing the package is fine — only skip if you meant a different night.`;
  }, [menuId, startsLocal, nights, selectedMenu?.name]);

  function applyMenu(id: string) {
    setMenuId(id);
    const menu = publishedMenus.find((m) => m.id === id) ?? menus.find((m) => m.id === id);
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
        "That menu isn’t published yet. Publish it under Set menus first.",
      );
      return;
    }
    openForm(preselectMenuId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectMenuId, menusRes.loading, publishedMenus.length]);

  function onMenuChange(id: string) {
    applyMenu(id);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const price = Number(seatPrice);
    const caps = Number(capacity);
    if (!startsLocal) {
      setFormError("Pick date & time for the night.");
      return;
    }
    if (!menuId) {
      setFormError("Pick a menu — guests need to know what’s on the table.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Set the seat price guests will pay (₹).");
      return;
    }
    if (!Number.isFinite(caps) || caps < 2 || caps > 12) {
      setFormError("Capacity must be 2–12.");
      return;
    }
    if (inclusions.length === 0) {
      setFormError("Add at least one inclusion (what’s provided on the table).");
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

  function resetFormFields() {
    setStartsLocal("");
    setSeatPrice("");
    setCapacity("6");
    setVibeCopy("");
    setInclusions([]);
  }

  async function onCancelNight(night: NightRow) {
    if (night.seatsTaken > 0) {
      setFormError(
        "Paid seats already exist — open Support so Admin can cancel/refund.",
      );
      return;
    }
    if (!confirm(`Cancel ${formatNightWhen(night.startsAt)}?`)) return;
    setBusy(true);
    setFormError(null);
    try {
      if (mockMode) {
        setLocalNights(
          nights.map((n) =>
            n.id === night.id ? { ...n, status: "CANCELLED" } : n,
          ),
        );
        return;
      }
      const token = await getToken();
      if (!token || !venueId) throw new Error("Not signed in");
      await patchNight(token, venueId, night.id, { status: "CANCELLED" });
      setLocalNights(null);
      await nightsRes.reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v-rise mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Bookable inventory"
        title="Publish nights"
        description="A night is the bookable table. Pick a published menu (food package stays reused — no duplicate menus), set date, seats, and price. Guests book that night in the app."
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
        <div className="mt-4">
          <ErrorBanner message={formError} />
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mt-6 space-y-5 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={startsLocal}
                onChange={(e) => setStartsLocal(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Seat price guests pay (₹)</Label>
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
          </div>

          <div className="rounded-xl border border-border bg-bg-soft/80 p-4">
            <Label>Published menu on this table</Label>
            <Select
              value={menuId}
              onChange={(e) => onMenuChange(e.target.value)}
              required
            >
              <option value="">Select a published menu…</option>
              {publishedMenus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            {publishedMenus.length === 0 ? (
              <p className="mt-2 text-[12px] text-warning">
                No published menus yet. Go to Set menus → Publish menu first.
              </p>
            ) : null}
            {selectedMenu ? (
              <div className="mt-3 space-y-2">
                <p className="text-[13px] leading-relaxed text-text-muted">
                  <span className="font-semibold text-ink">
                    {selectedMenu.name}
                  </span>
                  {menuCourses(selectedMenu).length
                    ? ` — ${menuCourses(selectedMenu).join(" · ")}`
                    : null}
                </p>
                {menuCategories(selectedMenu).length ? (
                  <p className="text-[12px] text-text-faint">
                    Fits:{" "}
                    {menuCategories(selectedMenu)
                      .map((c) => tableTypeLabel(c))
                      .join(" · ")}
                    {menuCategories(selectedMenu).length === 1
                      ? " · table type auto-set"
                      : " · pick table type below"}
                  </p>
                ) : null}
                <p className="text-[11px] text-text-faint">
                  Menu is locked — food stays as published. Changing courses
                  means a new menu under Set menus.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-text-faint">
                Create & publish menus under Set menus first.
              </p>
            )}
            {duplicateNightHint ? (
              <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] leading-relaxed text-ink">
                {duplicateNightHint}
              </p>
            ) : null}
          </div>

          <div>
            <Label>What’s included on the table</Label>
            <p className="mb-2 text-[12px] text-text-faint">
              Courses, drinks, dessert — guests see these on the night. Press
              Enter after each item.
            </p>
            <TagInput
              value={inclusions}
              onChange={setInclusions}
              placeholder="e.g. Dum biryani"
            />
          </div>

          <div>
            <Label>Vibe line (optional)</Label>
            <Textarea
              value={vibeCopy}
              onChange={(e) => setVibeCopy(e.target.value)}
              placeholder="Long table · strangers · one set menu"
              className="min-h-[72px]"
              maxLength={180}
            />
          </div>

          <Button type="submit" disabled={busy || publishedMenus.length === 0}>
            {busy ? "Saving…" : "Publish night"}
          </Button>
        </form>
      ) : null}

      <section className="mt-8">
        {nightsRes.loading && !localNights ? (
          <Skeleton className="h-48" />
        ) : nights.length === 0 ? (
          <EmptyState
            title="No nights yet"
            body="Publish a night with a menu and inclusions so guests can book in the app."
          />
        ) : (
          <ul className="space-y-3">
            {nights.map((n) => {
              const fill =
                n.capacity > 0
                  ? Math.round((n.seatsTaken / n.capacity) * 100)
                  : 0;
              const chips =
                n.inclusions && n.inclusions.length
                  ? n.inclusions
                  : splitInclusions(n.menu?.description);
              return (
                <li
                  key={n.id}
                  className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[20px] font-semibold tracking-[-0.03em] text-ink">
                        {formatNightWhen(n.startsAt)}
                      </p>
                      <p className="mt-1 text-[13px] text-text-muted">
                        {n.menu?.name ?? "No menu"} ·{" "}
                        {tableTypeLabel(n.tableType)} ·{" "}
                        {paymentTypeLabel(n.paymentType)} ·{" "}
                        {moneyInr(n.seatPrice)} / seat
                      </p>
                      {n.vibeCopy ? (
                        <p className="mt-1 text-[12px] italic text-text-faint">
                          {n.vibeCopy}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      tone={
                        n.status === "OPEN"
                          ? "success"
                          : n.status === "FULL"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {statusLabel(n.status)}
                    </Badge>
                  </div>

                  <InclusionChips items={chips} />

                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-[12px] text-text-faint">
                      <span>
                        {n.seatsTaken} / {n.capacity} taken
                      </span>
                      <span>{n.seatsLeft} left</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg-soft">
                      <div
                        className="h-full rounded-full bg-accent transition-[width]"
                        style={{ width: `${Math.min(fill, 100)}%` }}
                      />
                    </div>
                  </div>
                  {n.status === "OPEN" &&
                  n.seatsTaken === 0 &&
                  (canPublish || mockMode) ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onCancelNight(n)}
                      className="mt-4 text-[12px] font-semibold text-text-muted hover:text-danger"
                    >
                      Cancel night
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
