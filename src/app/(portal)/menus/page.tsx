"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Page";
import { InclusionChips, TagInput } from "@/components/ui/TagInput";
import { createMenu, listMenus } from "@/lib/api/venue";
import { dietaryLabel, moneyInr, tableTypeLabel } from "@/lib/format";
import { useVenueResource } from "@/lib/hooks/useVenueResource";
import {
  buildMenuDescription,
  hydrateMenu,
  menuCategories,
  menuCourses,
  menuNotes,
  type TableCategory,
} from "@/lib/menu-meta";
import { MOCK_MENUS } from "@/lib/mock/data";
import type { MenuRow } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

export default function MenusPage() {
  const { mockMode, getToken } = useAuth();
  const { venue, canPublish } = useVenue();
  const venueId = venue?.id;
  const [showForm, setShowForm] = useState(false);
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

  const menus = (localMenus ?? menusRes.data ?? []).map(hydrateMenu);

  function resetForm() {
    setName("");
    setCourses([]);
    setNotes("");
    setCategories(["WEEKLY"]);
    setCostPerHead("");
    setDietaryType("NON_VEGETARIAN");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cost = Number(costPerHead);
    if (!name.trim()) {
      setError("Menu name is required.");
      return;
    }
    if (courses.length === 0) {
      setError("Add what guests get (at least one course / inclusion).");
      return;
    }
    if (categories.length === 0) {
      setError("Pick at least one category (Weekly, Women-led, Couples, or Singles).");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError("Kitchen cost per head (₹) is required.");
      return;
    }
    const description = buildMenuDescription({
      courses,
      notes,
      categories,
    });
    setBusy(true);
    try {
      if (mockMode) {
        const row: MenuRow = {
          id: `menu-${Date.now()}`,
          venueId: venueId!,
          name: name.trim(),
          description,
          dietaryType,
          costPerHead: cost,
          categories,
        };
        setLocalMenus([row, ...menus]);
        setShowForm(false);
        resetForm();
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

  return (
    <div className="v-rise mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Experiences"
        title="Menus"
        description="What guests eat, plus which table categories it fits (Women-led, Couples, Singles…). Attach when you publish a Night."
        action={
          canPublish || mockMode ? (
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Close" : "New menu"}
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onCreate}
          className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)] sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hyderabadi long table"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Categories</Label>
            <p className="mb-2 text-[12px] text-text-faint">
              Who this menu is built for — same categories as Nights / guest app
              (Weekly, Women-led, Couples, Singles). Pick one or more.
            </p>
            <CategoryPicker value={categories} onChange={setCategories} />
          </div>

          <div className="sm:col-span-2">
            <Label>What’s on the plate</Label>
            <p className="mb-2 text-[12px] text-text-faint">
              Add each course / drink. These carry into Nights when you select
              this menu.
            </p>
            <TagInput
              value={courses}
              onChange={setCourses}
              placeholder="e.g. Dum biryani"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Extra note (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Built for six strangers who want one shared night."
              className="min-h-[72px]"
            />
          </div>
          <div>
            <Label>Dietary</Label>
            <Select
              value={dietaryType}
              onChange={(e) =>
                setDietaryType(
                  e.target.value as "VEGETARIAN" | "NON_VEGETARIAN" | "VEGAN",
                )
              }
            >
              <option value="NON_VEGETARIAN">Non-veg</option>
              <option value="VEGETARIAN">Vegetarian</option>
              <option value="VEGAN">Vegan</option>
            </Select>
          </div>
          <div>
            <Label>Cost per head (₹)</Label>
            <Input
              inputMode="numeric"
              value={costPerHead}
              onChange={(e) => setCostPerHead(e.target.value)}
              placeholder="899"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save menu"}
            </Button>
          </div>
        </form>
      ) : null}

      <section className="mt-8">
        {menusRes.loading && !localMenus ? (
          <Skeleton className="h-40" />
        ) : menus.length === 0 ? (
          <EmptyState
            title="No menus yet"
            body="Create the experience you’ll attach when you publish a night."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {menus.map((m) => {
              const chips = menuCourses(m);
              const cats = menuCategories(m);
              const notesLine = menuNotes(m);
              return (
                <li
                  key={m.id}
                  className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
                      {m.name}
                    </h2>
                    <Badge tone="accent">{dietaryLabel(m.dietaryType)}</Badge>
                  </div>
                  {cats.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cats.map((c) => (
                        <Badge key={c} tone="neutral">
                          {tableTypeLabel(c)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <InclusionChips items={chips} />
                  {notesLine ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
                      {notesLine}
                    </p>
                  ) : null}
                  <p className="mt-4 text-[12px] font-semibold text-text-faint">
                    Kitchen cost · {moneyInr(m.costPerHead)} / head
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
