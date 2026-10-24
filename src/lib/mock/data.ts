import type { DoorBooking, MenuRow, NightRow, VenueRow } from "@/lib/types";

/** Demo partner venue — matches seed PARTNER kitchen. */
export const MOCK_VENUE: VenueRow = {
  id: "venue-ameerpet",
  name: "Ameerpet Kitchen",
  area: "Ameerpet",
  city: "Hyderabad",
  address: "Ameerpet Cross Roads, Hyderabad",
  hostedBy: "PARTNER",
  isActive: true,
  staffRole: "OWNER",
};

function tonightAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysFromNow(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const MOCK_MENUS: MenuRow[] = [
  {
    id: "menu-1",
    venueId: MOCK_VENUE.id,
    name: "Hyderabadi long table",
    description:
      "Welcome chai · Dum biryani · Mirchi ka salan · Double ka meetha\nBuilt for six strangers who want one shared night.\nCategories: Weekly · Couples",
    dietaryType: "NON_VEGETARIAN",
    costPerHead: 899,
    categories: ["WEEKLY", "COUPLES"],
  },
  {
    id: "menu-2",
    venueId: MOCK_VENUE.id,
    name: "Garden vegetarian",
    description:
      "Seasonal thali · Charred paneer · Millet khichdi · Jaggery pudding\nDaytime garden table.\nCategories: Women-led · Singles",
    dietaryType: "VEGETARIAN",
    costPerHead: 749,
    categories: ["WOMEN_LED", "SINGLES"],
  },
];

export const MOCK_NIGHTS: NightRow[] = [
  {
    id: "night-tonight",
    venueId: MOCK_VENUE.id,
    startsAt: tonightAt(20, 0),
    priceTier: "EVENING",
    seatPrice: 1199,
    capacity: 6,
    status: "OPEN",
    tableType: "WEEKLY",
    paymentType: "ALL_INCLUSIVE",
    vibeCopy: "Long table · strangers · one set menu",
    inclusions: [
      "Welcome chai",
      "Dum biryani",
      "Mirchi ka salan",
      "Double ka meetha",
    ],
    menu: {
      id: "menu-1",
      name: "Hyderabadi long table",
      description:
        "Welcome chai · Dum biryani · Mirchi ka salan · Double ka meetha.",
      dietaryType: "NON_VEGETARIAN",
    },
    seatsTaken: 4,
    seatsLeft: 2,
  },
  {
    id: "night-sat",
    venueId: MOCK_VENUE.id,
    startsAt: daysFromNow(2, 20),
    priceTier: "EVENING",
    seatPrice: 1299,
    capacity: 6,
    status: "OPEN",
    tableType: "COUPLES",
    paymentType: "ALL_INCLUSIVE",
    vibeCopy: "Couples table · shared courses",
    inclusions: [
      "Welcome chai",
      "Dum biryani",
      "Mirchi ka salan",
      "Double ka meetha",
    ],
    menu: {
      id: "menu-1",
      name: "Hyderabadi long table",
      description:
        "Welcome chai · Dum biryani · Mirchi ka salan · Double ka meetha.",
      dietaryType: "NON_VEGETARIAN",
    },
    seatsTaken: 2,
    seatsLeft: 4,
  },
  {
    id: "night-sun",
    venueId: MOCK_VENUE.id,
    startsAt: daysFromNow(3, 13),
    priceTier: "DAYTIME",
    seatPrice: 899,
    capacity: 6,
    status: "OPEN",
    tableType: "WOMEN_LED",
    paymentType: "ALL_INCLUSIVE",
    vibeCopy: "Daytime · women-led · garden table",
    inclusions: [
      "Seasonal thali",
      "Charred paneer",
      "Millet khichdi",
      "Jaggery pudding",
    ],
    menu: {
      id: "menu-2",
      name: "Garden vegetarian",
      description:
        "Seasonal thali · Charred paneer · Millet khichdi · Jaggery pudding.",
      dietaryType: "VEGETARIAN",
    },
    seatsTaken: 0,
    seatsLeft: 6,
  },
];

export const MOCK_BOOKINGS: DoorBooking[] = [
  {
    id: "b1",
    status: "CONFIRMED",
    seatsBooked: 1,
    checkInCode: "AK7M2P",
    checkedInAt: null,
    amountPaid: 1199,
    paidAt: new Date().toISOString(),
    user: {
      id: "u1",
      firstName: "Ananya",
      fullName: "Ananya Reddy",
      phone: "+91 98765 43210",
    },
    table: {
      id: "night-tonight",
      startsAt: tonightAt(20, 0),
      status: "OPEN",
      seatPrice: 1199,
    },
    payment: {
      id: "p1",
      status: "CAPTURED",
      amount: 1199,
      method: "UPI",
    },
  },
  {
    id: "b2",
    status: "ATTENDED",
    seatsBooked: 1,
    checkInCode: "BK4Q9R",
    checkedInAt: new Date().toISOString(),
    amountPaid: 1199,
    paidAt: new Date().toISOString(),
    user: {
      id: "u2",
      firstName: "Rahul",
      fullName: "Rahul Mehta",
      phone: "+91 91234 56780",
    },
    table: {
      id: "night-tonight",
      startsAt: tonightAt(20, 0),
      status: "OPEN",
      seatPrice: 1199,
    },
    payment: {
      id: "p2",
      status: "CAPTURED",
      amount: 1199,
      method: "CARD",
    },
  },
  {
    id: "b3",
    status: "CONFIRMED",
    seatsBooked: 2,
    checkInCode: "CX1N8T",
    checkedInAt: null,
    amountPaid: 2398,
    paidAt: new Date().toISOString(),
    user: {
      id: "u3",
      firstName: "Priya",
      fullName: "Priya & Arjun",
      phone: "+91 99887 76655",
    },
    table: {
      id: "night-tonight",
      startsAt: tonightAt(20, 0),
      status: "OPEN",
      seatPrice: 1199,
    },
    payment: {
      id: "p3",
      status: "CAPTURED",
      amount: 2398,
      method: "UPI",
    },
  },
  {
    id: "b4",
    status: "CONFIRMED",
    seatsBooked: 1,
    checkInCode: "DH3W5Y",
    checkedInAt: null,
    amountPaid: 1199,
    paidAt: new Date().toISOString(),
    user: {
      id: "u4",
      firstName: "Sneha",
      fullName: "Sneha Kapoor",
      phone: null,
    },
    table: {
      id: "night-tonight",
      startsAt: tonightAt(20, 0),
      status: "OPEN",
      seatPrice: 1199,
    },
    payment: {
      id: "p4",
      status: "CAPTURED",
      amount: 1199,
      method: "UPI",
    },
  },
];
