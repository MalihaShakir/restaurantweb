/**
 * Restaurant model.
 * One restaurant per Maison Table deployment.
 * The schema supports multiple restaurants if needed later.
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

const HoursSchema = new Schema(
  {
    day:    { type: String, required: true },
    open:   { type: String, default: "" },
    close:  { type: String, default: "" },
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const RestaurantSchema = new Schema(
  {
    name:    { type: String, required: true, trim: true, maxlength: 120 },
    slug:    { type: String, required: true, trim: true, lowercase: true },
    logo:    { type: String, default: null },
    address: { type: String, trim: true, maxlength: 300 },
    phone:   { type: String, trim: true, maxlength: 30 },
    email:   { type: String, trim: true, lowercase: true, maxlength: 255 },
    about:   { type: String, trim: true, maxlength: 1000 },
    // Delivery settings — fees stored in integer cents.
    // e.g. $4.50 delivery fee → 450
    deliveryFeeCents:      { type: Number, default: 450,  min: 0 },
    freeDeliveryOverCents: { type: Number, default: 6000, min: 0 },
    minOrderCents:         { type: Number, default: 1500, min: 0 },
    deliveryRadiusKm:      { type: Number, default: 6 },
    etaMinutes:            { type: Number, default: 40 },
    acceptingOrders:       { type: Boolean, default: true },
    active:                { type: Boolean, default: true },
    hours: [HoursSchema],
  },
  { timestamps: true },
);

RestaurantSchema.index({ slug: 1 }, { unique: true });

export type RestaurantDoc = InferSchemaType<typeof RestaurantSchema>;

export const Restaurant =
  (mongoose.models.Restaurant as mongoose.Model<RestaurantDoc>) ??
  mongoose.model<RestaurantDoc>("Restaurant", RestaurantSchema);
