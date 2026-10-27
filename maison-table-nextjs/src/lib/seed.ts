import type { DB, MenuItem, Order, OrderStatus } from "./types";
import { computeTotals } from "./pricing";

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;

export const categoriesSeed = [
  { id: "c-starters", name: "Starters", slug: "starters", description: "Small plates to begin", sort: 1 },
  { id: "c-pasta", name: "Fresh Pasta", slug: "pasta", description: "Rolled by hand each morning", sort: 2 },
  { id: "c-pizza", name: "Pizza", slug: "pizza", description: "Stone-baked to order", sort: 3 },
  { id: "c-mains", name: "Main Courses", slug: "mains", description: "From the wood grill", sort: 4 },
  { id: "c-burgers", name: "Burgers", slug: "burgers", description: "Dry-aged beef, pressed daily", sort: 5 },
  { id: "c-bowls", name: "Garden & Bowls", slug: "bowls", description: "Market vegetables", sort: 6 },
  { id: "c-desserts", name: "Desserts", slug: "desserts", description: "Pastry kitchen", sort: 7 },
  { id: "c-drinks", name: "Drinks", slug: "drinks", description: "House pressed & poured", sort: 8 },
];

const m = (x: Omit<MenuItem, "available" | "featured"> & Partial<MenuItem>): MenuItem => ({
  available: true,
  featured: false,
  ...x,
});

