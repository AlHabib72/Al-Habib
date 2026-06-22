import mongoose, { Document, Schema } from 'mongoose';

// FIXED: v1 embedded reviews in Product, v2 has separate Review model — using separate model (better)
// FIXED: v1 used String for category, v2 uses ObjectId ref — using ObjectId (correct)
// FIXED: Added text index for search functionality

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  images: string[];
  ingredients?: string;
  benefits?: string[];
  howToUse?: string;
  stock: number;
  sku?: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  ratings: number;
  numReviews: number;
  tags: string[];
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: [true, 'Description is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discountPrice: { type: Number, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: String },
    images: [{ type: String }],
    ingredients: { type: String },
    benefits: [{ type: String }],
    howToUse: { type: String },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
// Performance indexes
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestseller: 1 });
productSchema.index({ isNewArrival: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
