export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  addresses: Address[];
  wishlist: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  order: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: Category;
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
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  _id: string;
  user: string | User;
  orderItems: OrderItem[];
  shippingAddress: Omit<Address, '_id' | 'isDefault'>;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  totalPrice: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  finalPrice: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory: { status: string; date: string; note?: string }[];
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: Product | string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  expiresAt: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  product: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image: string;
  author: { _id: string; name: string; avatar?: string };
  category: string;
  tags: string[];
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
}
