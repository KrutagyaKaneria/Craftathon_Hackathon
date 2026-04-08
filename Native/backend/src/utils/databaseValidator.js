import mongoose from 'mongoose';
import { Session } from '../models/Session.js';
import { Driver } from '../models/Driver.js';
import { Vehicle } from '../models/Vehicle.js';
import { Telemetry } from '../models/Telemetry.js';

/**
 * Database Validation Utility
 * Ensures all required collections exist and are writable before allowing operations
 * Prevents silent failures from misconfigured schemas or full databases
 */

/**
 * Validate database connection and collections
 * @returns {Promise<Object>} Validation result with status and errors
 */
export async function validateDatabaseSetup() {
  console.log('🔍 Starting comprehensive database validation...\n');
  
  const errors = [];
  const warnings = [];
  const successful = [];

  try {
    // Step 1: Verify connection
    console.log('1️⃣  Testing MongoDB connection...');
    if (!mongoose.connection || mongoose.connection.readyState === 0) {
      errors.push('❌ MongoDB connection not established');
      return {
        success: false,
        errors,
        warnings,
        successful,
      };
    }
    successful.push('✅ Connected to MongoDB');
    console.log('   ✅ Connected');

    // Step 2: Verify database exists and is accessible
    console.log('\n2️⃣  Verifying database accessibility...');
    
    if (!mongoose.connection.db) {
      errors.push('❌ Database instance not initialized yet');
      console.log('   ❌ Database instance not ready');
      return {
        success: false,
        errors,
        warnings,
        successful,
      };
    }
    
    const adminDb = mongoose.connection.db.admin();
    try {
      const dbInfo = await adminDb.ping();
      if (!dbInfo.ok) {
        errors.push('❌ Database ping failed - database may not be accessible');
      } else {
        successful.push('✅ Database is accessible');
        console.log('   ✅ Database Accessible');
      }
    } catch (pingError) {
      errors.push(`❌ Failed to ping database: ${pingError.message}`);
    }

    // Step 3: Verify required collections
    console.log('\n3️⃣  Verifying required collections...');
    const requiredCollections = ['sessions', 'drivers', 'vehicles', 'telemetry'];
    const existingCollections = await mongoose.connection.db.listCollections().toArray();
    const existingNames = existingCollections.map((c) => c.name);

    for (const collectionName of requiredCollections) {
      if (!existingNames.includes(collectionName)) {
        warnings.push(`⚠️  Collection "${collectionName}" does not exist yet (will be created on first write)`);
        console.log(`   ⚠️  ${collectionName} - Will be created on first write`);
      } else {
        successful.push(`✅ Collection "${collectionName}" exists`);
        console.log(`   ✅ ${collectionName} - Exists`);
      }
    }

    // Step 4: Test write permissions on each collection
    console.log('\n4️⃣  Testing write permissions...');
    const collections = [
      { name: 'sessions', model: Session },
      { name: 'drivers', model: Driver },
      { name: 'vehicles', model: Vehicle },
      { name: 'telemetry', model: Telemetry },
    ];

    for (const { name, model } of collections) {
      try {
        // Create a test document
        const testDoc = await model.collection.insertOne({
          __test_write__: true,
          timestamp: new Date(),
        });

        // Clean up - delete test document
        await model.collection.deleteOne({ _id: testDoc.insertedId });

        successful.push(`✅ Write test successful for "${name}"`);
        console.log(`   ✅ ${name} - Write OK`);
      } catch (writeError) {
        errors.push(
          `❌ Cannot write to collection "${name}": ${writeError.message}`
        );
        console.log(`   ❌ ${writeError.message}`);
      }
    }

    // Step 5: Verify indexes exist
    console.log('\n5️⃣  Verifying required indexes...');
    try {
      const sessionIndexes = await Session.collection.getIndexes();
      if (Object.keys(sessionIndexes).length > 1) {
        successful.push('✅ Session collection indexes are set up');
        console.log('   ✅ Session indexes OK');
      }

      const telemetryIndexes = await Telemetry.collection.getIndexes();
      // Should have at least sessionId index and TTL index
      const hasTTL = Object.values(telemetryIndexes).some((idx) => idx.expireAfterSeconds);
      if (hasTTL) {
        successful.push('✅ Telemetry TTL index is configured');
        console.log('   ✅ Telemetry TTL index OK');
      } else {
        warnings.push('⚠️  Telemetry TTL index not found (auto-cleanup disabled)');
        console.log('   ⚠️  No TTL index found');
      }
    } catch (indexError) {
      warnings.push(`⚠️  Could not verify indexes: ${indexError.message}`);
    }

    // Step 6: Check database storage stats
    console.log('\n6️⃣  Checking database storage...');
    try {
      const dbStats = await mongoose.connection.db.stats();
      const storageGB = dbStats.storageSize / (1024 * 1024 * 1024);
      const dataGB = dbStats.dataSize / (1024 * 1024 * 1024);

      console.log(`   Storage Used: ${storageGB.toFixed(2)} GB`);
      console.log(`   Data Size: ${dataGB.toFixed(2)} GB`);

      successful.push(`✅ Database storage stats: ${storageGB.toFixed(2)} GB used`);

      // Warn if storage getting full (assuming 5GB limit for development)
      if (storageGB > 4) {
        warnings.push(
          `⚠️  Database storage is ${storageGB.toFixed(2)} GB (limit ~5GB). Consider cleanup.`
        );
      }
    } catch (statsError) {
      warnings.push(`⚠️  Could not retrieve storage stats: ${statsError.message}`);
    }
  } catch (error) {
    errors.push(`❌ Unexpected validation error: ${error.message}`);
    console.error('   ❌ Unexpected error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Successful Checks:');
    successful.forEach((msg) => console.log(`   ${msg}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((msg) => console.log(`   ${msg}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((msg) => console.log(`   ${msg}`));
  }

  console.log('='.repeat(60) + '\n');

  return {
    success: errors.length === 0,
    errors,
    warnings,
    successful,
    isReadyForSessions: errors.length === 0, // Strict: no sessions without all checks passing
  };
}

/**
 * Verify database is ready before allowing session operations
 * Called before session creation
 * @returns {Promise<boolean>} True if database is ready and valid
 */
export async function isDatabaseReadyForSessions() {
  try {
    // Quick check: can we write?
    const testCollection = mongoose.connection.db.collection('_db_health_check');
    const testId = `health_check_${Date.now()}`;

    // Try atomic operation
    const result = await testCollection.updateOne(
      { _id: testId },
      { $set: { timestamp: new Date() } },
      { upsert: true }
    );

    // Clean up
    await testCollection.deleteOne({ _id: testId });

    return result.acknowledged === true;
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

/**
 * Get database diagnostic information
 * Useful for monitoring and troubleshooting
 * @returns {Promise<Object>} Diagnostic info
 */
export async function getDatabaseDiagnostics() {
  const diagnostics = {
    connectionStatus: 'unknown',
    dbName: 'unknown',
    collectionsCount: 0,
    storageUsed: 0,
    dataSize: 0,
    indexCount: 0,
    errors: [],
  };

  try {
    // Connection status
    diagnostics.connectionStatus =
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Database name
    diagnostics.dbName = mongoose.connection.db.getName();

    // Collection count
    const collections = await mongoose.connection.db.listCollections().toArray();
    diagnostics.collectionsCount = collections.length;

    // Storage stats
    const dbStats = await mongoose.connection.db.stats();
    diagnostics.storageUsed = dbStats.storageSize;
    diagnostics.dataSize = dbStats.dataSize;
    diagnostics.indexCount = dbStats.indexes;
  } catch (error) {
    diagnostics.errors.push(error.message);
  }

  return diagnostics;
}
