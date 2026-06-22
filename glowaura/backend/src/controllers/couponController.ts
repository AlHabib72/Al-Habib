import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/index';
import { AppError } from '../middleware/error';

// POST /api/coupons/validate
export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, cartValue } = req.body;
    if (!code) return next(new AppError('Coupon code is required', 400));

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return next(new AppError('Invalid coupon code', 400));
    if (new Date() > coupon.expiresAt) return next(new AppError('Coupon has expired', 400));
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return next(new AppError('Coupon usage limit reached', 400));
    }
    if (cartValue < coupon.minOrderValue) {
      return next(new AppError(`Minimum order value ₹${coupon.minOrderValue} required`, 400));
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartValue * coupon.discountValue) / 100;
      if (coupon.maxDiscountValue) discountAmount = Math.min(discountAmount, coupon.maxDiscountValue);
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/coupons (Admin)
export const getCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons (Admin)
export const createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

// PUT /api/coupons/:id (Admin)
export const updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return next(new AppError('Coupon not found', 404));
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id (Admin)
export const deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return next(new AppError('Coupon not found', 404));
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
