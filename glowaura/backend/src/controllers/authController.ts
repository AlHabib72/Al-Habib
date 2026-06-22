import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

// POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        wishlist: user.wishlist,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        wishlist: user.wishlist,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/profile
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) return next(new AppError('User not found', 404));

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/addresses
export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    const newAddress = req.body;

    // If new address is default, unset others
    if (newAddress.isDefault) {
      user.addresses.forEach((addr: any) => (addr.isDefault = false));
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/addresses/:addressId
export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    user.addresses = user.addresses.filter(
      (addr: any) => addr._id.toString() !== req.params.addressId
    );
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/wishlist/:productId
export const toggleWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    const productId = req.params.productId as any;
    const index = user.wishlist.findIndex((id) => id.toString() === productId);

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};
