"use client";

import {
  TABLE_CATEGORIES,
  type TableCategory,
} from "@/lib/menu-meta";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: TableCategory[];
  onChange: (next: TableCategory[]) => void;
}) {
  function toggle(id: TableCategory) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TABLE_CATEGORIES.map((cat) => {
        const on = value.includes(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            className={`rounded-lg border px-3.5 py-2 text-[14px] font-semibold transition ${
              on
                ? "border-accent bg-accent-wash text-accent-deep"
                : "border-border bg-white text-text-muted hover:border-accent/35 hover:text-ink"
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
