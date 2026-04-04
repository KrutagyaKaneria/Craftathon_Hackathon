import { connectDB } from './src/config/database.js';
import { Vehicle } from './src/models/Vehicle.js';
import { Driver } from './src/models/Driver.js';
import { generateRandomVehicles } from './src/utils/vehicleGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fresh Diverse Vehicle Seeding Script
 * CLEARS all old vehicles and creates NEW unique vehicles with DIFFERENT data
 * Each vehicle gets: Different model, different year, different safety, different fuel, etc.
 */
const seedFreshDiverseVehicles = async () => {
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
      
      // Clear all old vehicles for this owner
      const deletedCount = await Vehicle.deleteMany({ ownerId });
      console.log(`   🗑️  Cleared ${deletedCount.deletedCount} old vehicles\n`);
      
      console.log(`   🚀 Creating 6 COMPLETELY UNIQUE vehicles with DIFFERENT data...\n`);

      // Generate 6 completely different vehicles - EACH ONE DIFFERENT!
      const randomFleet = generateRandomVehicles(ownerId, 6);

      let vehicleNum = 1;
      for (const vehicleData of randomFleet) {
        try {
          // Ensure unique vehicle number
          vehicleData.vehicle_number = `BUS-${ownerId.toString().slice(-4)}-${String(vehicleNum).padStart(2, '0')}`;
          vehicleNum++;
          
          const vehicle = new Vehicle({ 
            ...vehicleData,
            ownerId 
          });
          
          await vehicle.save();
          
          console.log(`   ✅ ${vehicle.vehicle_number} - UNIQUE DATA`);
          console.log(`      🚗 Model: ${vehicle.model}`);
          console.log(`      📅 Year: ${vehicle.year}`);
          console.log(`      ⚖️  Safety: ${vehicle.safety_rating}% | 🔋 Fuel: ${vehicle.fuel_level}% | 📍 Mileage: ${vehicle.mileage}km`);
          console.log(`      📊 Status: ${vehicle.status} | 🔄 Protocol: ${vehicle.protocol_status}`);
          console.log(`      📌 Location: ${vehicle.location.coordinates[0].toFixed(4)}, ${vehicle.location.coordinates[1].toFixed(4)}`);
          console.log(`      💬 Condition: ${vehicle.notes}`);
          console.log(`      📈 Performance: [${vehicle.recent_performance.join(', ')}]\n`);
          
        } catch (err) {
          console.log(`   ❌ Error: ${err.message}\n`);
        }
      }

      // Print summary for this owner
      const totalCount = await Vehicle.countDocuments({ ownerId });
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   📊 SUMMARY: Owner now has ${totalCount} UNIQUE vehicles`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    console.log('✅ ✅ ✅ FRESH DIVERSE SEEDING COMPLETED! ✅ ✅ ✅');
    console.log('\n💡 Each vehicle has:');
    console.log('   ✓ Different model (Volvo, Scania, Mercedes, Tata, Ashok, Eicher, Hino, MAN)');
    console.log('   ✓ Different year (2019-2026)');
    console.log('   ✓ Different safety rating (62%-95%)');
    console.log('   ✓ Different fuel level (10%-95%)');
    console.log('   ✓ Different mileage (5,000-120,000 km)');
    console.log('   ✓ Different location (8 different Ahmedabad zones)');
    console.log('   ✓ Different status & protocol');
    console.log('   ✓ Different condition notes');
    console.log('   ✓ Different 7-day performance history\n');
    
    console.log('🎉 Now open the app and see each vehicle with COMPLETELY DIFFERENT DATA!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedFreshDiverseVehicles();
