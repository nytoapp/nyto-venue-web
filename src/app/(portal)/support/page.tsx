"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { EmptyState, PageHeader } from "@/components/ui/Page";
import {
  categoryLabel,
  loadTickets,
  saveTickets,
  type SupportTicket,
} from "@/lib/mock/support";
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
  const { venue } = useVenue();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<SupportTicket["category"]>("DOOR");
  const [message, setMessage] = useState("");
  const [sentFlash, setSentFlash] = useState(false);

  useEffect(() => {
    setTickets(loadTickets());
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const ticket: SupportTicket = {
      id: `t-${Date.now()}`,
      subject: subject.trim(),
      category,
      message: message.trim(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    saveTickets(next);
    setSubject("");
    setMessage("");
    setCategory("DOOR");
    setShowForm(false);
    setSentFlash(true);
    window.setTimeout(() => setSentFlash(false), 4000);
  }

  return (
    <div className="v-rise mx-auto max-w-5xl">
      <PageHeader
        eyebrow="NYTO operations"
        title="Contact NYTO"
        description={`Send a problem to Admin for ${venue?.name ?? "your venue"} — check-in issues, paid-night cancels, guest disputes. Don’t invent refunds yourself.`}
        action={
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "New request"}
          </Button>
        }
      />

      <p className="mt-4 rounded-xl border border-border bg-white px-4 py-3 text-[13px] text-text-muted shadow-[var(--shadow-sm)]">
        Guest stuck at check-in? Seat them if you can verify name/phone, then
        file a <span className="font-semibold text-ink">Check-in</span> request
        so Admin has a record.
      </p>

      {sentFlash ? (
        <div className="mt-4 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-[13px] font-medium text-success">
          Sent to NYTO ops. Status updates show below.
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)]"
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
            <Label>Details for Admin</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Guest name, check-in code, night time, what you already tried…"
              required
            />
          </div>
          <Button type="submit">Send to NYTO Admin</Button>
        </form>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-[18px] font-semibold tracking-[-0.02em] text-ink">
          Your requests
        </h2>
        {tickets.length === 0 ? (
          <EmptyState
            title="No requests yet"
            body="When something needs Admin, open a request here."
          />
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-ink">
                      {t.subject}
                    </p>
                    <p className="mt-1 text-[12px] text-text-faint">
                      {categoryLabel(t.category)} · {formatWhen(t.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone(t.status)}>
                    {statusLabel(t.status)}
                  </Badge>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-text-muted">
                  {t.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
