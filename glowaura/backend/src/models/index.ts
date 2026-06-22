import mongoose, { Document, Schema } from 'mongoose';

// ─── CATEGORY ────────────────────────────────────────────
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    image: { type: String },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);

// ─── ORDER ───────────────────────────────────────────────
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: {
    product: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  totalPrice: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  finalPrice: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory: { status: string; date: Date; note?: string }[];
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        image: { type: String },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    totalPrice: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [{ status: String, date: { type: Date, default: Date.now }, note: String }],
    trackingNumber: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);

// ─── COUPON ──────────────────────────────────────────────
export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  expiresAt: Date;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountValue: { type: Number },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

// ─── REVIEW ──────────────────────────────────────────────
export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  isApproved: boolean;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

// ─── BLOG ────────────────────────────────────────────────
export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image: string;
  author: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  isPublished: boolean;
  views: number;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    image: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', content: 'text' });

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);

// ─── SETTINGS ────────────────────────────────────────────
export interface ISettings extends Document {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'json'], default: 'string' },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
