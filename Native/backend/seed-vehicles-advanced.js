import { connectDB } from './src/config/database.js';
import { Vehicle } from './src/models/Vehicle.js';
import { Driver } from './src/models/Driver.js';
import {
  generateRandomVehicleData,
  generateRandomVehicles,
  vehicleTemplates,
  createStandardFleet,
  createVehicleObject
} from './src/utils/vehicleGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Advanced Vehicle Seeding Script
 * Demonstrates all ways to create vehicles using the new generator
 */

const seedAdvancedVehicles = async () => {
  try {
    await connectDB();
    console.log('🚀 Starting advanced vehicle seeding...\n');

    // Get drivers and owners
    const drivers = await Driver.find({});
    if (drivers.length === 0) {
      console.log('⚠️  No drivers found. Please seed drivers first.');
      process.exit(0);
    }

    const uniqueOwnerIds = [...new Set(drivers.map(d => d.ownerId.toString()))];
    console.log(`📊 Found ${uniqueOwnerIds.length} owners\n`);

    for (const ownerId of uniqueOwnerIds) {
      console.log(`\n🚌 Processing Owner: ${ownerId}`);
      console.log('═'.repeat(50));

      // Clear existing vehicles for this owner (optional)
      // await Vehicle.deleteMany({ ownerId });

      // ========== METHOD 1: Standard Fleet (Diverse vehicles) ==========
      console.log('\n📍 METHOD 1: Creating Standard Fleet (3 diverse vehicles)');
      const standardFleet = createStandardFleet(ownerId);

      for (const vehicleData of standardFleet) {
        try {
          const vehicle = new Vehicle({ ...vehicleData, ownerId });
          await vehicle.save();
          console.log(`   ✅ ${vehicle.vehicle_number}: ${vehicleData.notes}`);
        } catch (err) {
          if (!err.message.includes('duplicate')) {
            console.log(`   ⚠️  ${vehicleData.vehicle_number}: Already exists (skipped)`);
          }
        }
      }

      // ========== METHOD 2: Random Vehicles ==========
      console.log('\n📍 METHOD 2: Creating 3 Random Vehicles');
      const randomFleet = generateRandomVehicles(ownerId, 3);

      for (let i = 0; i < randomFleet.length; i++) {
        try {
          const vehicleData = randomFleet[i];
          // Adjust index to avoid conflicts with method 1
          vehicleData.vehicle_number = randomFleet[i].vehicle_number.replace(/(\d{2})$/, m => String(parseInt(m) + 3).padStart(2, '0'));
          
          const vehicle = new Vehicle({ ...vehicleData, ownerId });
          await vehicle.save();
          console.log(`   ✅ ${vehicle.vehicle_number}: ${vehicle.safety_rating}% Safety, ${vehicle.fuel_level}% Fuel, ${vehicle.mileage}km`);
        } catch (err) {
          if (!err.message.includes('duplicate')) {
            console.log(`   ⚠️  Error creating random vehicle`);
          }
        }
      }

      // ========== METHOD 3: Custom Template Usage ==========
      console.log('\n📍 METHOD 3: Creating Vehicles with Custom Templates');
      
      const customVehicles = [
        {
          data: vehicleTemplates.goodCondition(ownerId, 6),
          label: 'Good Condition'
        },
        {
          data: vehicleTemplates.needsMaintenance(ownerId, 7),
          label: 'Needs Maintenance'
        },
        {
          data: vehicleTemplates.inTransit(ownerId, 8),
          label: 'In Transit'
        },
      ];

      for (const { data, label } of customVehicles) {
        try {
          const vehicle = new Vehicle({ ...data, ownerId });
          await vehicle.save();
          console.log(`   ✅ ${vehicle.vehicle_number} (${label}): ${vehicle.notes}`);
        } catch (err) {
          if (!err.message.includes('duplicate')) {
            console.log(`   ⚠️  ${label}: Already exists (skipped)`);
          }
        }
      }

      // ========== METHOD 4: Manual Vehicle Creation ==========
      console.log('\n📍 METHOD 4: Creating Single Vehicle with Custom Data');
      
      try {
        const customData = createVehicleObject(
          `BUS-${ownerId.toString().slice(-4)}-09`,
          'Premium Fleet Vehicle',
          {
            safety_rating: 94,
            fuel_level: 88,
            mileage: 8500,
            notes: 'Premium vehicle for VIP service'
          }
        );
        
        const vehicle = new Vehicle({ ...customData, ownerId });
        await vehicle.save();
        console.log(`   ✅ ${vehicle.vehicle_number}: Premium vehicle created`);
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.log(`   ⚠️  Premium vehicle: Already exists (skipped)`);
        }
      }

      // ========== STATISTICS ==========
      const vehicleCount = await Vehicle.countDocuments({ ownerId });
      const avgSafety = await Vehicle.aggregate([
        { $match: { ownerId: require('mongoose').Types.ObjectId(ownerId) } },
        { $group: { _id: null, avg: { $avg: '$safety_rating' } } }
      ]);

      console.log('\n📈 Fleet Statistics:');
      console.log(`   Total Vehicles: ${vehicleCount}`);
      console.log(`   Avg Safety Rating: ${avgSafety[0]?.avg.toFixed(1)}%`);
      console.log('═'.repeat(50));
    }

    console.log('\n✅ Vehicle seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedAdvancedVehicles();
