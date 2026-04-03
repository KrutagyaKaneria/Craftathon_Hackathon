import { connectDB } from './src/config/database.js';
import { Driver } from './src/models/Driver.js';
import { Vehicle } from './src/models/Vehicle.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seeder script to provide sample buses for all existing drivers
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
    console.log(`✅ Found ${uniqueOwnerIds.length} unique owners.`);

    for (const ownerId of uniqueOwnerIds) {
      console.log(`🚌 Checking buses for owner: ${ownerId}`);
      
      const existingCount = await Vehicle.countDocuments({ ownerId });
      if (existingCount >= 3) {
        console.log(`   - Owner already has ${existingCount} buses. Skipping...`);
        // Just ensure they are 'available'
        await Vehicle.updateMany({ ownerId }, { status: 'available' });
        continue;
      }

      const needed = 3 - existingCount;
      console.log(`   - Creating ${needed} sample buses...`);

      const sampleData = [
        { 
          vehicle_number: `BUS-${ownerId.slice(-4)}-01`, 
          vehicle_name: 'Metro Transit Pulsar', 
          model: 'Volvo 9400 B11R', 
          year: 2023, 
          status: 'available', 
          fuel_level: 85, 
          mileage: 12500, 
          safety_rating: 92 
        },
        { 
          vehicle_number: `BUS-${ownerId.slice(-4)}-02`, 
          vehicle_name: 'City Link Connect', 
          model: 'Scania Metroliner', 
          year: 2022, 
          status: 'available', 
          fuel_level: 65, 
          mileage: 25000, 
          safety_rating: 88 
        },
        { 
          vehicle_number: `BUS-${ownerId.slice(-4)}-03`, 
          vehicle_name: 'InterCity Voyager', 
          model: 'Mercedes-Benz Travego', 
          year: 2024, 
          status: 'available', 
          fuel_level: 95, 
          mileage: 5000, 
          safety_rating: 95 
        }
      ].slice(0, needed);

      for (const v of sampleData) {
        await Vehicle.create({ ownerId, ...v });
        console.log(`     ✓ Created: ${v.vehicle_number}`);
      }
    }

    console.log('\n🌟 Database seeding complete. Refresh your vehicle selection screen!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedBuses();
