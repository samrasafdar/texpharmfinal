const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        price: Number,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: String
    }],
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        zipCode: { type: String, required: true }
    },
    billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    paymentMethod: {
        type: String,
        enum: ['bank'],
        default: 'bank',
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentProofUrl: String,
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    couponCode: String,
    discount: {
        type: Number,
        default: 0
    },
    notes: String,
    trackingNumber: String,
    deliveredAt: Date,
    cancelledAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);