const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/sendEmail');

// ===== Create Order =====
// Accepts multipart/form-data: items and shippingAddress are sent as JSON
// strings (since a file is attached), plus a "paymentScreenshot" file.
const createOrder = async (req, res) => {
    try {
        let { items, shippingAddress, notes } = req.body;

        // items/shippingAddress arrive as JSON strings when sent via FormData
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { items = []; }
        }
        if (typeof shippingAddress === 'string') {
            try { shippingAddress = JSON.parse(shippingAddress); } catch { shippingAddress = {}; }
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Your cart is empty.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload your payment screenshot.'
            });
        }

        // Validate items
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image
            });

            // Reduce stock
            product.stock -= item.quantity;
            await product.save();
        }

        // Calculate totals
        const tax = subtotal * 0.05; // 5% tax
        const shippingCost = subtotal > 100 ? 0 : 10;
        const total = subtotal + tax + shippingCost;

        // Create order
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            billingAddress: shippingAddress,
            paymentMethod: 'bank',
            paymentProofUrl: `/uploads/${req.file.filename}`,
            subtotal,
            tax,
            shippingCost,
            total,
            notes,
            orderStatus: 'pending',
            paymentStatus: 'pending'
        });

        // Send confirmation email (best-effort — if this fails, the order is
        // still successful and the customer should not see an error)
        try {
           await sendEmail({
    to: req.user.email,
    subject: `Order Received - Tex Pharm`,
    html: `
    <div style="font-family:Arial;padding:20px">
        <h2>Thank You for Your Order ❤️</h2>

        <p>Hello <b>${req.user.name}</b>,</p>

        <p>Your order has been received successfully.</p>

        <p><b>Order ID:</b> ${order._id}</p>

        <p><b>Total Amount:</b> PKR ${total.toFixed(0)}</p>

        <hr>

        <h3>Advance Payment Required</h3>

        <p>Your order will NOT be confirmed until advance payment is verified.</p>

        <p><b>Bank Name:</b> Bank Alfalah</p>

        <p><b>Account Number:</b> ${process.env.BANK_ACCOUNT_NUMBER || 'Contact us for account details'}</p>

        <p>Please send payment screenshot after payment.</p>

        <br>

        <p>Thank you.</p>

        <h3>Tex Pharm</h3>

    </div>
    `
});
            
        } catch (emailError) {
            console.error('Order confirmation email failed to send:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
};

// ===== Get My Orders =====
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get orders'
        });
    }
};

// ===== Get Single Order =====
const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get order'
        });
    }
};

// ===== Cancel Order =====
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.orderStatus !== 'pending' && order.orderStatus !== 'processing') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled. It is already shipped or delivered.'
            });
        }

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
};

// ===== Admin: Get All Orders =====
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.product')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get orders'
        });
    }
};

// ===== Admin: Update Order Status =====
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.orderStatus = status;

        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrder,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};