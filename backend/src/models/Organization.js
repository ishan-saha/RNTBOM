const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
            minlength: [2, 'Organization name must be at least 2 characters'],
            maxlength: [150, 'Organization name cannot exceed 150 characters'],
        },

        domain: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true, // allows null values
        },

        // 👑 Owner (Admin user)
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        // 📊 Stats (useful for dashboard)
        userCount: {
            type: Number,
            default: 0,
        },

        scanCount: {
            type: Number,
            default: 0,
        },

        // 🔐 Status
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


// 📈 Index for performance
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ domain: 1 });


// 🔥 Virtual: populate users (optional)
OrganizationSchema.virtual('users', {
    ref: 'User',
    localField: '_id',
    foreignField: 'organization',
});


// 🔥 Enable virtuals
OrganizationSchema.set('toObject', { virtuals: true });
OrganizationSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model('Organization', OrganizationSchema);