const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { validate, validateContact } = require('../middleware/validation');
const {
    submitContact,
    getContacts,
    replyContact
} = require('../controllers/contactController');

// ===== Public Route =====
router.post('/', validateContact, validate, submitContact);

// ===== Admin Routes =====
router.get('/admin/all', protect, admin, getContacts);
router.put('/admin/:id/reply', protect, admin, replyContact);

module.exports = router;