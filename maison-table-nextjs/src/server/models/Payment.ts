/**
 * Payment model.
 *
 * Tracks online payment sessions and webhook-verified results.
 *
 * Rule: an order is never marked "paid" based on a browser redirect.
 * It is only marked paid when a webhook from the payment provider arrives
 * AND the signature is verified AND the amount matches the order total.
 *
 * webhook events are stored for auditability and idempotency.
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

const WebhookEventSchema = new Schema(
  {
    eventId:   { type: String, required: true }, // provider event ID
    eventType: { type: String, required: true }, // e.g. "payment_intent.succeeded"
    receivedAt: { type: Date, default: Date.now },
    processed:  { type: Boolean, default: false },
  },
  { _id: false },
);

const PaymentSchema = new Schema(
  {
    orderId:      { type: Schema.Types.ObjectId, ref: "Order", required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    provider:     { type: String, enum: ["stripe", "cod", "manual"], required: true },

    // Provider-assigned IDs.
    providerSessionId: { type: String, default: null }, // Stripe PaymentIntent / Session ID
    providerChargeId:  { type: String, default: null }, // Stripe charge ID

    // Always in integer minor units (cents).
    amountCents:   { type: Number, required: true, min: 0 },
    currency:      { type: String, required: true, default: "usd" },

    status: {
      type: String,
      enum: ["created","pending","succeeded","failed","refunded","cancelled"],
      default: "created",
    },

    // Set when provider confirms success — not on browser redirect.
    paidAt:   { type: Date, default: null },
    failedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    // Amount refunded in cents (may be partial).
    refundedAmountCents: { type: Number, default: 0 },

    // Webhook events received for this payment (for idempotency and audit).
    webhookEvents: { type: [WebhookEventSchema], default: [] },
  },
  { timestamps: true },
);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ providerSessionId: 1 }, { sparse: true });
PaymentSchema.index({ "webhookEvents.eventId": 1 }, { sparse: true });

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;

export const Payment =
  (mongoose.models.Payment as mongoose.Model<PaymentDoc>) ??
  mongoose.model<PaymentDoc>("Payment", PaymentSchema);
