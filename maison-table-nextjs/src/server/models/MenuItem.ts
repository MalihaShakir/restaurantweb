/**
 * Menu item model.
 * priceCents is stored as integer cents (e.g. $28 → 2800).
 * The client receives a formatted string; price arithmetic is always done in cents
 * on the server to avoid floating-point errors.
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

const MenuItemSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    categoryId:   { type: Schema.Types.ObjectId, ref: "Category",   required: true },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    slug:        { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    image:       { type: String, default: null },
    // Price in integer cents.
    priceCents:  { type: Number, required: true, min: 0 },
    dietary: {
      type: [String],
      enum: ["vegetarian", "vegan", "gluten-free", "spicy", "dairy-free"],
      default: [],
    },
    available:  { type: Boolean, default: true },
    featured:   { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    chefPick:   { type: Boolean, default: false },
    sortOrder:  { type: Number,  default: 0 },
    deletedAt:  { type: Date,    default: null },
  },
  { timestamps: true },
);

MenuItemSchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
MenuItemSchema.index({ restaurantId: 1, categoryId: 1, available: 1 });
MenuItemSchema.index({ restaurantId: 1, featured: 1 });

export type MenuItemDoc = InferSchemaType<typeof MenuItemSchema>;

export const MenuItem =
  (mongoose.models.MenuItem as mongoose.Model<MenuItemDoc>) ??
  mongoose.model<MenuItemDoc>("MenuItem", MenuItemSchema);
