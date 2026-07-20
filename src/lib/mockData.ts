/**
 * Static in-memory data used by customer screens until the DB is wired.
 * Mirrors `prisma/seed.ts` — do not diverge. Swap for Prisma queries in task #7.
 */

export type Zone = { id: string; name: string; code: string; color: string };
export type Item = { id: string; name: string; description?: string; price: number; available?: boolean };
export type Category = { id: string; name: string; slot: "food" | "drinks" | "sweets"; items: Item[] };
export type Restaurant = {
  id: string;
  name: string;
  type: "restaurant" | "kiosk";
  cuisine: string;
  zoneId: string;
  prep: number;
  rating: number;
  pinColor: string;
  mapX: number;
  mapY: number;
  thumbLabel: string;
  categories: Category[];
  deliveryEnabled?: boolean;
};

export const zones: Zone[] = [
  { id: "A", name: "Wave Pool",         code: "DL-WAVE-01", color: "#0BA5E9" },
  { id: "B", name: "Lazy River",        code: "DL-LAZY-02", color: "#14B8A6" },
  { id: "C", name: "Kids' Splash Zone", code: "DL-KIDS-03", color: "#22C55E" },
  { id: "D", name: "Cabanas",           code: "DL-CABA-04", color: "#FF6B4A" },
  { id: "E", name: "Main Lawn",         code: "DL-LAWN-05", color: "#16A34A" },
];

const mk = (rId: string, cName: string, cSlot: Category["slot"], items: [string, string, number][]): Category => ({
  id: `${rId}-${cName.toLowerCase().replace(/\s+/g, "-")}`,
  name: cName,
  slot: cSlot,
  items: items.map(([name, description, price], i) => ({
    id: `${rId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name, description, price, available: true,
  })),
});

export const restaurants: Restaurant[] = [
  { id: "grill", name: "Splash Grill", type: "restaurant", cuisine: "Burgers & Fries", zoneId: "A", prep: 15, rating: 4.7, pinColor: "#FF6B4A", mapX: 28, mapY: 30, thumbLabel: "burgers", categories: [
    mk("grill", "Mains", "food", [
      ["Classic Cheeseburger", "Beef, cheddar, pickles", 12],
      ["Bacon Double", "Two patties, smoky bacon", 15],
      ["Crispy Chicken Sandwich", "Buttermilk fried, slaw", 13],
    ]),
    mk("grill", "Sides", "food", [
      ["Loaded Fries", "Cheese, scallion, aioli", 8],
      ["Onion Rings", "Crunchy, salted", 6],
      ["Garden Salad", "Greens, tomato, cukes", 9],
    ]),
  ]},
  { id: "tacos", name: "Tiki Tacos", type: "restaurant", cuisine: "Tacos & Burritos", zoneId: "E", prep: 12, rating: 4.6, pinColor: "#16A34A", mapX: 62, mapY: 24, thumbLabel: "tacos", categories: [
    mk("tacos", "Tacos", "food", [
      ["Baja Fish Taco", "Beer-battered, cabbage", 6],
      ["Carne Asada", "Grilled steak, cilantro", 6],
      ["Veggie", "Roasted peppers, corn", 5],
    ]),
    mk("tacos", "Bigger bites", "food", [
      ["Burrito Bowl", "Rice, beans, salsa", 13],
      ["Loaded Nachos", "Cheese, jalapeños", 11],
      ["Quesadilla", "Melty cheese, tortilla", 10],
    ]),
  ]},
  { id: "pizza", name: "Wave Pizza Co.", type: "restaurant", cuisine: "Wood-fired Pizza", zoneId: "D", prep: 20, rating: 4.8, pinColor: "#FF6B4A", mapX: 44, mapY: 62, thumbLabel: "pizza", categories: [
    mk("pizza", "Pizzas", "food", [
      ["Margherita", "Tomato, mozzarella, basil", 14],
      ["Pepperoni", "Classic + cheese", 16],
      ["Veggie Supreme", "Peppers, olives, mushroom", 17],
    ]),
    mk("pizza", "Extras", "food", [
      ["Garlic Knots", "Buttery, herby", 7],
      ["Caesar Salad", "Crisp romaine, parm", 9],
      ["Cheesy Bread", "Warm, gooey", 8],
    ]),
  ]},
  { id: "scoops", name: "Cool Scoops", type: "kiosk", cuisine: "Ice Cream & Shakes", zoneId: "C", prep: 6, rating: 4.9, pinColor: "#0BA5E9", mapX: 74, mapY: 55, thumbLabel: "scoops", categories: [
    mk("scoops", "Cones & cups", "sweets", [
      ["Single Scoop", "Your pick of flavor", 5],
      ["Double Scoop", "Two scoops, one cup", 7],
      ["Waffle Cone Sundae", "Fudge, cream, cherry", 9],
    ]),
    mk("scoops", "Shakes", "sweets", [
      ["Vanilla", "Thick and creamy", 7],
      ["Chocolate", "Rich cocoa", 7],
      ["Berry Blast", "Strawberry + blueberry", 8],
    ]),
  ]},
  { id: "smooth", name: "Lagoon Smoothies", type: "kiosk", cuisine: "Smoothies & Juice", zoneId: "A", prep: 5, rating: 4.7, pinColor: "#14B8A6", mapX: 18, mapY: 66, thumbLabel: "smooth", categories: [
    mk("smooth", "Smoothies", "drinks", [
      ["Mango Tango", "Mango, orange, banana", 8],
      ["Berry Beach", "Mixed berries, yogurt", 8],
      ["Green Machine", "Spinach, apple, ginger", 9],
    ]),
    mk("smooth", "Juices", "drinks", [
      ["Fresh OJ", "Cold-pressed", 6],
      ["Watermelon Cooler", "Lime + mint", 6],
      ["Lemonade", "Classic, not too sweet", 5],
    ]),
  ]},
  { id: "bites", name: "Beach Bites", type: "kiosk", cuisine: "Snacks & Corn Dogs", zoneId: "B", prep: 8, rating: 4.5, pinColor: "#22C55E", mapX: 52, mapY: 42, thumbLabel: "bites", categories: [
    mk("bites", "Hot snacks", "food", [
      ["Corn Dog", "Golden battered, on a stick", 6],
      ["Chicken Tenders", "Crispy, honey mustard", 9],
      ["Pretzel Bites", "Warm, salted, cheese dip", 7],
    ]),
    mk("bites", "Cool treats", "sweets", [
      ["Fruit Cup", "Seasonal fresh", 5],
      ["Frozen Lemonade", "Icy and tart", 6],
      ["Popcorn", "Buttery bag", 5],
    ]),
  ]},
];

export const zoneById = (id: string) => zones.find(z => z.id === id);
export const restaurantById = (id: string) => restaurants.find(r => r.id === id);
export const itemById = (id: string) => {
  for (const r of restaurants) for (const c of r.categories) {
    const it = c.items.find(i => i.id === id);
    if (it) return { item: it, restaurant: r };
  }
  return null;
};
