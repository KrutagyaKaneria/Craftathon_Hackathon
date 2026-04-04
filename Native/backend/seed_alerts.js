import { connectDB } from './src/config/database.js';
import { Driver } from './src/models/Driver.js';
import { Alert } from './src/models/Alert.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seeder script to create test alerts for drivers
 * This will create alerts with various severity levels to demonstrate dynamic safety scoring
 */
const seedAlerts = async () => {
  try {
    await connectDB();
    console.log('🔍 Finding drivers with no alerts...');
    
    const drivers = await Driver.find({});
    if (drivers.length === 0) {
      console.log('⚠️ No drivers found in DB. Please create drivers first.');
      process.exit(0);
    }

    console.log(`✅ Found ${drivers.length} drivers. Creating test alerts...`);

    // Define test data for alerts
    const alertPatterns = [
      // Driver 1: Good driver (only 1 low alert)
      {
        pattern: [{ severity: 'low', eventType: 'fatigue' }],
        expectedScore: 97, // 100 - (1*3) = 97
      },
      // Driver 2: Medium driver (1 high + 1 medium alert)
      {
        pattern: [
          { severity: 'high', eventType: 'rash_driving' },
          { severity: 'medium', eventType: 'speed_violation' },
        ],
        expectedScore: 77, // 100 - (1*15) - (1*8) = 77
      },
      // Driver 3: Poor driver (2 high alerts)
      {
        pattern: [
          { severity: 'high', eventType: 'eye_closure' },
          { severity: 'high', eventType: 'rash_driving' },
        ],
        expectedScore: 70, // 100 - (2*15) = 70
      },
      // Driver 4: Critical driver (3 high + 1 medium alerts)
      {
        pattern: [
          { severity: 'high', eventType: 'eye_closure' },
          { severity: 'high', eventType: 'rash_driving' },
          { severity: 'high', eventType: 'fatigue' },
          { severity: 'medium', eventType: 'speed_violation' },
        ],
        expectedScore: 37, // 100 - (3*15) - (1*8) = 37
      },
      // Driver 5: Mixed alerts
      {
        pattern: [
          { severity: 'high', eventType: 'eye_closure' },
          { severity: 'medium', eventType: 'speed_violation' },
          { severity: 'medium', eventType: 'fatigue' },
          { severity: 'low', eventType: 'other' },
        ],
        expectedScore: 67, // 100 - (1*15) - (2*8) - (1*3) = 67
      },
    ];

    let totalCreated = 0;

    for (let driverIndex = 0; driverIndex < drivers.length; driverIndex++) {
      const driver = drivers[driverIndex];
      const ownerId = driver.ownerId;

      // Cycle through alert patterns
      const patternIndex = driverIndex % alertPatterns.length;
      const { pattern, expectedScore } = alertPatterns[patternIndex];

      console.log(`\n👤 Driver ${driverIndex + 1}: ${driver.firstName} ${driver.lastName}`);
      console.log(`   Expected Safety Score: ${expectedScore}%`);

      // Check if alerts already exist for this driver
      const existingAlerts = await Alert.find({ driverId: driver._id });
      if (existingAlerts.length > 0) {
        console.log(`   ⏭️  Already has ${existingAlerts.length} alerts. Skipping...`);
        continue;
      }

      // Create alerts for this driver
      const alerts = pattern.map((alertData, index) => ({
        ownerId: ownerId.toString(),
        driverId: driver._id,
        vehicleId: null, // No specific vehicle for test alerts
        sessionId: null, // No specific session for test alerts
        driverName: `${driver.firstName} ${driver.lastName}`,
        vehicleNumber: 'TEST-ALERT',
        vehicleModel: 'N/A',
        eventType: alertData.eventType,
        subtype: `${alertData.eventType.toUpperCase()} Event ${index + 1}`,
        severity: alertData.severity,
        timestamp: new Date(Date.now() - (index + 1) * 60 * 60 * 1000), // Stagger timestamps
        telemetryData: {
          speed: Math.random() * 100,
          location: [72.5 + Math.random() * 0.5, 23.1 + Math.random() * 0.5],
        },
        driverPhoto: null,
        resolved: false,
        resolvedAt: null,
        resolvedBy: null,
        notes: `Test alert for safety score calculation (${alertData.severity})`,
        dismissedAt: null,
      }));

      // Insert alerts
      const created = await Alert.insertMany(alerts);
      console.log(`   ✅ Created ${created.length} alerts (${pattern.map(p => p.severity).join(', ')})`);
      totalCreated += created.length;
    }

    console.log(`\n✨ Seed completed! Created ${totalCreated} total test alerts.`);
    console.log('\n📊 Safety Scores Expected:');
    drivers.slice(0, alertPatterns.length).forEach((driver, index) => {
      console.log(`   ${driver.firstName}: ${alertPatterns[index % alertPatterns.length].expectedScore}%`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAlerts();
