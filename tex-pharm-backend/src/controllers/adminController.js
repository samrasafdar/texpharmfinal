const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Contact = require('../models/Contact');

// ===== Admin Dashboard Stats =====
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalProducts,
            totalOrders,
            pendingContacts,
            lowStockProducts,
            orders,
            recentOrders,
            recentContacts
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Contact.countDocuments({ status: 'pending' }),
            Product.countDocuments({ stock: { $lte: 5 } }),
            Order.find({ paymentStatus: 'paid' }).select('total'),
            Order.find().populate('user', 'name email').sort('-createdAt').limit(5),
            Contact.find().sort('-createdAt').limit(5)
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                pendingContacts,
                lowStockProducts,
                totalRevenue,
                ordersByStatus,
                recentOrders,
                recentContacts
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard stats'
        });
    }
};

// ===== Get All Users (Admin) =====
const getUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const users = await User.find(query).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
};

// ===== Update User (Admin) - role / active status =====
const updateUser = async (req, res) => {
    try {
        const { role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (String(user._id) === String(req.user._id) && role && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'You cannot remove your own admin access'
            });
        }

        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};

// ===== Delete User (Admin) =====
const deleteUser = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    updateUser,
    deleteUser
};
