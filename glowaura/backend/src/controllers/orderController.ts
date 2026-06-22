import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Order } from '../models/index';
import Product from '../models/Product';
import { Coupon } from '../models/index';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { createRazorpayOrder } from '../config/razorpay';

const SHIPPING_CHARGE = 99;
const FREE_SHIPPING_ABOVE = 499;
const TAX_RATE = 0.18;

// POST /api/orders
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return next(new AppError('No order items provided', 400));
    }

    // Fetch product details & verify stock
    const itemsWithDetails = await Promise.all(
      orderItems.map(async (item: { product: string; quantity: number }) => {
        const product = await Product.findById(item.product);
        if (!product) throw new AppError(`Product ${item.product} not found`, 404);
        if (product.stock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);

        return {
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.discountPrice || product.price,
          image: product.images?.[0] || '',
        };
      })
    );

    const totalPrice = itemsWithDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCharge = totalPrice >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_CHARGE;
    const taxAmount = Math.round(totalPrice * TAX_RATE * 100) / 100;

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() < coupon.expiresAt && totalPrice >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (totalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscountValue) discountAmount = Math.min(discountAmount, coupon.maxDiscountValue);
        } else {
          discountAmount = coupon.discountValue;
        }
        appliedCoupon = coupon;
      }
    }

    const finalPrice = Math.max(0, totalPrice - discountAmount + shippingCharge + taxAmount);

    const order = await Order.create({
      user: req.user._id,
      orderItems: itemsWithDetails,
      shippingAddress,
      paymentMethod,
      totalPrice,
      discountAmount,
      shippingCharge,
      taxAmount,
      finalPrice,
      couponCode: couponCode?.toUpperCase() || undefined,
      statusHistory: [{ status: 'pending', date: new Date() }],
    });

    // Deduct stock
    await Promise.all(
      itemsWithDetails.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    // Increment coupon usage
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
    }

    if (paymentMethod === 'razorpay') {
      const razorpayOrder = await createRazorpayOrder(finalPrice, 'INR', `order_${order._id}`);
      await Order.findByIdAndUpdate(order._id, { razorpayOrderId: razorpayOrder.id });

      res.status(201).json({
        success: true,
        order,
        razorpayOrder,
      });
    } else {
      // COD
      res.status(201).json({ success: true, order });
    }
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/verify - Razorpay payment verification
// FIXED: Original checkout page sent paymentId & signature but never verified signature — SECURITY HOLE
export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentId, razorpaySignature, razorpayOrderId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return next(new AppError('Order not found', 404));
    if (order.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' });
      return next(new AppError('Payment verification failed', 400));
    }

    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: 'paid',
      razorpayPaymentId: paymentId,
      razorpaySignature,
      status: 'processing',
      $push: { statusHistory: { status: 'processing', date: new Date(), note: 'Payment verified' } },
    });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/my
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name images slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('orderItems.product', 'name images slug');
    if (!order) return next(new AppError('Order not found', 404));

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders (Admin)
export const getAllOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/status (Admin)
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, note, trackingNumber } = req.body;
    const update: any = {
      status,
      $push: { statusHistory: { status, date: new Date(), note } },
    };
    if (status === 'shipped') update.shippedAt = new Date();
    if (status === 'delivered') { update.deliveredAt = new Date(); update.paymentStatus = 'paid'; }
    if (trackingNumber) update.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return next(new AppError('Order not found', 404));
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
