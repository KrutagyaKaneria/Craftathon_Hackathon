import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
      required: [true, 'Owner ID is required'],
      index: true
    },
    vehicle_number: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      match: [/^[A-Za-z0-9\-]+$/, 'Vehicle number must contain only letters, numbers, and hyphens']
    },
    vehicle_name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true
    },
    vin: {
      type: String,
      sparse: true,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'decommissioned'],
      default: 'active'
    },
    protocol_status: {
      type: String,
      enum: ['ACTIVE', 'IDLE', 'DIAGNOSTIC', 'OFFLINE'],
      default: 'ACTIVE'
    },
    safety_rating: {
      type: Number,
      min: 0,
      max: 100,
      default: 85
    },
    fuel_level: {
      type: Number,
      min: 0,
      max: 100,
      default: 75
    },
    mileage: {
      type: Number,
      default: 0,
      min: 0
    },
    last_active: {
      type: Date,
      default: Date.now
    },
    in_transit: {
      type: Boolean,
      default: false
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    assigned_driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      sparse: true
    },
    maintenance_due: {
      type: Date,
      sparse: true
    },
    notes: {
      type: String,
      trim: true
    },
    recent_performance: {
      type: [Number], // Array of recent performance metrics (0-100)
      default: [85, 87, 88, 86, 89, 87, 88]
    }
  },
  {
    timestamps: true,
    indexes: [
      { 'location': '2dsphere' }, // For geospatial queries
      { 'ownerId': 1, 'vehicle_number': 1, unique: true } // Compound unique index
    ]
  }
);

export const Vehicle = mongoose.model('Vehicle', VehicleSchema);