export const menuSeed: MenuItem[] = [
  m({ id: "m1", slug: "short-rib-tagliatelle", name: "Short Rib Tagliatelle", description: "Twelve-hour braised short rib, egg tagliatelle, aged parmesan, gremolata.", price: 28, categoryId: "c-pasta", image: u("photo-1551183053-bf91a1d81141"), dietary: [], featured: true, bestSeller: true, chefPick: true }),
  m({ id: "m2", slug: "cacio-e-pepe", name: "Cacio e Pepe", description: "Tonnarelli, pecorino romano, toasted Tellicherry pepper.", price: 22, categoryId: "c-pasta", image: u("photo-1563379926898-05f4575a45d8"), dietary: ["vegetarian"], bestSeller: true }),
  m({ id: "m3", slug: "burrata-heirloom", name: "Burrata & Heirloom Tomato", description: "Puglian burrata, heirloom tomatoes, basil oil, sourdough crumb.", price: 18, categoryId: "c-starters", image: u("photo-1540189549336-e6e99c3679fe"), dietary: ["vegetarian", "gluten-free"], featured: true }),
  m({ id: "m4", slug: "wood-fired-flatbread", name: "Wood-Fired Flatbread", description: "San Marzano, fior di latte, Calabrian chili honey.", price: 19, categoryId: "c-starters", image: u("photo-1565299624946-b28f40a0ae38"), dietary: ["vegetarian", "spicy"], bestSeller: true }),
  m({ id: "m5", slug: "charred-ribeye", name: "Charred Ribeye", description: "Dry-aged 14oz ribeye, bone marrow butter, watercress.", price: 46, categoryId: "c-mains", image: u("photo-1600891964092-4316c288032e"), dietary: ["gluten-free"], featured: true, chefPick: true }),
  m({ id: "m6", slug: "miso-glazed-salmon", name: "Miso-Glazed Salmon", description: "King salmon, white miso glaze, charred bok choy, citrus.", price: 34, categoryId: "c-mains", image: u("photo-1467003909585-2f8a72700288"), dietary: ["gluten-free", "dairy-free"], chefPick: true }),
  m({ id: "m7", slug: "house-burger", name: "Maison Burger", description: "Dry-aged blend, comté, onion jam, brioche, hand-cut fries.", price: 24, categoryId: "c-burgers", image: u("photo-1568901346375-23c9450c58cd"), dietary: [], bestSeller: true }),
  m({ id: "m8", slug: "roast-chicken", name: "Herb Roast Chicken", description: "Half chicken, jus gras, crushed potatoes, salsa verde.", price: 31, categoryId: "c-mains", image: u("photo-1504674900247-0877df9cc836"), dietary: ["gluten-free"] }),
  m({ id: "m9", slug: "market-grain-bowl", name: "Market Grain Bowl", description: "Farro, roasted squash, tahini, pickled shallot, seeds.", price: 17, categoryId: "c-bowls", image: u("photo-1512621776951-a57141f2eefd"), dietary: ["vegan", "dairy-free"], featured: true }),
  m({ id: "m10", slug: "green-goddess-salad", name: "Green Goddess Salad", description: "Little gem, avocado, herbs, green goddess, crisp chickpeas.", price: 15, categoryId: "c-bowls", image: u("photo-1546069901-ba9599a7e63c"), dietary: ["vegetarian", "gluten-free"] }),
  m({ id: "m11", slug: "seared-sea-bass", name: "Seared Sea Bass", description: "Line-caught bass, saffron beurre blanc, fennel.", price: 36, categoryId: "c-mains", image: u("photo-1559847844-5315695dadae"), dietary: ["gluten-free"], available: false }),
  m({ id: "m12", slug: "chocolate-torte", name: "Dark Chocolate Torte", description: "70% chocolate, salted caramel, crème fraîche.", price: 12, categoryId: "c-desserts", image: u("photo-1551024601-bec78aea704b"), dietary: ["vegetarian", "gluten-free"], bestSeller: true }),
  m({ id: "m13", slug: "berry-pavlova", name: "Summer Berry Pavlova", description: "Crisp meringue, vanilla cream, macerated berries.", price: 11, categoryId: "c-desserts", image: u("photo-1488477181946-6428a0291777"), dietary: ["vegetarian", "gluten-free"], chefPick: true }),
  m({ id: "m14", slug: "brunch-shakshuka", name: "Weekend Shakshuka", description: "Baked eggs, spiced tomato, labneh, grilled bread.", price: 16, categoryId: "c-starters", image: u("photo-1525351484163-7529414344d8"), dietary: ["vegetarian", "spicy"] }),
  m({ id: "m15", slug: "blood-orange-spritz", name: "Blood Orange Spritz", description: "Zero-proof aperitivo, blood orange, soda, rosemary.", price: 9, categoryId: "c-drinks", image: u("photo-1544145945-f90425340c7e"), dietary: ["vegan", "gluten-free"] }),
  // Pizza
  m({ id: "m16", slug: "margherita", name: "Margherita", description: "San Marzano, fior di latte, fresh basil, extra virgin olive oil.", price: 20, categoryId: "c-pizza", image: u("photo-1574071318508-1cdbab80d002"), dietary: ["vegetarian"], bestSeller: true }),
  m({ id: "m17", slug: "nduja-pizza", name: "Nduja & Honey", description: "Spicy Calabrian nduja, fior di latte, local honey, rocket.", price: 23, categoryId: "c-pizza", image: u("photo-1565299585323-38d6b0865b47"), dietary: ["spicy"], featured: true }),
  m({ id: "m18", slug: "mushroom-truffle-pizza", name: "Wild Mushroom & Truffle", description: "Mixed wild mushrooms, taleggio, truffle oil, chives.", price: 25, categoryId: "c-pizza", image: u("photo-1513104890138-7c749659a591"), dietary: ["vegetarian"], chefPick: true }),
  // Burgers
  m({ id: "m19", slug: "truffle-burger", name: "Truffle Cheeseburger", description: "Dry-aged patty, truffle mayo, aged cheddar, pickled shallot, brioche.", price: 27, categoryId: "c-burgers", image: u("photo-1553979459-d2229ba7433b"), dietary: [], chefPick: true }),
  m({ id: "m20", slug: "mushroom-burger", name: "Portobello Burger", description: "Grilled portobello, smoked mozzarella, roasted peppers, aioli, brioche.", price: 22, categoryId: "c-burgers", image: u("photo-1550317138-10000687a72b"), dietary: ["vegetarian"] }),
  // Drinks
  m({ id: "m21", slug: "house-lemonade", name: "House Lemonade", description: "Fresh-pressed lemon, lavender syrup, sparkling water.", price: 7, categoryId: "c-drinks", image: u("photo-1621263764928-df1444c5e859"), dietary: ["vegan", "gluten-free"] }),
  m({ id: "m22", slug: "espresso-martini", name: "Espresso Martini", description: "Cold-brew espresso, vodka, coffee liqueur, vanilla.", price: 14, categoryId: "c-drinks", image: u("photo-1514362545857-3bc16c4c7d1b"), dietary: ["vegan", "gluten-free"], bestSeller: true }),
];

