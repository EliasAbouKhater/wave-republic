/**
 * Seed matches the prototype's initial state so screens have realistic data
 * from the first render. Numbers/IDs mirror `docs/prototype-spec.md`.
 *
 * Run: `npm run db:seed`
 */
import "dotenv/config";
import { PrismaClient, VenueType, Role, Fulfillment, OrderStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set to run the seed.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

// Simple password hashing for seed users — real auth switches to bcrypt in task #8.
const hash = (pw: string) => createHash("sha256").update(`dreamland:${pw}`).digest("hex");

// Zones have no UI (removed 2026-08-17) but the model is retained for Phase 2 and
// `Restaurant.zoneId` is a required FK — seeding them keeps venue creation working.
const zones = [
  { id: "A", name: "Wave Pool",         code: "DL-WAVE-01", color: "#0BA5E9" },
  { id: "B", name: "Lazy River",        code: "DL-LAZY-02", color: "#14B8A6" },
  { id: "C", name: "Kids' Splash Zone", code: "DL-KIDS-03", color: "#22C55E" },
  { id: "D", name: "Cabanas",           code: "DL-CABA-04", color: "#FF6B4A" },
  { id: "E", name: "Main Lawn",         code: "DL-LAWN-05", color: "#16A34A" },
];

type Item = { name: string; description?: string; price: number };
type Cat = { name: string; slot: "food" | "drinks" | "sweets"; items: Item[] };
type R = {
  id: string;
  name: string;
  type: VenueType;
  cuisine: string;
  zoneId: string;
  prep: number;
  rating: number;
  pinColor: string;
  mapX: number;
  mapY: number;
  thumbLabel: string;
  qrSlug: string;
  cats: Cat[];
};

const restaurants: R[] = [
  {
    id: "grill", name: "Splash Grill", type: "restaurant", cuisine: "Burgers & Fries",
    zoneId: "A", prep: 15, rating: 4.7, pinColor: "#FF6B4A", mapX: 28, mapY: 30, thumbLabel: "burgers", qrSlug: "splash-grill",
    cats: [
      { name: "Mains", slot: "food", items: [
        { name: "Classic Cheeseburger",     description: "Beef, cheddar, pickles",     price: 12 },
        { name: "Bacon Double",             description: "Two patties, smoky bacon",   price: 15 },
        { name: "Crispy Chicken Sandwich",  description: "Buttermilk fried, slaw",     price: 13 },
      ]},
      { name: "Sides", slot: "food", items: [
        { name: "Loaded Fries",             description: "Cheese, scallion, aioli",    price: 8 },
        { name: "Onion Rings",              description: "Crunchy, salted",            price: 6 },
        { name: "Garden Salad",             description: "Greens, tomato, cukes",      price: 9 },
      ]},
    ],
  },
  {
    id: "tacos", name: "Tiki Tacos", type: "restaurant", cuisine: "Tacos & Burritos",
    zoneId: "E", prep: 12, rating: 4.6, pinColor: "#16A34A", mapX: 62, mapY: 24, thumbLabel: "tacos", qrSlug: "tiki-tacos",
    cats: [
      { name: "Tacos", slot: "food", items: [
        { name: "Baja Fish Taco", description: "Beer-battered, cabbage",  price: 6 },
        { name: "Carne Asada",    description: "Grilled steak, cilantro", price: 6 },
        { name: "Veggie",         description: "Roasted peppers, corn",   price: 5 },
      ]},
      { name: "Bigger bites", slot: "food", items: [
        { name: "Burrito Bowl",   description: "Rice, beans, salsa",      price: 13 },
        { name: "Loaded Nachos",  description: "Cheese, jalapeños",       price: 11 },
        { name: "Quesadilla",     description: "Melty cheese, tortilla",  price: 10 },
      ]},
    ],
  },
  {
    id: "pizza", name: "Wave Pizza Co.", type: "restaurant", cuisine: "Wood-fired Pizza",
    zoneId: "D", prep: 20, rating: 4.8, pinColor: "#FF6B4A", mapX: 44, mapY: 62, thumbLabel: "pizza", qrSlug: "wave-pizza",
    cats: [
      { name: "Pizzas", slot: "food", items: [
        { name: "Margherita",     description: "Tomato, mozzarella, basil", price: 14 },
        { name: "Pepperoni",      description: "Classic + cheese",          price: 16 },
        { name: "Veggie Supreme", description: "Peppers, olives, mushroom", price: 17 },
      ]},
      { name: "Extras", slot: "food", items: [
        { name: "Garlic Knots",   description: "Buttery, herby",            price: 7 },
        { name: "Caesar Salad",   description: "Crisp romaine, parm",       price: 9 },
        { name: "Cheesy Bread",   description: "Warm, gooey",               price: 8 },
      ]},
    ],
  },
  {
    id: "scoops", name: "Cool Scoops", type: "kiosk", cuisine: "Ice Cream & Shakes",
    zoneId: "C", prep: 6, rating: 4.9, pinColor: "#0BA5E9", mapX: 74, mapY: 55, thumbLabel: "scoops", qrSlug: "cool-scoops",
    cats: [
      { name: "Cones & cups", slot: "sweets", items: [
        { name: "Single Scoop",         description: "Your pick of flavor",    price: 5 },
        { name: "Double Scoop",         description: "Two scoops, one cup",    price: 7 },
        { name: "Waffle Cone Sundae",   description: "Fudge, cream, cherry",   price: 9 },
      ]},
      { name: "Shakes", slot: "sweets", items: [
        { name: "Vanilla",              description: "Thick and creamy",       price: 7 },
        { name: "Chocolate",            description: "Rich cocoa",             price: 7 },
        { name: "Berry Blast",          description: "Strawberry + blueberry", price: 8 },
      ]},
    ],
  },
  {
    id: "smooth", name: "Lagoon Smoothies", type: "kiosk", cuisine: "Smoothies & Juice",
    zoneId: "A", prep: 5, rating: 4.7, pinColor: "#14B8A6", mapX: 18, mapY: 66, thumbLabel: "smooth", qrSlug: "lagoon-smoothies",
    cats: [
      { name: "Smoothies", slot: "drinks", items: [
        { name: "Mango Tango",       description: "Mango, orange, banana",    price: 8 },
        { name: "Berry Beach",       description: "Mixed berries, yogurt",    price: 8 },
        { name: "Green Machine",     description: "Spinach, apple, ginger",   price: 9 },
      ]},
      { name: "Juices", slot: "drinks", items: [
        { name: "Fresh OJ",          description: "Cold-pressed",             price: 6 },
        { name: "Watermelon Cooler", description: "Lime + mint",              price: 6 },
        { name: "Lemonade",          description: "Classic, not too sweet",   price: 5 },
      ]},
    ],
  },
  {
    id: "bites", name: "Beach Bites", type: "kiosk", cuisine: "Snacks & Corn Dogs",
    zoneId: "B", prep: 8, rating: 4.5, pinColor: "#22C55E", mapX: 52, mapY: 42, thumbLabel: "bites", qrSlug: "beach-bites",
    cats: [
      { name: "Hot snacks", slot: "food", items: [
        { name: "Corn Dog",       description: "Golden battered, on a stick", price: 6 },
        { name: "Chicken Tenders",description: "Crispy, honey mustard",       price: 9 },
        { name: "Pretzel Bites",  description: "Warm, salted, cheese dip",    price: 7 },
      ]},
      { name: "Cool treats", slot: "sweets", items: [
        { name: "Fruit Cup",       description: "Seasonal fresh",             price: 5 },
        { name: "Frozen Lemonade", description: "Icy and tart",               price: 6 },
        { name: "Popcorn",         description: "Buttery bag",                price: 5 },
      ]},
    ],
  },
];

// Phase 1: manager only. Password "dreamland" for the seeded manager, "admin" for the admin fallback.
const staff: { id: string; username: string; name: string; role: Role; kioskId: string | null; removable: boolean }[] = [
  { id: "u1", username: "manager", name: "Manager", role: "manager", kioskId: null, removable: false },
];

// A handful of seed orders across statuses so the board isn't empty.
const seedOrders = [
  { id: "1027", restoId: "grill",  fulfillment: "delivery" as Fulfillment, zoneId: "A", status: "delivered"  as OrderStatus, items: [{ name: "Classic Cheeseburger", priceCents: 1200, qty: 2 }, { name: "Loaded Fries", priceCents: 800, qty: 1 }], hoursAgo: 4 },
  { id: "1028", restoId: "tacos",  fulfillment: "pickup"   as Fulfillment, zoneId: null, status: "picked_up" as OrderStatus, items: [{ name: "Baja Fish Taco", priceCents: 600, qty: 3 }], hoursAgo: 3 },
  { id: "1029", restoId: "pizza",  fulfillment: "delivery" as Fulfillment, zoneId: "D", status: "delivered"  as OrderStatus, items: [{ name: "Margherita", priceCents: 1400, qty: 1 }, { name: "Cheesy Bread", priceCents: 800, qty: 1 }], hoursAgo: 3 },
  { id: "1030", restoId: "scoops", fulfillment: "pickup"   as Fulfillment, zoneId: null, status: "picked_up" as OrderStatus, items: [{ name: "Double Scoop", priceCents: 700, qty: 2 }], hoursAgo: 2 },
  { id: "1031", restoId: "bites",  fulfillment: "delivery" as Fulfillment, zoneId: "B", status: "delivered"  as OrderStatus, items: [{ name: "Corn Dog", priceCents: 600, qty: 3 }, { name: "Frozen Lemonade", priceCents: 600, qty: 3 }], hoursAgo: 2 },
  { id: "1032", restoId: "smooth", fulfillment: "delivery" as Fulfillment, zoneId: "A", status: "delivered"  as OrderStatus, items: [{ name: "Mango Tango", priceCents: 800, qty: 2 }], hoursAgo: 1 },
  { id: "1037", restoId: "grill",  fulfillment: "delivery" as Fulfillment, zoneId: "A", status: "delivering" as OrderStatus, items: [{ name: "Bacon Double", priceCents: 1500, qty: 1 }, { name: "Onion Rings", priceCents: 600, qty: 1 }], minsAgo: 22 },
  { id: "1038", restoId: "pizza",  fulfillment: "pickup"   as Fulfillment, zoneId: null, status: "ready"     as OrderStatus, items: [{ name: "Pepperoni", priceCents: 1600, qty: 1 }], minsAgo: 18 },
  { id: "1039", restoId: "tacos",  fulfillment: "delivery" as Fulfillment, zoneId: "E", status: "preparing"  as OrderStatus, items: [{ name: "Burrito Bowl", priceCents: 1300, qty: 1 }, { name: "Loaded Nachos", priceCents: 1100, qty: 1 }], minsAgo: 12 },
  { id: "1040", restoId: "scoops", fulfillment: "pickup"   as Fulfillment, zoneId: null, status: "preparing" as OrderStatus, items: [{ name: "Waffle Cone Sundae", priceCents: 900, qty: 2 }], minsAgo: 9 },
  { id: "1041", restoId: "smooth", fulfillment: "delivery" as Fulfillment, zoneId: "A", status: "confirmed"  as OrderStatus, items: [{ name: "Green Machine", priceCents: 900, qty: 2 }, { name: "Fresh OJ", priceCents: 600, qty: 1 }], minsAgo: 5 },
  { id: "1042", restoId: "bites",  fulfillment: "delivery" as Fulfillment, zoneId: "B", status: "confirmed"  as OrderStatus, items: [{ name: "Chicken Tenders", priceCents: 900, qty: 1 }, { name: "Popcorn", priceCents: 500, qty: 2 }], minsAgo: 2 },
];

async function main() {
  console.log("Clearing existing data…");
  await prisma.pageView.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.staffSession.deleteMany();
  await prisma.zoneSession.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.orderSequence.deleteMany();

  console.log("Seeding zones…");
  for (const z of zones) {
    await prisma.zone.create({ data: z });
  }

  console.log("Seeding restaurants + menus…");
  for (const r of restaurants) {
    await prisma.restaurant.create({
      data: {
        id: r.id, name: r.name, type: r.type, cuisine: r.cuisine, zoneId: r.zoneId,
        prep: r.prep, rating: r.rating, pinColor: r.pinColor, mapX: r.mapX, mapY: r.mapY,
        thumbLabel: r.thumbLabel, qrSlug: r.qrSlug,
      },
    });
    for (let i = 0; i < r.cats.length; i++) {
      const c = r.cats[i];
      const cat = await prisma.menuCategory.create({
        data: { restaurantId: r.id, name: c.name, slot: c.slot, sortOrder: i },
      });
      for (let j = 0; j < c.items.length; j++) {
        const it = c.items[j];
        await prisma.menuItem.create({
          data: {
            restaurantId: r.id,
            categoryId: cat.id,
            name: it.name,
            description: it.description ?? null,
            priceCents: Math.round(it.price * 100),
            sortOrder: j,
          },
        });
      }
    }
  }

  console.log("Seeding staff…");
  for (const s of staff) {
    await prisma.staff.create({
      data: {
        id: s.id,
        username: s.username,
        passwordHash: hash("dreamland"),
        name: s.name,
        role: s.role,
        kioskId: s.kioskId,
        removable: s.removable,
      },
    });
  }
  // Convention: username "admin" / password "admin" also works.
  await prisma.staff.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hash("admin"),
      name: "Admin",
      role: "manager",
      removable: false,
    },
  });

  console.log("Seeding orders…");
  for (const o of seedOrders) {
    const subtotal = o.items.reduce((s, it) => s + it.priceCents * it.qty, 0);
    const service = Math.round(subtotal * 0.05);
    const delivery = o.fulfillment === "delivery" ? 100 : 0; // $1
    const total = subtotal + service + delivery;
    const placedAt = new Date(Date.now() - (o.hoursAgo ? o.hoursAgo * 3600e3 : (o.minsAgo ?? 0) * 60e3));
    await prisma.order.create({
      data: {
        id: o.id,
        restaurantId: o.restoId,
        fulfillment: o.fulfillment,
        deliveryZoneId: o.zoneId,
        status: o.status,
        items: o.items,
        subtotalCents: subtotal,
        serviceFeeCents: service,
        deliveryFeeCents: delivery,
        totalCents: total,
        prepMinutes: restaurants.find(r => r.id === o.restoId)!.prep,
        placedAt,
      },
    });
  }

  console.log("Seeding order sequence…");
  await prisma.orderSequence.upsert({
    where: { id: 1 },
    update: { nextVal: 1043 },
    create: { id: 1, nextVal: 1043 },
  });

  console.log("Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
