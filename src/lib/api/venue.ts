import { apiRequest } from "@/lib/api/client";
import type { DoorBooking, MenuRow, NightRow, VenueRow } from "@/lib/types";

export async function listMyVenues(token: string) {
  return apiRequest<{ ok: true; venues: VenueRow[] }>("/venue/me/venues", {
    token,
  });
}

export async function listMenus(token: string, venueId: string) {
  return apiRequest<{ ok: true; menus: MenuRow[] }>(
    `/venue/${venueId}/menus`,
    { token },
  );
}

export async function createMenu(
  token: string,
  venueId: string,
  body: {
    name: string;
    description?: string;
    dietaryType: "VEGETARIAN" | "NON_VEGETARIAN" | "VEGAN";
    costPerHead: number;
    publishStatus?: "DRAFT" | "PUBLISHED";
    categories?: Array<"WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES">;
  },
) {
  return apiRequest<{ ok: true; menu: MenuRow }>(`/venue/${venueId}/menus`, {
    token,
    method: "POST",
    body,
  });
}

export async function patchMenu(
  token: string,
  venueId: string,
  menuId: string,
  body: {
    name?: string;
    description?: string;
    dietaryType?: "VEGETARIAN" | "NON_VEGETARIAN" | "VEGAN";
    costPerHead?: number;
    publishStatus?: "DRAFT" | "PUBLISHED";
    categories?: Array<"WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES">;
  },
) {
  return apiRequest<{ ok: true; menu: MenuRow }>(
    `/venue/${venueId}/menus/${menuId}`,
    {
      token,
      method: "PATCH",
      body,
    },
  );
}

export async function listNights(token: string, venueId: string) {
  return apiRequest<{ ok: true; tables: NightRow[] }>(
    `/venue/${venueId}/tables`,
    { token },
  );
}

export async function createNight(
  token: string,
  venueId: string,
  body: {
    menuId?: string;
    startsAt: string;
    priceTier: "DAYTIME" | "EVENING";
    seatPrice: number;
    capacity?: number;
    tableType?: "WEEKLY" | "WOMEN_LED" | "COUPLES" | "SINGLES";
    paymentType?: "ALL_INCLUSIVE" | "PAY_OWN_BILL";
    vibeCopy?: string;
    inclusions?: string[];
  },
) {
  return apiRequest<{ ok: true; table: NightRow }>(
    `/venue/${venueId}/tables`,
    { token, method: "POST", body },
  );
}

export async function patchNight(
  token: string,
  venueId: string,
  tableId: string,
  body: { status?: "OPEN" | "CANCELLED"; seatPrice?: number; capacity?: number },
) {
  return apiRequest<{ ok: true; table: NightRow }>(
    `/venue/${venueId}/tables/${tableId}`,
    { token, method: "PATCH", body },
  );
}

export async function listDoorBookings(token: string, venueId: string) {
  return apiRequest<{ ok: true; bookings: DoorBooking[] }>(
    `/venue/${venueId}/bookings`,
    { token },
  );
}

export async function checkInGuest(
  token: string,
  venueId: string,
  checkInCode: string,
) {
  return apiRequest<{
    ok: true;
    booking?: DoorBooking;
    message?: string;
  }>(`/venue/${venueId}/check-in`, {
    token,
    method: "POST",
    body: { checkInCode },
  });
}
