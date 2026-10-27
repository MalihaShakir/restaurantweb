/**
 * Audit log for important administrative actions.
 *
 * These records are write-only from the application.
 * No application code should mutate or delete audit events.
 * Retention policy should be managed at the database / backup level.
 */
import mongoose, { type InferSchemaType, Schema } from "mongoose";

const AuditEventSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
    actor:        { type: Schema.Types.ObjectId, ref: "User",       default: null },
    actorEmail:   { type: String, default: null },
    // e.g. "order.status_changed", "order.cod_collected", "menu_item.deleted"
    action:       { type: String, required: true, maxlength: 100 },
    // MongoDB _id of the affected document.
    targetId:     { type: Schema.Types.ObjectId, default: null },
    targetModel:  { type: String, default: null },
    // Structured details about what changed.
    details:      { type: Schema.Types.Mixed, default: {} },
    ipAddress:    { type: String, default: null },
  },
  {
    // Use createdAt only — updatedAt is meaningless for audit logs.
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditEventSchema.index({ restaurantId: 1, createdAt: -1 });
AuditEventSchema.index({ actor: 1 });
AuditEventSchema.index({ targetId: 1, targetModel: 1 });
// TTL index: auto-delete audit logs older than 2 years (63072000 seconds).
// Adjust or remove based on your retention requirements.
AuditEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

export type AuditEventDoc = InferSchemaType<typeof AuditEventSchema>;

export const AuditEvent =
  (mongoose.models.AuditEvent as mongoose.Model<AuditEventDoc>) ??
  mongoose.model<AuditEventDoc>("AuditEvent", AuditEventSchema);
