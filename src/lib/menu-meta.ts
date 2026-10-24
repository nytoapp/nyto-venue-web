import type { MenuRow } from "@/lib/types";
import { tableTypeLabel } from "@/lib/format";

export type TableCategory = "WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES";

export const TABLE_CATEGORIES: { id: TableCategory; label: string }[] = [
  { id: "WEEKLY", label: "Weekly" },
  { id: "WOMEN_LED", label: "Women-led" },
  { id: "COUPLES", label: "Couples" },
  { id: "SINGLES", label: "Singles" },
];

const CAT_LINE = /^Categories:\s*(.+)$/im;

/** Encode courses + notes + categories into description (API has no category column yet). */
export function buildMenuDescription(input: {
  courses: string[];
  notes?: string;
  categories: TableCategory[];
}): string {
  const lines: string[] = [];
  if (input.courses.length) lines.push(input.courses.join(" · "));
  if (input.notes?.trim()) lines.push(input.notes.trim());
  if (input.categories.length) {
    lines.push(
      `Categories: ${input.categories.map((c) => tableTypeLabel(c)).join(" · ")}`,
    );
  }
  return lines.join("\n");
}

export function parseMenuDescription(description: string | null | undefined): {
  courses: string[];
  notes: string;
  categories: TableCategory[];
} {
  if (!description?.trim()) {
    return { courses: [], notes: "", categories: [] };
  }
  const lines = description.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let categories: TableCategory[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    const m = line.match(CAT_LINE);
    if (m) {
      categories = parseCategoryLabels(m[1]);
    } else {
      bodyLines.push(line);
    }
  }

  const courseLine = bodyLines[0] ?? "";
  const notes = bodyLines.slice(1).join(" ").trim();
  const courses = courseLine
    .split(/[·•|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 80)
    .slice(0, 8);

  return { courses, notes, categories };
}

function parseCategoryLabels(raw: string): TableCategory[] {
  const out: TableCategory[] = [];
  const lower = raw.toLowerCase();
  if (/\bwomen[- ]?led\b/.test(lower)) out.push("WOMEN_LED");
  if (/\bcouples?\b/.test(lower)) out.push("COUPLES");
  if (/\bsingles?\b/.test(lower)) out.push("SINGLES");
  if (/\bweekly\b/.test(lower)) out.push("WEEKLY");
  // Also accept raw enum tokens
  for (const id of ["WEEKLY", "WOMEN_LED", "COUPLES", "SINGLES"] as const) {
    if (raw.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function menuCategories(menu: MenuRow): TableCategory[] {
  if (menu.categories?.length) return menu.categories as TableCategory[];
  return parseMenuDescription(menu.description).categories;
}

export function menuCourses(menu: MenuRow): string[] {
  return parseMenuDescription(menu.description).courses;
}

export function menuNotes(menu: MenuRow): string {
  return parseMenuDescription(menu.description).notes;
}

/** Hydrate API/mock menus with parsed categories for UI. */
export function hydrateMenu(menu: MenuRow): MenuRow {
  const parsed = parseMenuDescription(menu.description);
  return {
    ...menu,
    categories: menu.categories?.length ? menu.categories : parsed.categories,
  };
}
