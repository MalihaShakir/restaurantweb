/**
 * User model.
 *
 * Roles:
 *  - customer   can browse, cart, checkout, view own orders
 *  - staff      can view and update orders for their restaurant
 *  - admin      full access to their restaurant; can manage staff
 *  - superadmin platform-wide (reserved for ops, not exposed in UI)
 *
 * Passwords are stored as bcrypt hashes (cost 12).
 * Never store plaintext passwords. Never return passwordHash to clients.
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name:         { type: String, required: true, trim: true, maxlength: 120 },
    email:        { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
    passwordHash: { type: String, select: false }, // excluded from queries by default
    phone:        { type: String, trim: true, maxlength: 30, default: null },
    role:         {
      type: String,
      enum: ["customer", "staff", "admin", "superadmin", "rider"],
      default: "customer",
    },
    // For staff/admin: which restaurant they belong to.
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
    active:       { type: Boolean, default: true },
    // Soft-delete: when set, the account is considered deleted.
    deletedAt:    { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      // Never serialise the password hash, even if accidentally selected.
      transform(_doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// Unique email index (case-insensitive handled by lowercase:true above).
UserSchema.index({ email: 1 }, { unique: true });
// Fast lookups by restaurant for admin lists.
UserSchema.index({ restaurantId: 1, role: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User =
  (mongoose.models.User as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", UserSchema);
