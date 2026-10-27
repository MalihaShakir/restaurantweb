import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("No URI"); process.exit(1); }

await mongoose.connect(uri);
console.log("Connected");

const { User } = await import("./src/server/models/User.js");

const restaurantId = new mongoose.Types.ObjectId("6adfa4ac69a074865c5c2cf9");

const accounts = [
  { name: "Kitchen Staff", email: "kitchen@maisontable.example", password: "Kitchen123!", role: "staff" },
  { name: "Rider Ahmed",   email: "rider@maisontable.example",   password: "Rider123!",   role: "rider" },
];

for (const acc of accounts) {
  const hash = await bcrypt.hash(acc.password, 12);
  await User.findOneAndUpdate(
    { email: acc.email },
    { $setOnInsert: { name: acc.name, email: acc.email, passwordHash: hash, role: acc.role, restaurantId, active: true } },
    { upsert: true, new: true }
  );
  console.log(`Created: ${acc.email} (${acc.role}) password: ${acc.password}`);
}

await mongoose.disconnect();
console.log("Done");
