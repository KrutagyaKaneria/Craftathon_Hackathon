import { connectDB } from './src/config/database.js';
import { Driver } from './src/models/Driver.js';
import { Vehicle } from './src/models/Vehicle.js';
import { generateRandomVehicleData, generateRandomVehicles } from './src/utils/vehicleGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seeder script to provide diverse sample vehicles for all existing drivers
 * Each vehicle gets UNIQUE, RANDOM data - no duplicates!
 */
const seedBuses = async () => {
  try {
    await connectDB();
    console.log('🔍 Identifying active drivers and owners...');
    
    const drivers = await Driver.find({});
    if (drivers.length === 0) {
      console.log('⚠️ No drivers found in DB. Please create a driver first.');
      process.exit(0);
    }

    const uniqueOwnerIds = [...new Set(drivers.map(d => d.ownerId.toString()))];
    console.log(`✅ Found ${uniqueOwnerIds.length} unique owners.\n`);

    for (const ownerId of uniqueOwnerIds) {
      console.log(`🚌 Processing Owner: ${ownerId}`);
      
      const existingCount = await Vehicle.countDocuments({ ownerId });
      if (existingCount >= 6) {
        console.log(`   ✓ Owner already has ${existingCount} vehicles. Skipping...\n`);
        continue;
      }

      const needed = 6 - existingCount;
      console.log(`   Creating ${needed} completely unique vehicles with different data...\n`);

      // Generate 6 completely unique vehicles - each with different random data!
      const randomFleet = generateRandomVehicles(ownerId, needed);

      for (let i = 0; i < randomFleet.length; i++) {
        try {
          const vehicleData = randomFleet[i];
          const vehicle = new Vehicle({ 
            ...vehicleData,
            ownerId 
          });
          
          await vehicle.save();
          
          console.log(`   ✅ ${vehicle.vehicle_number}`);
          console.log(`      Model: ${vehicle.model}`);
          console.log(`      Safety: ${vehicle.safety_rating}% | Fuel: ${vehicle.fuel_level}% | Mileage: ${vehicle.mileage}km`);
          console.log(`      Status: ${vehicle.status} | Protocol: ${vehicle.protocol_status}`);
          console.log(`      Condition: ${vehicle.notes}\n`);
          
        } catch (err) {
          if (!err.message.includes('duplicate')) {
            console.log(`   ⚠️  Error: ${err.message}`);
          } else {
            console.log(`   ⚠️  Vehicle already exists (skipped)`);
          }
        }
      }

      // Print summary for this owner
      const totalCount = await Vehicle.countDocuments({ ownerId });
      console.log(`   📊 Owner now has ${totalCount} total vehicles\n`);
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedBuses();
