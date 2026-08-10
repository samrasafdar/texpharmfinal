const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getDashboardStats,
    getUsers,
    updateUser,
    deleteUser
} = require('../controllers/adminController');

// All routes here are admin-only
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
