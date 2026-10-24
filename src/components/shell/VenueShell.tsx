"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

const NAV = [
  { href: "/tonight", label: "Tonight", hint: "Arrivals & KPIs" },
  { href: "/door", label: "Door", hint: "Check-in codes" },
  { href: "/nights", label: "Nights", hint: "Tables + inclusions" },
  { href: "/menus", label: "Menus", hint: "Courses & cost" },
  { href: "/support", label: "Support", hint: "Ask Admin" },
];

export function VenueShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, mockMode } = useAuth();
  const { venue, venues, selectVenue, canPublish } = useVenue();

  return (
    <div className="relative z-[1] flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[252px] shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-text">
        <div className="px-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[12px] font-bold text-white">
              N
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
                NYTO Venue
              </p>
              <p className="text-[13px] font-semibold leading-tight text-white">
                Partner floor
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
            <p className="truncate text-[15px] font-semibold text-white">
              {venue?.name ?? "Select venue"}
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
                <span className="block text-[14px] font-semibold">{item.label}</span>
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
      </aside>

      <main className="min-w-0 flex-1 px-6 py-7 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
