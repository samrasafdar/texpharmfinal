const Product = require('../models/Product');

// ===== Get All Products (Public, with search/filter/sort/pagination) =====
const getProducts = async (req, res) => {
    try {
        const { search, category, sort, page = 1, limit = 12, admin } = req.query;

        const query = {};

        // Public callers only see active products; admin panel can pass ?admin=true to see all
        if (admin !== 'true') {
            query.isActive = true;
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        let sortOption = '-createdAt';
        if (sort === 'price-low') sortOption = 'price';
        else if (sort === 'price-high') sortOption = '-price';
        else if (sort === 'name') sortOption = 'name';

        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.max(parseInt(limit) || 12, 1);
        const skip = (pageNum - 1) * limitNum;

        const [products, total] = await Promise.all([
            Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get products'
        });
    }
};

// ===== Get Featured Products (Public) =====
const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true, isActive: true }).sort('-createdAt').limit(8);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get featured products'
        });
    }
};

// ===== Get Single Product (Public) =====
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to get product'
        });
    }
};

// ===== Create Product (Admin) =====
const createProduct = async (req, res) => {
    try {
        const {
            name, category, description, spec, price, originalPrice,
            image, sku, stock, badge, badgeText, isFeatured, isActive
        } = req.body;

        if (!name || !category || !description || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, category, description and price'
            });
        }

        const product = await Product.create({
            name,
            category,
            description,
            spec,
            price,
            originalPrice: originalPrice || null,
            image: image || undefined,
            sku: sku || undefined,
            stock: stock !== undefined ? stock : 0,
            badge: badge || null,
            badgeText: badgeText || null,
            isFeatured: !!isFeatured,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A product with this SKU already exists' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: Object.values(error.errors)[0].message });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
};

// ===== Update Product (Admin) =====
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const allowedFields = [
            'name', 'category', 'description', 'spec', 'price', 'originalPrice',
            'image', 'sku', 'stock', 'badge', 'badgeText', 'isFeatured', 'isActive'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                product[field] = req.body[field];
            }
        });

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A product with this SKU already exists' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: Object.values(error.errors)[0].message });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
};

// ===== Delete Product (Admin) =====
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts
};
