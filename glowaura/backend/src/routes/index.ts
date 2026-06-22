// ─── AUTH ROUTES ─────────────────────────────────────────
import { Router } from 'express';
import {
  register, login, getProfile, updateProfile, changePassword, addAddress, deleteAddress, toggleWishlist,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/profile', protect, getProfile);
authRouter.put('/profile', protect, updateProfile);
authRouter.put('/change-password', protect, changePassword);
authRouter.post('/addresses', protect, addAddress);
authRouter.delete('/addresses/:addressId', protect, deleteAddress);
authRouter.post('/wishlist/:productId', protect, toggleWishlist);

export { authRouter };

// ─── PRODUCT ROUTES ──────────────────────────────────────
import {
  getProducts, getFeaturedProducts, getBestsellers, getProductBySlug,
  getProductById, getRelatedProducts, createProduct, updateProduct, deleteProduct,
} from '../controllers/productController';
import { protect as prot, admin } from '../middleware/auth';
import { uploadCloud } from '../config/cloudinary';

const productRouter = Router();

productRouter.get('/', getProducts);
productRouter.get('/featured', getFeaturedProducts);
productRouter.get('/bestsellers', getBestsellers);
productRouter.get('/slug/:slug', getProductBySlug);
productRouter.get('/:id/related', getRelatedProducts);
productRouter.get('/:id', getProductById);
productRouter.post('/', prot, admin, uploadCloud.array('images', 5), createProduct);
productRouter.put('/:id', prot, admin, uploadCloud.array('images', 5), updateProduct);
productRouter.delete('/:id', prot, admin, deleteProduct);

export { productRouter };

// ─── ORDER ROUTES ────────────────────────────────────────
import {
  createOrder, verifyPayment, getMyOrders, getOrderById, getAllOrders, updateOrderStatus,
} from '../controllers/orderController';

const orderRouter = Router();

orderRouter.get('/my', protect, getMyOrders);
orderRouter.get('/', protect, admin, getAllOrders);
orderRouter.post('/', protect, createOrder);
orderRouter.get('/:id', protect, getOrderById);
orderRouter.put('/:id/verify', protect, verifyPayment);
orderRouter.put('/:id/status', protect, admin, updateOrderStatus);

export { orderRouter };

// ─── COUPON ROUTES ───────────────────────────────────────
import { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController';

const couponRouter = Router();

couponRouter.post('/validate', protect, validateCoupon);
couponRouter.get('/', protect, admin, getCoupons);
couponRouter.post('/', protect, admin, createCoupon);
couponRouter.put('/:id', protect, admin, updateCoupon);
couponRouter.delete('/:id', protect, admin, deleteCoupon);

export { couponRouter };

// ─── CATEGORY ROUTES ─────────────────────────────────────
import { Category } from '../models/index';
import { AppError } from '../middleware/error';

const categoryRouter = Router();

categoryRouter.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (e) { next(e); }
});

categoryRouter.post('/', protect, admin, async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, category: cat });
  } catch (e) { next(e); }
});

categoryRouter.put('/:id', protect, admin, async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return next(new AppError('Category not found', 404));
    res.json({ success: true, category: cat });
  } catch (e) { next(e); }
});

categoryRouter.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (e) { next(e); }
});

export { categoryRouter };

// ─── REVIEW ROUTES ───────────────────────────────────────
import { Review } from '../models/index';
import Product from '../models/Product';

const reviewRouter = Router();

reviewRouter.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (e) { next(e); }
});

reviewRouter.post('/', protect, async (req: any, res, next) => {
  try {
    const { product, rating, comment } = req.body;
    const existing = await Review.findOne({ product, user: req.user._id });
    if (existing) return next(new AppError('You have already reviewed this product', 400));

    const review = await Review.create({ user: req.user._id, product, rating, comment });

    // Update product rating
    const reviews = await Review.find({ product, isApproved: true });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(product, { ratings: avgRating, numReviews: reviews.length });

    res.status(201).json({ success: true, review });
  } catch (e) { next(e); }
});

reviewRouter.put('/:id/approve', protect, admin, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json({ success: true, review });
  } catch (e) { next(e); }
});

export { reviewRouter };

// ─── BLOG ROUTES ─────────────────────────────────────────
import { Blog } from '../models/index';
import slugify from 'slugify';

const blogRouter = Router();

blogRouter.get('/', async (_req, res, next) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).populate('author', 'name').sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (e) { next(e); }
});

blogRouter.get('/:slug', async (req, res, next) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name avatar');
    if (!blog) return next(new AppError('Blog not found', 404));
    res.json({ success: true, blog });
  } catch (e) { next(e); }
});

blogRouter.post('/', protect, admin, async (req: any, res, next) => {
  try {
    const slug = slugify(req.body.title, { lower: true, strict: true });
    const blog = await Blog.create({ ...req.body, slug, author: req.user._id });
    res.status(201).json({ success: true, blog });
  } catch (e) { next(e); }
});

blogRouter.put('/:id', protect, admin, async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, blog });
  } catch (e) { next(e); }
});

blogRouter.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted' });
  } catch (e) { next(e); }
});

export { blogRouter };
