"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
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
    setLocalMenus(
      menus.map((m) => (m.id === menu.id ? withMenuStatus(m, "PUBLISHED") : m)),
    );
  }

  const costPreview = Number(costPerHead);

  return (
    <div className="v-rise mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Kitchen"
        title="Menus"
        description="Build a food package. Publish locks it. Reuse it on any night."
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
        <div className="mt-5">
          <ErrorBanner message={error} />
        </div>
      ) : null}

      {showForm ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-sm)]">
          <div className="grid lg:grid-cols-5">
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void saveMenu("DRAFT");
              }}
              className="space-y-5 p-7 lg:col-span-3 lg:border-r lg:border-border-subtle"
            >
              <div>
                <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                  {editingId ? "Edit draft" : "New menu"}
                </p>
                <p className="mt-1 text-[14px] text-text-muted">
                  Guests only see it after you publish.
                </p>
              </div>

              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hyderabadi long table"
                  required
                  className="h-12 text-[16px]"
                />
              </div>

              <div>
                <Label>Table types</Label>
                <CategoryPicker value={categories} onChange={setCategories} />
              </div>

              <div>
                <Label>Courses</Label>
                <TagInput
                  value={courses}
                  onChange={setCourses}
                  placeholder="Type a course, press Enter"
                />
              </div>

              <div>
                <Label>Note (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="One line for the room"
                  className="min-h-[72px] text-[15px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Cost / head (₹)</Label>
                  <Input
                    inputMode="numeric"
                    value={costPerHead}
                    onChange={(e) => setCostPerHead(e.target.value)}
                    placeholder="899"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" variant="secondary" disabled={busy}>
                  Save draft
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveMenu("PUBLISHED")}
                >
                  Publish
                </Button>
              </div>
            </form>

            <div className="bg-bg-soft p-7 lg:col-span-2">
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                Preview
              </p>
              <p className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-ink">
                {name.trim() || "Untitled"}
              </p>
              <p className="mt-2 text-[14px] text-text-muted">
                {dietaryLabel(dietaryType)}
                {categories.length
                  ? ` · ${categories.map((c) => tableTypeLabel(c)).join(" · ")}`
                  : ""}
              </p>
              {courses.length ? (
                <ul className="mt-5 space-y-2.5">
                  {courses.map((c) => (
                    <li key={c} className="text-[16px] leading-snug text-ink">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-[15px] text-text-faint">No courses yet</p>
              )}
              {notes.trim() ? (
                <p className="mt-4 text-[15px] leading-relaxed text-text-muted">
                  {notes.trim()}
                </p>
              ) : null}
              <p className="mt-6 text-[16px] font-semibold text-ink">
                {Number.isFinite(costPreview) && costPerHead !== ""
                  ? `${moneyInr(costPreview)} / head`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-8">
        {menusRes.loading && !localMenus ? (
          <Skeleton className="h-48" />
        ) : menus.length === 0 ? (
          <EmptyState
            title="No menus yet"
            body="Create a draft, publish when ready, then schedule nights with that package."
          />
        ) : (
          <div className="space-y-8">
            {live.length > 0 ? (
              <div>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">
                    Live
                    <span className="ml-2 text-[16px] font-medium text-text-faint">
                      {live.length}
                    </span>
                  </h2>
                  <p className="text-[14px] text-text-muted">
                    Locked · reuse on any night
                  </p>
                </div>
                <ul className="grid gap-4 md:grid-cols-2">
                  {live.map((m) => {
                    const plate = menuCourses(m);
                    const cats = menuCategories(m);
                    const note = menuNotes(m);
                    const used = nightsByMenu.get(m.id) ?? 0;
                    return (
                      <li
                        key={m.id}
                        className="flex flex-col rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-sm)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-success">
                              Live · locked
                            </p>
                            <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-ink">
                              {m.name}
                            </h3>
                          </div>
                        </div>

                        <p className="mt-4 text-[16px] leading-relaxed text-text">
                          {plate.join(" · ") || "—"}
                        </p>
                        {note ? (
                          <p className="mt-2 text-[15px] leading-relaxed text-text-muted">
                            {note}
                          </p>
                        ) : null}

                        <p className="mt-4 text-[14px] font-medium text-text-muted">
                          {dietaryLabel(m.dietaryType)}
                          {cats.length
                            ? ` · ${cats.map((c) => tableTypeLabel(c)).join(" · ")}`
                            : ""}
                          {" · "}
                          {moneyInr(m.costPerHead)} / head
                          {" · "}
                          {used} night{used === 1 ? "" : "s"}
                        </p>

                        <div className="mt-auto pt-5">
                          <Link
                            href={`/nights?menuId=${encodeURIComponent(m.id)}`}
                          >
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-11 w-full text-[14px]"
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
            ) : null}

            {drafts.length > 0 ? (
              <div>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">
                    Drafts
                    <span className="ml-2 text-[16px] font-medium text-text-faint">
                      {drafts.length}
                    </span>
                  </h2>
                  <p className="text-[14px] text-text-muted">
                    Not visible to guests
                  </p>
                </div>
                <ul className="space-y-3">
                  {drafts.map((m) => {
                    const plate = menuCourses(m);
                    return (
                      <li
                        key={m.id}
                        className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-warning">
                            Draft
                          </p>
                          <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-ink">
                            {m.name.replace(/\s*\(draft\)\s*/i, "")}
                          </h3>
                          <p className="mt-2 text-[16px] leading-relaxed text-text">
                            {plate.join(" · ") || "No courses"}
                          </p>
                          <p className="mt-2 text-[14px] font-medium text-text-muted">
                            {dietaryLabel(m.dietaryType)} ·{" "}
                            {moneyInr(m.costPerHead)} / head
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-11 px-5 text-[14px]"
                            disabled={busy}
                            onClick={() => openEdit(m)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            className="h-11 px-5 text-[14px]"
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
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
