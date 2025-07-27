const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['farmer', 'vendor', 'admin'],
        required: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },

    // --- Role-Specific Fields ---

    // Fields specific to 'farmer' role
    farmName: {
        type: String,
        required: function() { return this.role === 'farmer'; },
        trim: true
    },
    farmLocation: {
        type: String,
        required: function() { return this.role === 'farmer'; },
        trim: true
    },
    farmAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
    farmSize: { type: Number },
    cropsGrown: [{ type: String, trim: true }],
    farmingType: { type: String, trim: true },
    bankDetails: {
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, trim: true },
        bankName: { type: String, trim: true },
        accountHolderName: { type: String, trim: true }
    },

    // Fields specific to 'vendor' role
    companyName: {
        type: String,
        required: function() { return this.role === 'vendor'; },
        trim: true
    },
    businessAddress: {
        // FIX: Removed 'required' from sub-fields to allow saving existing users
        // that might not have these fields populated.
        street: {
            type: String,
            // required: function() { return this.role === 'vendor'; }, // REMOVED THIS LINE
            trim: true
        },
        city: {
            type: String,
            // required: function() { return this.role === 'vendor'; }, // REMOVED THIS LINE
            trim: true
        },
        state: {
            type: String,
            // required: function() { return this.role === 'vendor'; }, // REMOVED THIS LINE
            trim: true
        },
        pincode: {
            type: String,
            // required: function() { return this.role === 'vendor'; }, // REMOVED THIS LINE
            trim: true
        },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number }
        }
    },
    businessType: {
        type: String,
        required: function() { return this.role === 'vendor'; },
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true
    },
    fssaiLicense: {
        type: String,
        trim: true
    },
    businessHours: {
        opening: { type: String, trim: true },
        closing: { type: String, trim: true },
        daysOpen: [{ type: String, trim: true }]
    },

    // Fields specific to 'admin' role
    adminLevel: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        required: function() { return this.role === 'admin'; },
        trim: true
    },
    permissions: [{
        type: String,
        trim: true
    }],

}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);