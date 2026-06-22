import { Request, Response, NextFunction } from 'express';
import Product from '../models/Product';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import slugify from 'slugify';

// GET /api/products
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = '1', limit = '12' } = req.query;

    const query: any = {};

    if (search) query.$text = { $search: search as string };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const sortMap: Record<string, any> = {
      price: { price: 1 },
      '-price': { price: -1 },
      '-ratings': { ratings: -1 },
      '-createdAt': { createdAt: -1 },
      createdAt: { createdAt: 1 },
    };
    const sortObj = sortMap[sort as string] || { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name slug').sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/featured
export const getFeaturedProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({ isFeatured: true }).populate('category', 'name slug').limit(8).lean();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/bestsellers
export const getBestsellers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({ isBestseller: true }).populate('category', 'name slug').limit(8).lean();
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/slug/:slug
export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
    if (!product) return next(new AppError('Product not found', 404));
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return next(new AppError('Product not found', 404));
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id/related
export const getRelatedProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    }).limit(4).lean();

    res.json({ success: true, products: related });
  } catch (error) {
    next(error);
  }
};

// POST /api/products (Admin)
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const product = await Product.create({ ...req.body, slug });
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id (Admin)
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.body.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return next(new AppError('Product not found', 404));
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id (Admin)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError('Product not found', 404));
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
