#!/usr/bin/env npx tsx
/**
 * Database seed script — creates the initial restaurant, admin user,
 * categories, and menu items in MongoDB.
 *
 * Safe to run multiple times — uses upsert so it will not duplicate data.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Prerequisites:
 *   MONGODB_URI must be set in .env.local or the shell environment.
 *   The ADMIN_EMAIL and ADMIN_PASSWORD environment variables override defaults.
 *
 * NEVER use this script with production data without reviewing it first.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Minimal inline connection (no global cache needed in a script) ─────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not set.\nCopy .env.local.example to .env.local and fill in your Atlas URI.");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB");

// ── Import models AFTER connecting ────────────────────────────────────────────
const { Restaurant } = await import("../src/server/models/Restaurant.js");
const { Category }   = await import("../src/server/models/Category.js");
const { MenuItem }   = await import("../src/server/models/MenuItem.js");
const { User }       = await import("../src/server/models/User.js");
const { Promotion }  = await import("../src/server/models/Promotion.js");

// ── 1. Restaurant ─────────────────────────────────────────────────────────────
const restaurant = await Restaurant.findOneAndUpdate(
  { slug: "maison-table" },
  {
    $setOnInsert: {
      name:    "Maison Table",
      slug:    "maison-table",
      address: "218 Linden Street, San Francisco, CA",
      phone:   "+1 (415) 555-0142",
      email:   "hello@maisontable.example",
      about:   "A neighbourhood kitchen cooking seasonal food over fire since 2014.",
      deliveryFeeCents:      450,
      freeDeliveryOverCents: 6000,
      minOrderCents:         1500,
      deliveryRadiusKm:      6,
      etaMinutes:            40,
      acceptingOrders:       true,
      active:                true,
      hours: [
        { day: "Monday",    open: "",      close: "",      closed: true  },
        { day: "Tuesday",   open: "17:00", close: "22:00", closed: false },
        { day: "Wednesday", open: "17:00", close: "22:00", closed: false },
        { day: "Thursday",  open: "17:00", close: "22:30", closed: false },
        { day: "Friday",    open: "17:00", close: "23:00", closed: false },
        { day: "Saturday",  open: "11:00", close: "23:00", closed: false },
        { day: "Sunday",    open: "11:00", close: "21:00", closed: false },
      ],
    },
  },
  { upsert: true, new: true },
);
console.log("Restaurant:", restaurant._id);

// ── 2. Admin user ─────────────────────────────────────────────────────────────
const adminEmail    = process.env.ADMIN_EMAIL    ?? "admin@maisontable.example";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

const passwordHash = await bcrypt.hash(adminPassword, 12);
const adminUser    = await User.findOneAndUpdate(
  { email: adminEmail },
  {
    $setOnInsert: {
      name:         "Admin",
      email:        adminEmail,
      passwordHash,
      role:         "admin",
      restaurantId: restaurant._id,
      active:       true,
    },
  },
  { upsert: true, new: true },
);
console.log("Admin user:", adminUser.email);
if (adminPassword === "ChangeMe123!") {
  console.warn("WARNING: Using default admin password. Set ADMIN_PASSWORD before running in production.");
}

// ── 3. Categories ─────────────────────────────────────────────────────────────
const categoryDefs = [
  { name: "Starters",       slug: "starters", description: "Small plates to begin",          sort: 1 },
  { name: "Fresh Pasta",    slug: "pasta",    description: "Rolled by hand each morning",    sort: 2 },
  { name: "Pizza",          slug: "pizza",    description: "Stone-baked to order",           sort: 3 },
  { name: "Main Courses",   slug: "mains",    description: "From the wood grill",            sort: 4 },
  { name: "Burgers",        slug: "burgers",  description: "Dry-aged beef, pressed daily",   sort: 5 },
  { name: "Garden & Bowls", slug: "bowls",    description: "Market vegetables",              sort: 6 },
  { name: "Desserts",       slug: "desserts", description: "Pastry kitchen",                 sort: 7 },
  { name: "Drinks",         slug: "drinks",   description: "House pressed & poured",         sort: 8 },
];

const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
for (const def of categoryDefs) {
  const cat = await Category.findOneAndUpdate(
    { restaurantId: restaurant._id, slug: def.slug },
    { $setOnInsert: { ...def, restaurantId: restaurant._id, active: true } },
    { upsert: true, new: true },
  );
  categoryMap[def.slug] = cat._id as mongoose.Types.ObjectId;
}
console.log("Categories seeded:", Object.keys(categoryMap).length);

// ── 4. Menu items ─────────────────────────────────────────────────────────────
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;

const menuItemDefs = [
  { slug: "short-rib-tagliatelle", name: "Short Rib Tagliatelle",   priceCents: 2800, cat: "pasta",    image: u("photo-1551183053-bf91a1d81141"), featured: true,  bestSeller: true,  chefPick: true  },
  { slug: "cacio-e-pepe",          name: "Cacio e Pepe",             priceCents: 2200, cat: "pasta",    image: u("photo-1563379926898-05f4575a45d8"), dietary: ["vegetarian"],                  bestSeller: true  },
  { slug: "burrata-heirloom",      name: "Burrata & Heirloom Tomato",priceCents: 1800, cat: "starters", image: u("photo-1540189549336-e6e99c3679fe"), dietary: ["vegetarian","gluten-free"], featured: true  },
  { slug: "wood-fired-flatbread",  name: "Wood-Fired Flatbread",     priceCents: 1900, cat: "starters", image: u("photo-1565299624946-b28f40a0ae38"), dietary: ["vegetarian","spicy"],       bestSeller: true  },
  { slug: "charred-ribeye",        name: "Charred Ribeye",           priceCents: 4600, cat: "mains",    image: u("photo-1600891964092-4316c288032e"), dietary: ["gluten-free"],              featured: true, chefPick: true },
  { slug: "miso-glazed-salmon",    name: "Miso-Glazed Salmon",       priceCents: 3400, cat: "mains",    image: u("photo-1467003909585-2f8a72700288"), dietary: ["gluten-free","dairy-free"], chefPick: true },
  { slug: "house-burger",          name: "Maison Burger",            priceCents: 2400, cat: "burgers",  image: u("photo-1568901346375-23c9450c58cd"),                                        bestSeller: true  },
  { slug: "roast-chicken",         name: "Herb Roast Chicken",       priceCents: 3100, cat: "mains",    image: u("photo-1504674900247-0877df9cc836"), dietary: ["gluten-free"]                },
  { slug: "market-grain-bowl",     name: "Market Grain Bowl",        priceCents: 1700, cat: "bowls",    image: u("photo-1512621776951-a57141f2eefd"), dietary: ["vegan","dairy-free"],       featured: true  },
  { slug: "green-goddess-salad",   name: "Green Goddess Salad",      priceCents: 1500, cat: "bowls",    image: u("photo-1546069901-ba9599a7e63c"), dietary: ["vegetarian","gluten-free"]     },
  { slug: "chocolate-torte",       name: "Dark Chocolate Torte",     priceCents: 1200, cat: "desserts", image: u("photo-1551024601-bec78aea704b"), dietary: ["vegetarian","gluten-free"],     bestSeller: true  },
  { slug: "berry-pavlova",         name: "Summer Berry Pavlova",     priceCents: 1100, cat: "desserts", image: u("photo-1488477181946-6428a0291777"), dietary: ["vegetarian","gluten-free"],  chefPick: true },
  { slug: "blood-orange-spritz",   name: "Blood Orange Spritz",      priceCents:  900, cat: "drinks",   image: u("photo-1544145945-f90425340c7e"), dietary: ["vegan","gluten-free"]           },
  { slug: "margherita",            name: "Margherita",               priceCents: 2000, cat: "pizza",    image: u("photo-1574071318508-1cdbab80d002"), dietary: ["vegetarian"],               bestSeller: true  },
  { slug: "nduja-pizza",           name: "Nduja & Honey",            priceCents: 2300, cat: "pizza",    image: u("photo-1565299585323-38d6b0865b47"), dietary: ["spicy"],                    featured: true  },
  { slug: "truffle-burger",        name: "Truffle Cheeseburger",     priceCents: 2700, cat: "burgers",  image: u("photo-1553979459-d2229ba7433b"),                                           chefPick: true },
  { slug: "espresso-martini",      name: "Espresso Martini",         priceCents: 1400, cat: "drinks",   image: u("photo-1514362545857-3bc16c4c7d1b"), dietary: ["vegan","gluten-free"],      bestSeller: true  },
];

let seededItems = 0;
for (const def of menuItemDefs) {
  await MenuItem.findOneAndUpdate(
    { restaurantId: restaurant._id, slug: def.slug },
    {
      $setOnInsert: {
        restaurantId: restaurant._id,
        categoryId:   categoryMap[def.cat]!,
        name:         def.name,
        slug:         def.slug,
        priceCents:   def.priceCents,
        image:        def.image,
        dietary:      (def as { dietary?: string[] }).dietary ?? [],
        available:    true,
        featured:     (def as { featured?: boolean }).featured     ?? false,
        bestSeller:   (def as { bestSeller?: boolean }).bestSeller ?? false,
        chefPick:     (def as { chefPick?: boolean }).chefPick     ?? false,
        deletedAt:    null,
      },
    },
    { upsert: true, new: true },
  );
  seededItems++;
}
console.log("Menu items seeded:", seededItems);

// ── 5. Promotions ─────────────────────────────────────────────────────────────
await Promotion.findOneAndUpdate(
  { restaurantId: restaurant._id, code: "WELCOME10" },
  {
    $setOnInsert: {
      restaurantId:  restaurant._id,
      code:          "WELCOME10",
      description:   "10% off your first order",
      type:          "percent",
      // 10% = 1000 basis points
      discountValue: 1000,
      active:        true,
    },
  },
  { upsert: true },
);

await Promotion.findOneAndUpdate(
  { restaurantId: restaurant._id, code: "FREESHIP" },
  {
    $setOnInsert: {
      restaurantId:     restaurant._id,
      code:             "FREESHIP",
      description:      "Free delivery on orders over $30",
      type:             "free_delivery",
      discountValue:    0,
      minSubtotalCents: 3000,
      active:           true,
    },
  },
  { upsert: true },
);
console.log("Promotions seeded");

// ── Done ──────────────────────────────────────────────────────────────────────
console.log("\n✅ Seed complete.");
console.log("   Restaurant ID:", String(restaurant._id));
console.log("   Set RESTAURANT_ID=" + String(restaurant._id) + " in your .env.local");
console.log("   Admin login: " + adminEmail);
if (adminPassword === "ChangeMe123!") {
  console.log("   ⚠️  Change the default password before deploying!");
}

await mongoose.disconnect();
