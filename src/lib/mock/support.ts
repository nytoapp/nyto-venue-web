export type SupportTicket = {
  id: string;
  subject: string;
  category: "DOOR" | "BOOKING" | "NIGHT" | "PAYMENT" | "OTHER";
  message: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  createdAt: string;
};

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "t1",
    subject: "Guest arrived without check-in code",
    category: "DOOR",
    message:
      "Guest said the app wouldn’t load. We seated them after verifying name + phone with NYTO ops chat.",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "t2",
    subject: "Need capacity bump for Saturday couples night",
    category: "NIGHT",
    message:
      "Can we open 2 more seats on the couples night? Waitlist interest is high.",
    status: "IN_REVIEW",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "t3",
    subject: "Guest phone on booking doesn’t match ID at door",
    category: "BOOKING",
    message:
      "Meera Iyer — code FM2P9Q. She verified email. Seated after photo ID check.",
    status: "OPEN",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "t4",
    subject: "Card payment shows on guest app but lagged on door list",
    category: "PAYMENT",
    message:
      "Kabir & Nisha — code GN5R1S. They paid; we confirmed arrival. Flagging for ledger check.",
    status: "RESOLVED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

const KEY = "nyto_venue_support_tickets_v2";

export function loadTickets(): SupportTicket[] {
  if (typeof window === "undefined") return MOCK_TICKETS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return MOCK_TICKETS;
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return MOCK_TICKETS;
  }
}

export function saveTickets(tickets: SupportTicket[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(tickets));
}

export function categoryLabel(c: SupportTicket["category"]): string {
  const map = {
    DOOR: "Check-in / arrivals",
    BOOKING: "Guest booking",
    NIGHT: "Night inventory",
    PAYMENT: "Payment / refund",
    OTHER: "Other",
  };
  return map[c];
}
