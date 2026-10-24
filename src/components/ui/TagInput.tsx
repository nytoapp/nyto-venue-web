"use client";

import { KeyboardEvent, useState } from "react";

/** Chip list for “what’s included on the table”. */
export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  max = 8,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const tag = raw.trim().replace(/^·\s*/, "");
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    }
    if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white px-2.5 py-2 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--ring)]">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="inline-flex items-center gap-1 rounded-lg bg-bg-soft px-2.5 py-1.5 text-[14px] font-medium text-ink transition hover:bg-danger/5"
            title="Remove"
          >
            {tag}
            <span className="text-text-faint">×</span>
          </button>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length >= max ? "Max reached" : placeholder}
          disabled={value.length >= max}
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-text-faint"
        />
      </div>
    </div>
  );
}

export function InclusionChips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-lg border border-border bg-bg-soft px-2.5 py-1 text-[12px] font-medium text-text-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
