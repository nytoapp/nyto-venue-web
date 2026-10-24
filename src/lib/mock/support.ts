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
    message: "Can we open 2 more seats on 26 Oct 20:00? Waitlist interest is high.",
    status: "IN_REVIEW",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const KEY = "nyto_venue_support_tickets";

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
    DOOR: "Door / check-in",
    BOOKING: "Guest booking",
    NIGHT: "Night inventory",
    PAYMENT: "Payment / refund",
    OTHER: "Other",
  };
  return map[c];
}
