"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

/** Labels a venue manager understands at a glance — not jargon. */
const NAV = [
  {
    href: "/tonight",
    label: "Today's guests",
    hint: "Who paid for tonight",
  },
  {
    href: "/door",
    label: "Check-in",
    hint: "Confirm guests at the door",
  },
  {
    href: "/nights",
    label: "Publish nights",
    hint: "Create bookable tables",
  },
  {
    href: "/menus",
    label: "Set menus",
    hint: "Build & publish packages",
  },
  {
    href: "/support",
    label: "Contact NYTO",
    hint: "Report a problem to ops",
  },
];

export function VenueShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, mockMode } = useAuth();
  const { venue, venues, selectVenue, canPublish, error, loading, reload } =
    useVenue();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const sidebar = (
    <>
      <div className="px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[12px] font-bold text-white">
              N
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
                NYTO Venue
              </p>
              <p className="text-[13px] font-semibold leading-tight text-white">
                Your venue portal
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-sidebar-muted hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="mt-5 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
          <p className="truncate text-[15px] font-semibold text-white">
            {venue?.name ?? (loading ? "Loading…" : "Select venue")}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-sidebar-muted">
            {[venue?.area, venue?.city].filter(Boolean).join(" · ") ||
              "Assigned venue"}
          </p>
        </div>
      </div>

      {venues.length > 1 ? (
        <label className="mt-3 block px-2">
          <span className="sr-only">Switch venue</span>
          <select
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[13px] text-white"
            value={venue?.id ?? ""}
            onChange={(e) => selectVenue(e.target.value)}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id} className="text-ink">
                {v.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {!canPublish && venue ? (
        <p className="mx-2 mt-3 rounded-xl bg-warning/15 px-3 py-2 text-[11px] leading-snug text-warning">
          NYTO-curated — view only. Publishing is in Admin.
        </p>
      ) : null}

      {error ? (
        <div className="mx-2 mt-3 rounded-xl bg-danger/15 px-3 py-2 text-[11px] leading-snug text-[#fda4af]">
          <p>{error}</p>
          <button
            type="button"
            className="mt-1 font-semibold underline"
            onClick={() => void reload()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && venues.length === 0 ? (
        <p className="mx-2 mt-3 rounded-xl bg-warning/15 px-3 py-2 text-[11px] leading-snug text-warning">
          No venues assigned to this account. Ask NYTO ops to add you as staff.
        </p>
      ) : null}

      <nav className="mt-5 flex flex-1 flex-col gap-0.5 px-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2.5 transition ${
                active
                  ? "bg-accent text-white shadow-[0_8px_20px_-10px_rgba(59,130,246,0.8)]"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="block text-[14px] font-semibold">
                {item.label}
              </span>
              <span
                className={`block text-[11px] ${active ? "text-white/75" : "text-sidebar-muted"}`}
              >
                {item.hint}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 pt-4">
        {mockMode ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft">
            Demo data
          </p>
        ) : null}
        <p className="truncate text-[13px] font-semibold text-white">
          {user?.fullName || "Venue staff"}
        </p>
        <p className="truncate text-[11px] text-sidebar-muted">{user?.email}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-3 text-[12px] font-semibold text-sidebar-muted hover:text-white"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="relative z-[1] flex min-h-screen">
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          aria-label="Close menu overlay"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col bg-sidebar px-3 py-5 text-sidebar-text transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-ink shadow-[var(--shadow-sm)]"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            <span className="flex flex-col gap-1">
              <span className="block h-0.5 w-4 rounded-full bg-ink" />
              <span className="block h-0.5 w-4 rounded-full bg-ink" />
              <span className="block h-0.5 w-4 rounded-full bg-ink" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">
              {venue?.name ?? "NYTO Venue"}
            </p>
            <p className="truncate text-[11px] text-text-faint">
              {NAV.find(
                (n) =>
                  pathname === n.href || pathname.startsWith(`${n.href}/`),
              )?.label ?? "Portal"}
            </p>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
