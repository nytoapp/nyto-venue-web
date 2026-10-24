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
      "Welcome chai · Dum biryani · Mirchi ka salan · Double ka meetha\nBuilt for six strangers who want one shared night.\nCategories: Weekly · Couples\nStatus: Published",
    dietaryType: "NON_VEGETARIAN",
    costPerHead: 899,
    categories: ["WEEKLY", "COUPLES"],
    publishStatus: "PUBLISHED",
  },
  {
    id: "menu-2",
    venueId: MOCK_VENUE.id,
    name: "Garden vegetarian",
    description:
      "Seasonal thali · Charred paneer · Millet khichdi · Jaggery pudding\nDaytime garden table.\nCategories: Women-led · Singles\nStatus: Published",
    dietaryType: "VEGETARIAN",
    costPerHead: 749,
    categories: ["WOMEN_LED", "SINGLES"],
    publishStatus: "PUBLISHED",
  },
  {
    id: "menu-3",
    venueId: MOCK_VENUE.id,
    name: "Coastal grill",
    description:
      "Prawn fry · Fish pulusu · Coconut rice · Elaneer payasam\nFriday singles energy.\nCategories: Singles · Weekly\nStatus: Published",
    dietaryType: "NON_VEGETARIAN",
    costPerHead: 1099,
    categories: ["SINGLES", "WEEKLY"],
    publishStatus: "PUBLISHED",
  },
  {
    id: "menu-4",
    venueId: MOCK_VENUE.id,
    name: "Monsoon thali (draft)",
    description:
      "Corn soup · Veg dum biryani · Raita · Gulab jamun\nStill tuning portions.\nCategories: Weekly\nStatus: Draft",
    dietaryType: "VEGETARIAN",
    costPerHead: 699,
    categories: ["WEEKLY"],
    publishStatus: "DRAFT",
  },
];

const tonightLong = tonightAt(20, 0);
const tonightCouples = tonightAt(20, 30);

export const MOCK_NIGHTS: NightRow[] = [
  {
    id: "night-tonight",
    venueId: MOCK_VENUE.id,
    startsAt: tonightLong,
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
    seatsTaken: 5,
    seatsLeft: 1,
  },
  {
    id: "night-tonight-couples",
    venueId: MOCK_VENUE.id,
    startsAt: tonightCouples,
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
    seatsTaken: 5,
    seatsLeft: 1,
  },
  {
    id: "night-fri",
    venueId: MOCK_VENUE.id,
    startsAt: daysFromNow(1, 20),
    priceTier: "EVENING",
    seatPrice: 1399,
    capacity: 6,
    status: "OPEN",
    tableType: "SINGLES",
    paymentType: "ALL_INCLUSIVE",
    vibeCopy: "Singles Friday · coastal grill",
    inclusions: [
      "Prawn fry",
      "Fish pulusu",
      "Coconut rice",
      "Elaneer payasam",
    ],
    menu: {
      id: "menu-3",
      name: "Coastal grill",
      description: "Prawn fry · Fish pulusu · Coconut rice · Elaneer payasam.",
      dietaryType: "NON_VEGETARIAN",
    },
    seatsTaken: 3,
    seatsLeft: 3,
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

type TableRef = DoorBooking["table"];

const TABLE_WEEKLY: TableRef = {
  id: "night-tonight",
  startsAt: tonightLong,
  status: "OPEN",
  seatPrice: 1199,
  tableType: "WEEKLY",
  paymentType: "ALL_INCLUSIVE",
  vibeCopy: "Long table · strangers · one set menu",
  capacity: 6,
  menuName: "Hyderabadi long table",
  menuId: "menu-1",
};

const TABLE_COUPLES: TableRef = {
  id: "night-tonight-couples",
  startsAt: tonightCouples,
  status: "OPEN",
  seatPrice: 1299,
  tableType: "COUPLES",
  paymentType: "ALL_INCLUSIVE",
  vibeCopy: "Couples table · shared courses",
  capacity: 6,
  menuName: "Hyderabadi long table",
  menuId: "menu-1",
};

function booking(
  partial: Omit<DoorBooking, "table"> & { table: TableRef },
): DoorBooking {
  return partial;
}

/** Rich demo guest list — each guest tied to a specific table/night. */
export const MOCK_BOOKINGS: DoorBooking[] = [
  booking({
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
    table: TABLE_WEEKLY,
    payment: { id: "p1", status: "CAPTURED", amount: 1199, method: "UPI" },
  }),
  booking({
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
    table: TABLE_WEEKLY,
    payment: { id: "p2", status: "CAPTURED", amount: 1199, method: "CARD" },
  }),
  booking({
    id: "b3",
    status: "CONFIRMED",
    seatsBooked: 2,
    checkInCode: "CX1N8T",
    checkedInAt: null,
    amountPaid: 2598,
    paidAt: new Date().toISOString(),
    user: {
      id: "u3",
      firstName: "Priya",
      fullName: "Priya & Arjun",
      phone: "+91 99887 76655",
    },
    table: TABLE_COUPLES,
    payment: { id: "p3", status: "CAPTURED", amount: 2598, method: "UPI" },
  }),
  booking({
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
      phone: "+91 90000 11223",
    },
    table: TABLE_WEEKLY,
    payment: { id: "p4", status: "CAPTURED", amount: 1199, method: "UPI" },
  }),
  booking({
    id: "b5",
    status: "ATTENDED",
    seatsBooked: 1,
    checkInCode: "EL8K2M",
    checkedInAt: new Date().toISOString(),
    amountPaid: 1199,
    paidAt: new Date().toISOString(),
    user: {
      id: "u5",
      firstName: "Vikram",
      fullName: "Vikram Rao",
      phone: "+91 98111 22334",
    },
    table: TABLE_WEEKLY,
    payment: { id: "p5", status: "CAPTURED", amount: 1199, method: "CARD" },
  }),
  booking({
    id: "b6",
    status: "CONFIRMED",
    seatsBooked: 1,
    checkInCode: "FM2P9Q",
    checkedInAt: null,
    amountPaid: 1299,
    paidAt: new Date().toISOString(),
    user: {
      id: "u6",
      firstName: "Meera",
      fullName: "Meera Iyer",
      phone: "+91 97777 33445",
    },
    table: TABLE_COUPLES,
    payment: { id: "p6", status: "CAPTURED", amount: 1299, method: "UPI" },
  }),
  booking({
    id: "b7",
    status: "ATTENDED",
    seatsBooked: 2,
    checkInCode: "GN5R1S",
    checkedInAt: new Date().toISOString(),
    amountPaid: 2598,
    paidAt: new Date().toISOString(),
    user: {
      id: "u7",
      firstName: "Kabir",
      fullName: "Kabir & Nisha",
      phone: "+91 96666 44556",
    },
    table: TABLE_COUPLES,
    payment: { id: "p7", status: "CAPTURED", amount: 2598, method: "UPI" },
  }),
  booking({
    id: "b8",
    status: "CONFIRMED",
    seatsBooked: 1,
    checkInCode: "HP6T4U",
    checkedInAt: null,
    amountPaid: 1199,
    paidAt: new Date().toISOString(),
    user: {
      id: "u8",
      firstName: "Dev",
      fullName: "Dev Sharma",
      phone: "+91 95555 66778",
    },
    table: TABLE_WEEKLY,
    payment: { id: "p8", status: "CAPTURED", amount: 1199, method: "CARD" },
  }),
];
