"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/ui/Page";
import {
  createSupportTicket,
  listSupportTickets,
  type SupportTicket,
} from "@/lib/api/support";
import {
  categoryLabel,
  loadTickets,
  MOCK_TICKETS,
} from "@/lib/mock/support";
import { useAuth } from "@/providers/auth-provider";
import { useVenue } from "@/providers/venue-provider";

function statusTone(
  s: SupportTicket["status"],
): "accent" | "warning" | "success" {
  if (s === "OPEN") return "accent";
  if (s === "IN_REVIEW") return "warning";
  return "success";
}

function statusLabel(s: SupportTicket["status"]): string {
  if (s === "OPEN") return "Sent to NYTO";
  if (s === "IN_REVIEW") return "Ops reviewing";
  return "Resolved";
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default function SupportPage() {
  const { mockMode, getToken } = useAuth();
  const { venue } = useVenue();
  const venueId = venue?.id;
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<SupportTicket["category"]>("DOOR");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentFlash, setSentFlash] = useState<string | null>(null);

  async function reload() {
    if (!venueId) return;
    setLoading(true);
    setError(null);
    try {
      if (mockMode) {
        setTickets(loadTickets());
        return;
      }
      const token = await getToken();
      if (!token) throw new Error("Not signed in");
      const res = await listSupportTickets(token, venueId);
      setTickets(res.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, mockMode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !venueId) return;
    setBusy(true);
    setError(null);
    try {
      if (mockMode) {
        const ticket: SupportTicket = {
          id: `t-${Date.now()}`,
          subject: subject.trim(),
          category,
          message: message.trim(),
          status: "OPEN",
          createdAt: new Date().toISOString(),
        };
        setTickets([ticket, ...tickets]);
        setSentFlash("Saved in this browser (demo) — live mode reaches Admin.");
      } else {
        const token = await getToken();
        if (!token) throw new Error("Not signed in");
        const res = await createSupportTicket(token, venueId, {
          subject: subject.trim(),
          category,
          message: message.trim(),
        });
        setTickets([res.ticket, ...tickets]);
        setSentFlash("Sent to NYTO ops — visible in Admin Guest Experience.");
      }
      setSubject("");
      setMessage("");
      setCategory("DOOR");
      setShowForm(false);
      window.setTimeout(() => setSentFlash(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  const list = tickets.length ? tickets : mockMode ? MOCK_TICKETS : [];

  return (
    <div className="v-rise mx-auto max-w-5xl">
      <PageHeader
        eyebrow="NYTO operations"
        title="Contact NYTO"
        description={`Send a problem for ${venue?.name ?? "your venue"} — check-in issues, paid-night cancels, guest disputes. Don’t invent refunds yourself.`}
        action={
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "New request"}
          </Button>
        }
      />

      <p className="mt-4 rounded-xl border border-border bg-white px-4 py-3 text-[13px] text-text-muted shadow-[var(--shadow-sm)]">
        Guest stuck at check-in? Seat them if you can verify name/phone, then
        file a <span className="font-semibold text-ink">Check-in</span> request.
        {mockMode
          ? " Demo mode keeps tickets in this browser only."
          : " Live requests sync to NYTO Admin."}
      </p>

      {error ? (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      ) : null}

      {sentFlash ? (
        <div className="mt-4 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-[13px] font-medium text-success">
          {sentFlash}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-md)]"
        >
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Guest code not working — Ananya"
              required
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as SupportTicket["category"])
              }
            >
              <option value="DOOR">Check-in / arrivals</option>
              <option value="BOOKING">Guest booking</option>
              <option value="NIGHT">Night inventory</option>
              <option value="PAYMENT">Payment / refund</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <Label>Details</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder="What happened, who, which night…"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send to NYTO"}
          </Button>
        </form>
      ) : null}

      <div className="mt-8 space-y-3">
        {loading && !mockMode ? (
          <p className="text-[13px] text-text-muted">Loading…</p>
        ) : list.length === 0 ? (
          <EmptyState
            title="No requests yet"
            body="File a check-in or payment issue when something breaks on the floor."
          />
        ) : (
          list.map((t) => (
            <article
              key={t.id}
              className="rounded-2xl border border-border bg-white px-5 py-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-semibold text-ink">
                  {t.subject}
                </h3>
                <Badge tone={statusTone(t.status)}>
                  {statusLabel(t.status)}
                </Badge>
              </div>
              <p className="mt-1 text-[12px] text-text-faint">
                {categoryLabel(t.category)} · {formatWhen(t.createdAt)}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-text-muted">
                {t.message}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