function order(
  n: number,
  minsAgo: number,
  name: string,
  phone: string,
  address: string,
  lines: [string, number, string?][],
  status: OrderStatus,
  method: "cod" | "online",
  now: number,
): Order {
  const ls = lines.map(([id, qty, note]) => {
    const it = menuSeed.find((x) => x.id === id)!;
    return { itemId: id, name: it.name, price: it.price, qty, note };
  });
  const t = computeTotals(ls, { deliveryFee: 4.5, freeDeliveryOver: 60 });
  const created = new Date(now - minsAgo * 60000).toISOString();
  const idx = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"].indexOf(status);
  const history =
    status === "cancelled"
      ? [{ status: "pending" as const, at: created }, { status: "cancelled" as const, at: created }]
      : (["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"] as OrderStatus[])
          .slice(0, idx + 1)
          .map((s, i) => ({ status: s, at: new Date(now - (minsAgo - i * 6) * 60000).toISOString() }));
  const paid = method === "online" ? (status === "cancelled" ? "refunded" : "paid") : status === "delivered" ? "paid" : "pending";
  return {
    id: `MT-${1040 + n}`,
    customer: { name, phone, address },
    lines: ls,
    ...t,
    paymentMethod: method,
    paymentStatus: paid,
    status,
    createdAt: created,
    updatedAt: history[history.length - 1]!.at,
    history,
  };
}

export function buildSeed(): DB {
  const now = Date.now();
  return {
    categories: categoriesSeed,
    menu: menuSeed,
    orders: [
      order(1, 4, "Amelia Hart", "+1 415 555 0101", "12 Hayes St, Apt 3", [["m1", 2], ["m12", 1, "Candle please"]], "pending", "cod", now),
      order(2, 11, "Noah Kim", "+1 415 555 0188", "450 Valencia St", [["m7", 1, "No onion jam"], ["m15", 2]], "confirmed", "online", now),
      order(3, 22, "Sofia Moreno", "+1 415 555 0123", "77 Oak St", [["m5", 1, "Medium rare"], ["m3", 1]], "preparing", "online", now),
      order(4, 35, "Liam Patel", "+1 415 555 0167", "9 Fell St", [["m9", 2], ["m10", 1]], "ready", "cod", now),
      order(5, 48, "Grace Chen", "+1 415 555 0142", "301 Divisadero", [["m2", 1], ["m4", 1]], "out_for_delivery", "cod", now),
      order(6, 120, "Ethan Brooks", "+1 415 555 0199", "18 Page St", [["m6", 2], ["m13", 2]], "delivered", "online", now),
      order(7, 180, "Maya Singh", "+1 415 555 0111", "62 Grove St", [["m8", 1], ["m14", 1]], "delivered", "cod", now),
      order(8, 240, "Lucas Durand", "+1 415 555 0155", "5 Haight St", [["m11", 1]], "cancelled", "online", now),
    ],
    promotions: [
      { id: "p1", code: "WELCOME10", description: "10% off your first order", type: "percent", value: 10, active: true },
      { id: "p2", code: "FREESHIP", description: "Free delivery over $30", type: "free_delivery", value: 0, active: true, minSubtotal: 30 },
      { id: "p3", code: "SUPPER5", description: "$5 off weeknight supper", type: "fixed", value: 5, active: false, minSubtotal: 40 },
    ],
    staff: [
      { id: "s1", name: "Camille Laurent", role: "Owner", email: "camille@maisontable.example", active: true },
      { id: "s2", name: "Marco Bellini", role: "Chef", email: "marco@maisontable.example", active: true },
      { id: "s3", name: "Priya Nair", role: "Manager", email: "priya@maisontable.example", active: true },
      { id: "s4", name: "Jonah Reyes", role: "Rider", email: "jonah@maisontable.example", active: false },
    ],
    settings: {
      name: "Maison Table",
      phone: "+1 (415) 555-0142",
      email: "hello@maisontable.example",
      address: "218 Linden Street, San Francisco, CA",
      about: "A neighbourhood kitchen cooking seasonal food over fire since 2014.",
      deliveryFee: 4.5,
      freeDeliveryOver: 60,
      minOrder: 15,
      deliveryRadiusKm: 6,
      etaMinutes: 40,
      acceptingOrders: true,
      hours: [
        { day: "Monday", open: "", close: "", closed: true },
        { day: "Tuesday", open: "17:00", close: "22:00", closed: false },
        { day: "Wednesday", open: "17:00", close: "22:00", closed: false },
        { day: "Thursday", open: "17:00", close: "22:30", closed: false },
        { day: "Friday", open: "17:00", close: "23:00", closed: false },
        { day: "Saturday", open: "11:00", close: "23:00", closed: false },
        { day: "Sunday", open: "11:00", close: "21:00", closed: false },
      ],
    },
    notifications: [],
  };
}
