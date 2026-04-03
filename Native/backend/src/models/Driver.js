import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

/**
 * Driver Schema
 * Stores driver information with reference to owner
 */
const DriverSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
      required: [true, 'Owner ID is required'],
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
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
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      default: '',
      trim: true
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
    licenseNumber: {
      type: String,
      sparse: true,
      trim: true
    },
    licenseExpiry: {
      type: Date
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Statistics
    totalTrips: {
      type: Number,
      default: 0
    },
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    isOnDuty: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for uniqueness per owner
DriverSchema.index({ ownerId: 1, email: 1 }, { unique: true });

// Hash password before saving
DriverSchema.pre('save', async function (next) {
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
DriverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export const Driver = mongoose.model('Driver', DriverSchema);
