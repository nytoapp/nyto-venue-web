import type { MenuRow } from "@/lib/types";
import { tableTypeLabel } from "@/lib/format";

export type TableCategory = "WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES";
export type MenuPublishStatus = "DRAFT" | "PUBLISHED";

export const TABLE_CATEGORIES: { id: TableCategory; label: string }[] = [
  { id: "WEEKLY", label: "Weekly" },
  { id: "WOMEN_LED", label: "Women-led" },
  { id: "COUPLES", label: "Couples" },
  { id: "SINGLES", label: "Singles" },
];

const CAT_LINE = /^Categories:\s*(.+)$/im;
const STATUS_LINE = /^Status:\s*(Draft|Published)$/im;

/**
 * Encode courses + notes into description.
 * Categories/status are first-class API columns — only embed them when
 * `legacyEncode` is true (mock / pre-migration compat).
 */
export function buildMenuDescription(input: {
  courses: string[];
  notes?: string;
  categories: TableCategory[];
  status?: MenuPublishStatus;
  legacyEncode?: boolean;
}): string {
  const lines: string[] = [];
  if (input.courses.length) lines.push(input.courses.join(" · "));
  if (input.notes?.trim()) lines.push(input.notes.trim());
  if (input.legacyEncode) {
    if (input.categories.length) {
      lines.push(
        `Categories: ${input.categories.map((c) => tableTypeLabel(c)).join(" · ")}`,
      );
    }
    lines.push(
      `Status: ${input.status === "DRAFT" ? "Draft" : "Published"}`,
    );
  }
  return lines.join("\n");
}

export function parseMenuDescription(description: string | null | undefined): {
  courses: string[];
  notes: string;
  categories: TableCategory[];
  status: MenuPublishStatus;
} {
  if (!description?.trim()) {
    return { courses: [], notes: "", categories: [], status: "DRAFT" };
  }
  const lines = description.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  let categories: TableCategory[] = [];
  let status: MenuPublishStatus = "PUBLISHED"; // legacy rows without Status line = live
  const bodyLines: string[] = [];

  for (const line of lines) {
    const cat = line.match(CAT_LINE);
    const st = line.match(STATUS_LINE);
    if (cat) {
      categories = parseCategoryLabels(cat[1]);
    } else if (st) {
      status = st[1].toLowerCase() === "draft" ? "DRAFT" : "PUBLISHED";
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

  return { courses, notes, categories, status };
}

function parseCategoryLabels(raw: string): TableCategory[] {
  const out: TableCategory[] = [];
  const lower = raw.toLowerCase();
  if (/\bwomen[- ]?led\b/.test(lower)) out.push("WOMEN_LED");
  if (/\bcouples?\b/.test(lower)) out.push("COUPLES");
  if (/\bsingles?\b/.test(lower)) out.push("SINGLES");
  if (/\bweekly\b/.test(lower)) out.push("WEEKLY");
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

export function menuStatus(menu: MenuRow): MenuPublishStatus {
  if (menu.publishStatus === "DRAFT" || menu.publishStatus === "PUBLISHED") {
    return menu.publishStatus;
  }
  return parseMenuDescription(menu.description).status;
}

export function withMenuStatus(
  menu: MenuRow,
  status: MenuPublishStatus,
): MenuRow {
  const parsed = parseMenuDescription(menu.description);
  const description = buildMenuDescription({
    courses: parsed.courses,
    notes: parsed.notes,
    categories: (menu.categories?.length
      ? menu.categories
      : parsed.categories) as TableCategory[],
    status,
  });
  return { ...menu, description, publishStatus: status };
}

/** Hydrate API/mock menus with parsed categories + publish status. */
export function hydrateMenu(menu: MenuRow): MenuRow {
  const parsed = parseMenuDescription(menu.description);
  return {
    ...menu,
    categories: menu.categories?.length ? menu.categories : parsed.categories,
    publishStatus: menu.publishStatus ?? parsed.status,
  };
}
