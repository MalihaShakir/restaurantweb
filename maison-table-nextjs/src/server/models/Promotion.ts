/**
 * Promotion / discount code model.
 *
 * Codes are validated server-side at checkout.
 * discountValue is stored as:
 *   - integer cents for type "fixed"   (e.g. $5 off → 500)
 *   - integer basis points for "percent" (e.g. 10% → 1000, meaning 10.00%)
 *   - ignored for "free_delivery"
 *
 * Using basis points for percentages avoids float errors and represents
 * fractions exactly (e.g. 7.5% → 750 bps).
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

const PromotionSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    code:         { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    description:  { type: String, trim: true, maxlength: 200, default: "" },
    type: {
      type: String,
      enum: ["percent", "fixed", "free_delivery"],
      required: true,
    },
    // See docstring above for unit conventions.
    discountValue: { type: Number, required: true, min: 0 },
    // Minimum order subtotal in cents to qualify.
    minSubtotalCents: { type: Number, default: 0, min: 0 },
    // Maximum number of uses (null = unlimited).
    maxUses:     { type: Number, default: null },
    usageCount:  { type: Number, default: 0, min: 0 },
    active:      { type: Boolean, default: true },
    // Optional validity window.
    startsAt:  { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

PromotionSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

export type PromotionDoc = InferSchemaType<typeof PromotionSchema>;

export const Promotion =
  (mongoose.models.Promotion as mongoose.Model<PromotionDoc>) ??
  mongoose.model<PromotionDoc>("Promotion", PromotionSchema);
