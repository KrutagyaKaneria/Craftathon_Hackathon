import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Session } from '../models/Session.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedSessions = async () => {
  try {
    console.log('🌱 Starting sessions seeding...');
    await connectDB();

    // Clear existing sessions
    await Session.deleteMany({});
    console.log('🧹 Cleared existing sessions');

    // Sample sessions data
    const sessionsData = [
      {
        driverName: 'Vikram Singh',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-TRUCK-084',
        vehicleModel: 'Scania',
        status: 'active',
        startTime: new Date(Date.now() - 8.5 * 60 * 60 * 1000),
        safetyScore: 100,
        alertsCount: 0,
        duration: 510, // 8.5 hours in minutes
        heartRate: null,
        eyeTracking: null,
        lastBreak: null,
        alert: null,
      },
      {
        driverName: 'Elena Rodriguez',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-VAN-912',
        vehicleModel: 'MAN',
        status: 'active',
        startTime: new Date(Date.now() - 3.33 * 60 * 60 * 1000),
        safetyScore: 74,
        alertsCount: 1,
        duration: 200, // 3h 20m in minutes
        heartRate: 112,
        eyeTracking: 'Unfocused',
        lastBreak: '4h 12m ago',
        alert: {
          type: 'FATIGUE_DETECTED',
          level: 2,
          severity: 'high',
        },
      },
      {
        driverName: 'Marcus Thorne',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-TRUCK-011',
        vehicleModel: 'Scania',
        status: 'active',
        startTime: new Date(Date.now() - 2.93 * 60 * 60 * 1000),
        safetyScore: 90,
        alertsCount: 0,
        duration: 176, // 2h 56m in minutes
        heartRate: null,
        eyeTracking: null,
        lastBreak: null,
        alert: null,
      },
      {
        driverName: 'Sarah Jenkins',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-VAN-245',
        vehicleModel: 'Ford',
        status: 'active',
        startTime: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
        safetyScore: 85,
        alertsCount: 1,
        duration: 330, // 5h 30m in minutes
        heartRate: 98,
        eyeTracking: 'Focused',
        lastBreak: '2h 45m ago',
        alert: {
          type: 'SPEEDING_VIOLATION',
          level: 1,
          severity: 'medium',
        },
      },
      {
        driverName: 'James Wilson',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-TRUCK-567',
        vehicleModel: 'Volvo',
        status: 'ended',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 16 * 60 * 60 * 1000),
        safetyScore: 95,
        alertsCount: 0,
        duration: 480, // 8 hours in minutes
        heartRate: null,
        eyeTracking: null,
        lastBreak: null,
        alert: null,
      },
      {
        driverName: 'Priya Kapoor',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-VAN-789',
        vehicleModel: 'Tata',
        status: 'ended',
        startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 40 * 60 * 60 * 1000),
        safetyScore: 88,
        alertsCount: 1,
        duration: 480, // 8 hours in minutes
        heartRate: null,
        eyeTracking: null,
        lastBreak: null,
        alert: null,
      },
      {
        driverName: 'Mohammad Ahmed',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-TRUCK-111',
        vehicleModel: 'Ashok Leyland',
        status: 'active',
        startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        safetyScore: 92,
        alertsCount: 0,
        duration: 90, // 1h 30m in minutes
        heartRate: null,
        eyeTracking: null,
        lastBreak: null,
        alert: null,
      },
      {
        driverName: 'Rajesh Kumar',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-VAN-333',
        vehicleModel: 'Mahindra',
        status: 'active',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        safetyScore: 70,
        alertsCount: 2,
        duration: 240, // 4 hours in minutes
        heartRate: 125,
        eyeTracking: 'Unfocused',
        lastBreak: '5h ago',
        alert: {
          type: 'AGGRESSIVE_ACCELERATION',
          level: 3,
          severity: 'high',
        },
      },
      {
        driverName: 'Anjali Singh',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-TRUCK-444',
        vehicleModel: 'Bharat Benz',
        status: 'ended',
        startTime: new Date(Date.now() - 72 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 64 * 60 * 60 * 1000),
        safetyScore: 96,
        alertsCount: 0,
        duration: 480, // 8 hours in minutes
        heartRate: null,
        eyeTracking: null,
        lastBreak: null,
        alert: null,
      },
      {
        driverName: 'David Chen',
        driverPhoto: null,
        vehicleNumber: 'SENTINEL-VAN-555',
        vehicleModel: 'Hyundai',
        status: 'active',
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        safetyScore: 78,
        alertsCount: 1,
        duration: 180, // 3 hours in minutes
        heartRate: 108,
        eyeTracking: 'Closed',
        lastBreak: '3h 15m ago',
        alert: {
          type: 'DROWSINESS_DETECTED',
          level: 2,
          severity: 'high',
        },
      },
    ];

    const createdSessions = await Session.insertMany(sessionsData);
    console.log(`✅ Created ${createdSessions.length} sessions`);

    // Log summary
    const activeSessions = createdSessions.filter((s) => s.status === 'active');
    const endedSessions = createdSessions.filter((s) => s.status === 'ended');
    console.log(`\n📊 Sessions Summary:`);
    console.log(`   Active: ${activeSessions.length}`);
    console.log(`   Ended: ${endedSessions.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sessions:', error);
    process.exit(1);
  }
};

// Run the seeding
seedSessions();
