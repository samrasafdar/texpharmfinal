const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        lowercase: true,
        trim: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please provide a valid email address'
        ]
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Please provide a message'],
        trim: true,
        minlength: [10, 'Message must be at least 10 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'read', 'replied'],
        default: 'pending'
    },
    repliedAt: Date,
    replyMessage: String,
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);