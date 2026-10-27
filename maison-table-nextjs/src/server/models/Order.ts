/**
 * Order model.
 *
 * KEY DESIGN DECISIONS:
 *
 * 1. Item snapshots: lines[] stores a copy of name/priceCents/options at the moment
 *    of checkout. Later menu edits never rewrite order history.
 *
 * 2. All money in integer cents. subtotalCents + deliveryFeeCents - discountCents = totalCents.
 *    The server recalculates this; the client cannot submit its own totals.
 *
 * 3. orderNumber is a human-readable sequential string ("MT-001042") separate from
 *    the MongoDB _id. It is generated with a per-restaurant counter (see orderService).
 *
 * 4. paymentStatus is separate from status. A delivered COD order can still have
 *    paymentStatus = "pending" until a staff member records cash collection.
 *
 * 5. statusHistory is append-only. Each transition records the new status, the user
 *    who made the change, and the timestamp.
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

// Immutable snapshot of one ordered item.
const OrderLineSchema = new Schema(
  {
    menuItemId:  { type: Schema.Types.ObjectId, ref: "MenuItem" },
    // Snapshot fields — never change after order creation.
    name:        { type: String, required: true },
    priceCents:  { type: Number, required: true, min: 0 },
    qty:         { type: Number, required: true, min: 1 },
    note:        { type: String, maxlength: 300, default: "" },
    // Line total in cents — stored for fast aggregation.
    lineTotalCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const StatusEventSchema = new Schema(
  {
    status:    { type: String, required: true },
    at:        { type: Date,   required: true, default: Date.now },
    // Who triggered this transition: user ObjectId or "system".
    actor:     { type: String, default: "system" },
    actorName: { type: String, default: "" },
  },
  { _id: false },
);

const CodCollectionSchema = new Schema(
  {
    collectedAt:     { type: Date,   required: true },
    collectedBy:     { type: Schema.Types.ObjectId, ref: "User" },
    collectedByName: { type: String, default: "" },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber:  { type: String, required: true }, // "MT-001042"
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    customerId:   { type: Schema.Types.ObjectId, ref: "User", default: null }, // null for guest orders

    // Customer details — copied at checkout for guest-order support.
    customer: {
      name:    { type: String, required: true, trim: true, maxlength: 120 },
      email:   { type: String, trim: true, lowercase: true, maxlength: 255, default: null },
      phone:   { type: String, required: true, trim: true, maxlength: 30 },
      address: { type: String, required: true, trim: true, maxlength: 300 },
    },

    deliveryNotes: { type: String, maxlength: 500, default: "" },

    lines: { type: [OrderLineSchema], required: true },

    // --- Financials in integer cents ---
    subtotalCents:     { type: Number, required: true, min: 0 },
    deliveryFeeCents:  { type: Number, required: true, min: 0 },
    discountCents:     { type: Number, required: true, min: 0, default: 0 },
    totalCents:        { type: Number, required: true, min: 0 },
    promoCode:         { type: String, default: null },

    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    // Separate payment document reference (online payments).
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", default: null },

    status: {
      type: String,
      enum: ["pending","confirmed","preparing","ready","out_for_delivery","delivered","cancelled"],
      default: "pending",
    },

    statusHistory: { type: [StatusEventSchema], default: [] },

    // COD collection details — only populated when paymentMethod === "cod" and cash is recorded.
    codCollection: { type: CodCollectionSchema, default: null },

    // Rider assignment — set when the order is dispatched.
    riderId:   { type: Schema.Types.ObjectId, ref: "User", default: null },
    riderName: { type: String, default: null },
    assignedAt: { type: Date, default: null },

    // Idempotency key to prevent duplicate orders from browser retries.
    idempotencyKey: { type: String, default: null },
  },
  { timestamps: true },
);

// Compound indexes for common admin queries.
OrderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, paymentMethod: 1, paymentStatus: 1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
// Unique per-restaurant order number.
OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });
// Rider lookup index.
OrderSchema.index({ riderId: 1, status: 1 });
// Idempotency key lookup.
OrderSchema.index({ idempotencyKey: 1 }, { sparse: true });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const Order =
  (mongoose.models.Order as mongoose.Model<OrderDoc>) ??
  mongoose.model<OrderDoc>("Order", OrderSchema);
