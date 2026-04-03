/**
 * Seed Script
 * Populates the database with real vehicle and user data
 * Run with: node src/scripts/seed.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb+srv://arjun:Test%4012345@driveguard.vf8up.mongodb.net/driveguard?retryWrites=true&w=majority&appName=DriveGuard';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Vehicle.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users (drivers)
    const drivers = await User.insertMany([
      {
        email: 'marcus.thorne@driveguard.com',
        password: 'securePassword123',
        firstName: 'Marcus',
        lastName: 'Thorne',
        phone: '+1 (555) 123-4567',
        isActive: true,
      },
      {
        email: 'sarah.jenkins@driveguard.com',
        password: 'securePassword123',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        phone: '+1 (555) 234-5678',
        isActive: true,
      },
      {
        email: 'elena.rodriguez@driveguard.com',
        password: 'securePassword123',
        firstName: 'Elena',
        lastName: 'Rodriguez',
        phone: '+1 (555) 345-6789',
        isActive: true,
      },
      {
        email: 'james.wilson@driveguard.com',
        password: 'securePassword123',
        firstName: 'James',
        lastName: 'Wilson',
        phone: '+1 (555) 456-7890',
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${drivers.length} drivers`);

    // Create vehicles
    const vehicles = await Vehicle.insertMany([
      {
        vehicle_number: 'DG-001',
        vehicle_name: 'Unit Alpha 1',
        model: 'Tesla Model 3',
        year: 2024,
        vin: '5TDJKRFH0L0456789',
        status: 'active',
        protocol_status: 'ACTIVE',
        safety_rating: 92,
        fuel_level: 85,
        mileage: 15420,
        last_active: new Date(),
        in_transit: true,
        location: { type: 'Point', coordinates: [-73.9352, 40.7306] },
        maintenance_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assigned_driver: drivers[0]._id,
        recent_performance: [95, 93, 91, 94, 92, 93, 94],
      },
      {
        vehicle_number: 'DG-002',
        vehicle_name: 'Unit Bravo 2',
        model: 'Tesla Model Y',
        year: 2023,
        vin: '5TDJKRFH1L0456789',
        status: 'active',
        protocol_status: 'ACTIVE',
        safety_rating: 88,
        fuel_level: 72,
        mileage: 32156,
        last_active: new Date(Date.now() - 5 * 60000),
        in_transit: false,
        location: { type: 'Point', coordinates: [-73.9876, 40.7489] },
        maintenance_due: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        assigned_driver: drivers[1]._id,
        recent_performance: [87, 88, 86, 89, 87, 88, 86],
      },
      {
        vehicle_number: 'DG-003',
        vehicle_name: 'Unit Charlie 3',
        model: 'Tesla Model S',
        year: 2024,
        vin: '5TDJKRFH2L0456789',
        status: 'active',
        protocol_status: 'ACTIVE',
        safety_rating: 95,
        fuel_level: 91,
        mileage: 8742,
        last_active: new Date(Date.now() - 2 * 60000),
        in_transit: true,
        location: { type: 'Point', coordinates: [-73.9776, 40.7614] },
        maintenance_due: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        assigned_driver: drivers[2]._id,
        recent_performance: [94, 96, 95, 94, 96, 95, 94],
      },
      {
        vehicle_number: 'DG-004',
        vehicle_name: 'Unit Delta 4',
        model: 'Chevrolet Bolt',
        year: 2022,
        vin: '5TDJKRFH3L0456789',
        status: 'active',
        protocol_status: 'DIAGNOSTIC',
        safety_rating: 82,
        fuel_level: 45,
        mileage: 54230,
        last_active: new Date(Date.now() - 15 * 60000),
        in_transit: false,
        location: { type: 'Point', coordinates: [-73.9876, 40.7505] },
        maintenance_due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assigned_driver: drivers[3]._id,
        recent_performance: [81, 82, 80, 83, 81, 82, 80],
      },
      {
        vehicle_number: 'DG-005',
        vehicle_name: 'Unit Echo 5',
        model: 'Tesla Model X',
        year: 2024,
        vin: '5TDJKRFH4L0456789',
        status: 'active',
        protocol_status: 'ACTIVE',
        safety_rating: 90,
        fuel_level: 88,
        mileage: 22156,
        last_active: new Date(Date.now() - 1 * 60000),
        in_transit: true,
        location: { type: 'Point', coordinates: [-73.9456, 40.7580] },
        maintenance_due: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        assigned_driver: drivers[0]._id,
        recent_performance: [91, 89, 92, 90, 91, 92, 89],
      },
    ]);
    console.log(`✅ Created ${vehicles.length} vehicles`);

    // Display summary
    console.log('\n📊 Database Seeded Successfully!');
    console.log(`   - Drivers: ${drivers.length}`);
    console.log(`   - Vehicles: ${vehicles.length}`);
    console.log('\n🚗 Vehicles Created:');
    vehicles.forEach(v => {
      console.log(`   ✓ ${v.vehicle_number} - ${v.vehicle_name}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Seed completed and connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
