import mongoose from 'mongoose';
import { Vehicle } from './src/models/Vehicle.js';
import dotenv from 'dotenv';

dotenv.config();

const resetVehicleStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/driver_safety');
    console.log('✅ Connected to MongoDB');

    // Reset all vehicles to available status
    const result = await Vehicle.updateMany(
      {},
      {
        status: 'available',
        assigned_driver: null,
        in_transit: false,
        last_active: new Date()
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} vehicles to "available" status`);
    console.log(`📊 Total vehicles affected: ${result.matchedCount}`);

    // Fetch and display all vehicles
    const allVehicles = await Vehicle.find({}).lean();
    console.log('\n📋 All vehicles:');
    allVehicles.forEach(vehicle => {
      console.log(`  - ${vehicle.vehicle_number} (${vehicle.vehicle_name}): ${vehicle.status}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! All buses are now available for selection.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting vehicle status:', error.message);
    process.exit(1);
  }
};

resetVehicleStatus();
