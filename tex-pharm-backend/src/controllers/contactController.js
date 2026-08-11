const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/sendEmail');

// ===== Submit Contact Form =====
const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Get IP and user agent
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const contact = await Contact.create({
            name,
            email,
            subject,
            message,
            ipAddress,
            userAgent
        });

        // Send confirmation to user (best-effort, does not block success response)
        try {
            await sendEmail({
                to: email,
                subject: 'We Received Your Message - Tex-Pharm Inc',
                html: `
                    <h1>Thank You for Contacting Us!</h1>
                    <p>Dear ${name},</p>
                    <p>We have received your message and will get back to you within 24-48 hours.</p>
                    <p><strong>Your Message:</strong></p>
                    <p>${message}</p>
                    <p>Best regards,<br>Tex-Pharm Inc Team</p>
                `
            });
        } catch (emailError) {
            console.error('Contact confirmation email failed to send:', emailError.message);
        }

        // Send notification to admin (best-effort)
        try {
            await sendEmail({
                to: process.env.ADMIN_EMAIL,
                subject: `New Contact Form Submission - ${subject}`,
                html: `
                    <h1>New Contact Form Submission</h1>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                    <p><strong>IP Address:</strong> ${ipAddress}</p>
                    <p><strong>User Agent:</strong> ${userAgent}</p>
                `
            });
        } catch (emailError) {
            console.error('Contact admin notification email failed to send:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again.'
        });
    }
};

// ===== Admin: Get All Contacts =====
const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort('-createdAt');

        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get contacts'
        });
    }
};

// ===== Admin: Reply to Contact =====
const replyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        contact.status = 'replied';
        contact.replyMessage = reply;
        contact.repliedAt = new Date();
        await contact.save();

        // Send reply to user (best-effort)
        try {
            await sendEmail({
                to: contact.email,
                subject: `Re: ${contact.subject} - Tex-Pharm Inc`,
                html: `
                    <h1>Response to Your Message</h1>
                    <p>Dear ${contact.name},</p>
                    <p>Thank you for contacting us. Here is our response:</p>
                    <div style="background:#f8f9fa; padding:20px; border-radius:5px; margin:20px 0;">
                        ${reply}
                    </div>
                    <p>Best regards,<br>Tex-Pharm Inc Team</p>
                `
            });
        } catch (emailError) {
            console.error('Reply email failed to send:', emailError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Reply sent successfully',
            data: contact
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send reply'
        });
    }
};

module.exports = {
    submitContact,
    getContacts,
    replyContact
};