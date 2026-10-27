import mongoose, { type InferSchemaType, Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name:        { type: String, required: true, trim: true, maxlength: 80 },
    slug:        { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    image:       { type: String, default: null },
    sort:        { type: Number, default: 0 },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true },
);

CategorySchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ restaurantId: 1, sort: 1 });

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;

export const Category =
  (mongoose.models.Category as mongoose.Model<CategoryDoc>) ??
  mongoose.model<CategoryDoc>("Category", CategorySchema);
