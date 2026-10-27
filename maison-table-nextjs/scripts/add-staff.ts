/**
 * Creates kitchen staff and rider test accounts in MongoDB.
 * Run: npx tsx --env-file=.env.local scripts/add-staff.ts
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

await mongoose.connect(uri);
console.log("✅ Connected to MongoDB");

const { User } = await import("../src/server/models/User.js");

const RESTAURANT_ID = process.env.RESTAURANT_ID ?? "6adfa4ac69a074865c5c2cf9";
const restaurantId  = new mongoose.Types.ObjectId(RESTAURANT_ID);

const accounts = [
  {
    name:     "Kitchen Staff",
    email:    "kitchen@maisontable.example",
    password: "Kitchen123!",
    role:     "staff",
  },
  {
    name:     "Rider Ahmed",
    email:    "rider@maisontable.example",
    password: "Rider123!",
    role:     "rider",
  },
  {
    name:     "Rider Sara",
    email:    "rider2@maisontable.example",
    password: "Rider123!",
    role:     "rider",
  },
];

for (const acc of accounts) {
  const passwordHash = await bcrypt.hash(acc.password, 12);
  await User.findOneAndUpdate(
    { email: acc.email },
    {
      $setOnInsert: {
        name:         acc.name,
        email:        acc.email,
        passwordHash,
        role:         acc.role,
        restaurantId,
        active:       true,
        deletedAt:    null,
      },
    },
    { upsert: true, new: true },
  );
  console.log(`✅ ${acc.role.padEnd(7)} | ${acc.email} | password: ${acc.password}`);
}

await mongoose.disconnect();
console.log("\nAll accounts ready.");
