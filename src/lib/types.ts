export type VenueStaffRole = "OWNER" | "MANAGER" | "STAFF";

export type VenueUser = {
  id: string;
  email: string;
  fullName?: string | null;
  firstName?: string | null;
  role: "VENUE_STAFF" | "ADMIN" | string;
};

export type VenueRow = {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  address?: string | null;
  hostedBy: "NYTO" | "PARTNER" | string;
  isActive?: boolean;
  staffRole?: VenueStaffRole;
};

export type MenuRow = {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  dietaryType: "VEGETARIAN" | "NON_VEGETARIAN" | "VEGAN" | string;
  costPerHead: number;
  /** Table categories this menu is built for (Weekly / Women-led / Couples / Singles). */
  categories?: Array<"WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES" | string>;
  createdAt?: string;
};

export type NightMenuRef = {
  id: string;
  name: string;
  description?: string | null;
  dietaryType?: string | null;
};

export type NightRow = {
  id: string;
  venueId: string;
  startsAt: string;
  priceTier: "DAYTIME" | "EVENING" | string;
  seatPrice: number;
  capacity: number;
  status: "OPEN" | "FULL" | "CANCELLED" | "CLOSED" | string;
  genderPreference?: string | null;
  tableType?: string | null;
  paymentType?: string | null;
  vibeCopy?: string | null;
  inclusions?: string[];
  menu: NightMenuRef | null;
  seatsTaken: number;
  seatsLeft: number;
};

export type DoorBooking = {
  id: string;
  status: "CONFIRMED" | "ATTENDED" | "NO_SHOW" | string;
  seatsBooked: number;
  checkInCode: string | null;
  checkedInAt: string | null;
  amountPaid: number | null;
  paidAt: string | null;
  user: {
    id: string;
    firstName: string | null;
    fullName: string | null;
    phone: string | null;
  };
  table: {
    id: string;
    startsAt: string;
    status: string;
    seatPrice: number;
  };
  payment: {
    id: string;
    status: string;
    amount: number;
    method: string | null;
  } | null;
};

export type ApiErrorBody = {
  error?: string;
  message?: string;
};
