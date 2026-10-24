"use client";

import { useRef } from "react";

export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(length, " ").slice(0, length).split("");

  function setAt(i: number, ch: string) {
    const next = value.split("");
    while (next.length < length) next.push("");
    next[i] = ch;
    onChange(next.join("").replace(/\s/g, "").slice(0, length));
  }

  return (
    <div className="flex gap-2">
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={ch.trim()}
          className="h-12 w-11 rounded-xl border border-border bg-white text-center text-[18px] font-semibold text-ink outline-none focus:border-accent focus:shadow-[0_0_0_4px_var(--ring)]"
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i].trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, length);
            onChange(pasted);
          }}
        />
      ))}
    </div>
  );
}
