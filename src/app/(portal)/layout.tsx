"use client";

import { VenueShell } from "@/components/shell/VenueShell";
import { useAuth } from "@/providers/auth-provider";
import { VenueProvider } from "@/providers/venue-provider";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-muted">
        Opening floor…
      </div>
    );
  }

  if (!user) return null;

  return (
    <VenueProvider>
      <VenueShell>{children}</VenueShell>
    </VenueProvider>
  );
}
