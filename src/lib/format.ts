const IST = "en-IN";

export function moneyInr(paiseOrRupees: number | null | undefined): string {
  if (paiseOrRupees == null || Number.isNaN(paiseOrRupees)) return "—";
  // Backend stores INR whole rupees for seatPrice / amountPaid.
  return new Intl.NumberFormat(IST, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paiseOrRupees);
}

export function guestLabel(user: {
  fullName?: string | null;
  firstName?: string | null;
}): string {
  const name = (user.fullName || user.firstName || "").trim();
  return name || "Guest";
}

export function formatNightWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = new Intl.DateTimeFormat(IST, {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  }).format(d);
  const time = new Intl.DateTimeFormat(IST, {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} · ${time}`;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(IST, {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function isSameIstDay(iso: string, ref = new Date()): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(iso)) === fmt.format(ref);
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    CONFIRMED: "Waiting",
    ATTENDED: "Checked in",
    // Venue floor: waiting vs checked in. No-show is an Admin mark later.
    NO_SHOW: "Waiting",
    OPEN: "Bookable",
    FULL: "Full",
    CANCELLED: "Cancelled",
    CLOSED: "Closed",
  };
  return map[status] ?? status;
}

export function dietaryLabel(v: string): string {
  const map: Record<string, string> = {
    VEGETARIAN: "Vegetarian",
    NON_VEGETARIAN: "Non-veg",
    VEGAN: "Vegan",
  };
  return map[v] ?? v;
}

export function tableTypeLabel(v: string | null | undefined): string {
  if (!v) return "Weekly";
  const map: Record<string, string> = {
    WEEKLY: "Weekly",
    WOMEN_LED: "Women-led",
    COUPLES: "Couples",
    SINGLES: "Singles",
  };
  return map[v] ?? v;
}

export function paymentTypeLabel(v: string | null | undefined): string {
  if (!v) return "All-inclusive";
  const map: Record<string, string> = {
    ALL_INCLUSIVE: "All-inclusive",
    PAY_OWN_BILL: "Pay own bill",
  };
  return map[v] ?? v;
}

/** Which supper-table / night this booking sits on — what venue staff need at the door. */
export function bookingTableLabel(table: {
  menuName?: string | null;
  tableType?: string | null;
  startsAt: string;
}): { title: string; subtitle: string } {
  const title = table.menuName?.trim() || "Tonight’s table";
  const subtitle = [
    tableTypeLabel(table.tableType),
    formatClock(table.startsAt),
  ].join(" · ");
  return { title, subtitle };
}

/** Split menu description into chips when · / commas used. */
export function splitInclusions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[·•|,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 80)
    .slice(0, 8);
}
