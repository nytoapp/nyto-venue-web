"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
  KpiCard,
  PageHeader,
  Skeleton,
} from "@/components/ui/Page";
import { TagInput } from "@/components/ui/TagInput";
import { createMenu, listMenus, listNights } from "@/lib/api/venue";
import { dietaryLabel, moneyInr, tableTypeLabel } from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import {
  buildMenuDescription,
  hydrateMenu,
  menuCategories,
  menuCourses,
  menuNotes,
  menuStatus,
  withMenuStatus,
  type TableCategory,
} from "@/lib/menu-meta";
import { MOCK_MENUS, MOCK_NIGHTS } from "@/lib/mock/data";
import type { MenuRow } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

export default function MenusPage() {
  const { mockMode, getToken } = useAuth();
  const { venue, canPublish } = useVenue();
  const venueId = venue?.id;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMenus, setLocalMenus] = useState<MenuRow[] | null>(null);

  const [name, setName] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [categories, setCategories] = useState<TableCategory[]>(["WEEKLY"]);
  const [dietaryType, setDietaryType] = useState<
    "VEGETARIAN" | "NON_VEGETARIAN" | "VEGAN"
  >("NON_VEGETARIAN");
  const [costPerHead, setCostPerHead] = useState("");

  const menusRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) return MOCK_MENUS.map(hydrateMenu);
      const res = await listMenus(token, venueId!);
      return res.menus.map(hydrateMenu);
    },
    [venueId, mockMode],
  );

  const nightsRes = useVenueResource(
    Boolean(venueId),
    async (token) => {
      if (mockMode) return MOCK_NIGHTS;
      const res = await listNights(token, venueId!);
      return res.tables;
    },
    [venueId, mockMode],
  );

  const menus = (localMenus ?? menusRes.data ?? []).map(hydrateMenu);
  const nights = nightsRes.data ?? [];

  const nightsByMenu = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of nights) {
      if (n.status === "CANCELLED") continue;
      const id = n.menu?.id;
      if (!id) continue;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [nights]);

  const live = useMemo(
    () => menus.filter((m) => menuStatus(m) === "PUBLISHED"),
    [menus],
  );
  const drafts = useMemo(
    () => menus.filter((m) => menuStatus(m) === "DRAFT"),
    [menus],
  );
  const nightCount = nights.filter((n) => n.status !== "CANCELLED").length;

  function resetForm() {
    setEditingId(null);
    setName("");
    setCourses([]);
    setNotes("");
    setCategories(["WEEKLY"]);
    setCostPerHead("");
    setDietaryType("NON_VEGETARIAN");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
    setError(null);
  }

  function openEdit(menu: MenuRow) {
    if (menuStatus(menu) === "PUBLISHED") {
      setError(
        "This menu is live and locked. Add a new package if the food changes.",
      );
      return;
    }
    setEditingId(menu.id);
    setName(menu.name.replace(/\s*\(draft\)\s*/i, "").trim());
    setCourses(menuCourses(menu));
    setNotes(menuNotes(menu));
    setCategories(menuCategories(menu));
    setDietaryType(
      (menu.dietaryType as "VEGETARIAN" | "NON_VEGETARIAN" | "VEGAN") ||
        "NON_VEGETARIAN",
    );
    setCostPerHead(String(menu.costPerHead));
    setShowForm(true);
    setError(null);
  }

  async function saveMenu(as: "DRAFT" | "PUBLISHED") {
    setError(null);
    const cost = Number(costPerHead);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (courses.length === 0) {
      setError("Add at least one course.");
      return;
    }
    if (categories.length === 0) {
      setError("Pick at least one table type.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError("Kitchen cost per head is required.");
      return;
    }
    const description = buildMenuDescription({
      courses,
      notes,
      categories,
      status: as,
    });
    if (description.length > 500) {
      setError(
        `Menu details are ${description.length} characters — trim courses or notes to 500 max.`,
      );
      return;
    }
    setBusy(true);
    try {
      if (mockMode) {
        if (editingId) {
          const updated: MenuRow = {
            id: editingId,
            venueId: venueId!,
            name: name.trim(),
            description,
            dietaryType,
            costPerHead: cost,
            categories,
            publishStatus: as,
          };
          setLocalMenus(menus.map((m) => (m.id === editingId ? updated : m)));
        } else {
          const row: MenuRow = {
            id: `menu-${Date.now()}`,
            venueId: venueId!,
            name: name.trim(),
            description,
            dietaryType,
            costPerHead: cost,
            categories,
            publishStatus: as,
          };
          setLocalMenus([row, ...menus]);
        }
        setShowForm(false);
        resetForm();
        return;
      }
      if (editingId) {
        setError("API can’t edit yet — create a new draft instead.");
        return;
      }
      if (!canPublish) {
        throw new Error("NYTO-curated venue — menus are published in Admin.");
      }
      const token = await getToken();
      if (!token || !venueId) throw new Error("Not signed in");
      await createMenu(token, venueId, {
        name: name.trim(),
        description,
        dietaryType,
        costPerHead: cost,
      });
      setLocalMenus(null);
      await menusRes.reload();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save menu");
    } finally {
      setBusy(false);
    }
  }

  function publishExisting(menu: MenuRow) {
    if (!mockMode) {
      setError(
        "Live API can’t update drafts yet — open New menu, fill the same package, and choose Publish & lock.",
      );
      return;
    }
    setLocalMenus(
      menus.map((m) => (m.id === menu.id ? withMenuStatus(m, "PUBLISHED") : m)),
    );
  }

  const loading = menusRes.loading && !localMenus;

  return (
    <div className="v-rise mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Kitchen"
        title="Set menus"
        description="Food packages for your tables. Draft freely, publish to lock for guests, then reuse on as many nights as you need."
        action={
          canPublish || mockMode ? (
            <Button
              type="button"
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  resetForm();
                } else openCreate();
              }}
            >
              {showForm ? "Close" : "New menu"}
            </Button>
          ) : undefined
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
            label="Live packages"
            value={live.length}
            meta={`${menus.length} total in catalog`}
            progress={menus.length ? (live.length / menus.length) * 100 : 0}
            hint="Published · locked for guests"
            tone="success"
          />
          <KpiCard
            label="Drafts"
            value={drafts.length}
            meta="Kitchen only · not in app"
            progress={menus.length ? (drafts.length / menus.length) * 100 : 0}
            hint="Edit until you publish"
            tone="warning"
          />
          <KpiCard
            label="Nights using them"
            value={nightCount}
            meta="One menu → many nights"
            progress={Math.min(100, nightCount * 12)}
            hint="Reuse freely after publish"
            tone="accent"
          />
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void saveMenu("DRAFT");
          }}
          className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-md)]"
        >
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
            {editingId ? "Edit draft" : "New menu"}
          </p>
          <p className="mt-1 text-[14px] text-text-muted">
            Guests only see this after Publish.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hyderabadi long table"
                required
                className="h-12 text-[16px]"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Table types</Label>
              <CategoryPicker value={categories} onChange={setCategories} />
            </div>
            <div className="sm:col-span-2">
              <Label>Courses</Label>
              <TagInput
                value={courses}
                onChange={setCourses}
                placeholder="Course, press Enter"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Note (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="One line for the room"
                className="min-h-[64px]"
              />
            </div>
            <div>
              <Label>Dietary</Label>
              <Select
                value={dietaryType}
                onChange={(e) =>
                  setDietaryType(
                    e.target.value as
                      | "VEGETARIAN"
                      | "NON_VEGETARIAN"
                      | "VEGAN",
                  )
                }
              >
                <option value="NON_VEGETARIAN">Non-veg</option>
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
              </Select>
            </div>
            <div>
              <Label>Kitchen cost / head (₹)</Label>
              <Input
                inputMode="numeric"
                value={costPerHead}
                onChange={(e) => setCostPerHead(e.target.value)}
                placeholder="899"
                required
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" disabled={busy}>
              Save draft
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void saveMenu("PUBLISHED")}
            >
              Publish & lock
            </Button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Live packages
          </h2>
          <p className="text-[13px] text-text-faint">
            {live.length} locked · reusable
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-48" />
        ) : live.length === 0 && drafts.length === 0 ? (
          <EmptyState
            title="No menus yet"
            body="Create a draft, publish when ready, then schedule nights with that package."
          />
        ) : live.length === 0 ? (
          <EmptyState
            title="Nothing live yet"
            body="Publish a draft below to lock it for guests."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
            <div className="hidden grid-cols-[1.2fr_1.6fr_0.9fr_0.7fr_auto] gap-3 border-b border-border-subtle bg-bg-soft/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint md:grid">
              <span>Menu</span>
              <span>On the plate</span>
              <span>Meta</span>
              <span>Nights</span>
              <span className="text-right">Action</span>
            </div>
            <ul>
              {live.map((m) => {
                const plate = menuCourses(m);
                const cats = menuCategories(m);
                const note = menuNotes(m);
                const used = nightsByMenu.get(m.id) ?? 0;
                return (
                  <li
                    key={m.id}
                    className="grid gap-2 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1.6fr_0.9fr_0.7fr_auto] md:items-center md:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">
                        {m.name}
                      </p>
                      {note ? (
                        <p className="mt-0.5 truncate text-[12px] text-text-faint">
                          {note}
                        </p>
                      ) : null}
                      <div className="mt-1.5 md:hidden">
                        <Badge tone="success">Live · locked</Badge>
                      </div>
                    </div>
                    <p className="text-[14px] leading-snug text-text">
                      {plate.join(" · ") || "—"}
                    </p>
                    <div>
                      <p className="text-[13px] font-medium text-text-muted">
                        {dietaryLabel(m.dietaryType)}
                      </p>
                      <p className="text-[12px] text-text-faint">
                        {cats.map((c) => tableTypeLabel(c)).join(" · ") || "—"}
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-ink">
                        {moneyInr(m.costPerHead)}
                        <span className="font-medium text-text-faint">
                          {" "}
                          / head
                        </span>
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-ink">
                      {used}
                      <span className="block text-[12px] font-medium text-text-faint">
                        night{used === 1 ? "" : "s"}
                      </span>
                    </p>
                    <div className="md:justify-self-end">
                      <Link
                        href={`/nights?menuId=${encodeURIComponent(m.id)}`}
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 text-[13px]"
                        >
                          Schedule night
                        </Button>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {drafts.length > 0 ? (
        <section className="mt-8 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
              Drafts
            </h2>
            <p className="text-[13px] text-text-faint">
              {drafts.length} not visible to guests
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
            <div className="hidden grid-cols-[1.2fr_1.6fr_0.9fr_auto] gap-3 border-b border-border-subtle bg-bg-soft/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-faint md:grid">
              <span>Menu</span>
              <span>On the plate</span>
              <span>Cost</span>
              <span className="text-right">Actions</span>
            </div>
            <ul>
              {drafts.map((m) => {
                const plate = menuCourses(m);
                return (
                  <li
                    key={m.id}
                    className="grid gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_1.6fr_0.9fr_auto] md:items-center"
                  >
                    <div>
                      <p className="text-[15px] font-semibold text-ink">
                        {m.name.replace(/\s*\(draft\)\s*/i, "")}
                      </p>
                      <div className="mt-1.5">
                        <Badge tone="warning">Draft</Badge>
                      </div>
                    </div>
                    <p className="text-[14px] leading-snug text-text">
                      {plate.join(" · ") || "No courses"}
                    </p>
                    <p className="text-[14px] font-semibold text-ink">
                      {moneyInr(m.costPerHead)}
                      <span className="block text-[12px] font-medium text-text-faint">
                        {dietaryLabel(m.dietaryType)} · / head
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10 text-[13px]"
                        disabled={busy}
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        className="h-10 text-[13px]"
                        disabled={busy}
                        onClick={() => publishExisting(m)}
                      >
                        Publish
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
