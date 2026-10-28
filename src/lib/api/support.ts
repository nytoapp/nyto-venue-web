import { apiRequest } from "@/lib/api/client";

export type SupportTicket = {
  id: string;
  subject: string;
  category: "DOOR" | "BOOKING" | "NIGHT" | "PAYMENT" | "FEEDBACK" | "OTHER";
  message: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  createdAt: string;
  source?: string;
};

export async function listSupportTickets(token: string, venueId: string) {
  return apiRequest<{ ok: true; tickets: SupportTicket[] }>(
    `/venue/${venueId}/support`,
    { token },
  );
}

export async function createSupportTicket(
  token: string,
  venueId: string,
  body: {
    subject: string;
    category: SupportTicket["category"];
    message: string;
  },
) {
  return apiRequest<{ ok: true; ticket: SupportTicket }>(
    `/venue/${venueId}/support`,
    { method: "POST", token, body },
  );
}
