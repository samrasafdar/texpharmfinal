const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['textile', 'chemical', 'machinery'],
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    spec: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative'],
        default: null
    },
    image: {
        type: String,
        required: [true, 'Please provide a product image URL'],
        default: 'https://picsum.photos/seed/product/400/300'
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    badge: {
        type: String,
        enum: ['bestseller', 'new', 'sale', null],
        default: null
    },
    badgeText: {
        type: String,
        default: null
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
