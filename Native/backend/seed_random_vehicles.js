import { connectDB } from './src/config/database.js';
import { Driver } from './src/models/Driver.js';
import { Vehicle } from './src/models/Vehicle.js';
import { generateRandomVehicles } from './src/utils/vehicleGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seeder script to provide diverse random vehicles for all existing drivers/owners
 * Each vehicle gets random values from predefined arrays for:
 * - Status, Protocol Status, Fuel Level, Mileage, Safety Rating, Year, Model
 * - Location coordinates, VIN, Maintenance due date
 */
const seedRandomVehicles = async () => {
  try {
    await connectDB();
    console.log('🔍 Identifying active drivers and owners...');
    
    const drivers = await Driver.find({});
    if (drivers.length === 0) {
      console.log('⚠️ No drivers found in DB. Please create a driver first.');
      process.exit(0);
    }

    const uniqueOwnerIds = [...new Set(drivers.map(d => d.ownerId.toString()))];
    console.log(`✅ Found ${uniqueOwnerIds.length} unique owners.`);

    let totalCreated = 0;

    for (const ownerId of uniqueOwnerIds) {
      console.log(`\n🚌 Generating random vehicles for owner: ${ownerId}`);
      
      // Check existing vehicles
      const existingCount = await Vehicle.countDocuments({ ownerId });
      console.log(`   Currently has ${existingCount} vehicles`);

      // Generate 6 random vehicles per owner with diverse data
      const vehiclesCount = 6;
      const randomVehicles = generateRandomVehicles(ownerId, vehiclesCount);

      console.log(`   📋 Creating ${vehiclesCount} random vehicles with diverse data:`);
      randomVehicles.forEach((vehicle, idx) => {
        console.log(`      [${idx + 1}] ${vehicle.vehicle_name}`);
        console.log(`          • Model: ${vehicle.model} (${vehicle.year})`);
        console.log(`          • Status: ${vehicle.protocol_status} | Fuel: ${vehicle.fuel_level}% | Mileage: ${vehicle.mileage}km`);
        console.log(`          • Safety: ${vehicle.safety_rating}% | Location: [${vehicle.location.coordinates[1].toFixed(2)}, ${vehicle.location.coordinates[0].toFixed(2)}]`);
      });

      // Delete existing vehicles for this owner to replace with random ones
      if (existingCount > 0) {
        await Vehicle.deleteMany({ ownerId });
        console.log(`   🗑️  Deleted ${existingCount} existing vehicles`);
      }

      // Insert new random vehicles
      const created = await Vehicle.insertMany(randomVehicles);
      console.log(`   ✅ Created ${created.length} random vehicles with diverse data`);
      totalCreated += created.length;
    }

    console.log(`\n✨ Seed completed! Created ${totalCreated} total random vehicles.`);
    console.log('\n📊 Vehicle Data Diversity:');
    console.log('   ✓ Random Status (ACTIVE/IDLE/DIAGNOSTIC/OFFLINE)');
    console.log('   ✓ Random Fuel Levels (25%-95%)');
    console.log('   ✓ Random Mileage (5k-120k km)');
    console.log('   ✓ Random Safety Rating (62%-95%)');
    console.log('   ✓ Random Years (2019-2024)');
    console.log('   ✓ Random Model Types');
    console.log('   ✓ Random Locations with Coordinates');
    console.log('   ✓ Random Conditions (Good/Bad/Excellent/Medium/Fair/Poor)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedRandomVehicles();
