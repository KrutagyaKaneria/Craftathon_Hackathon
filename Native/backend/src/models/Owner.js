import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

/**
 * Owner Schema
 * Stores company/owner information
 */
const OwnerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false //Don't include password by default
    },
    firstName: {
      type: String,
      default: ''
    },
    lastName: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    profilePhoto: {
      type: String, // Base64 encoded image data
      default: null,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Statistics
    totalDrivers: {
      type: Number,
      default: 0
    },
    totalVehicles: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
OwnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
OwnerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export const Owner = mongoose.model('Owner', OwnerSchema);
