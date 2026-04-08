/**
 * Vehicle Auto-Release Utility
 * Automatically releases vehicles that have been "in-use" without recent updates
 * Prevents vehicles from getting stuck in locked state due to crashed sessions
 */

const VEHICLE_RELEASE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes without activity = auto-release
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run cleanup every 5 minutes

let cleanupIntervalId = null;

/**
 * Start the automatic vehicle release timer
 * Runs periodically to release vehicles that have been inactive
 */
export const startVehicleAutoReleaseTimer = async () => {
  console.log('⏱️  Starting vehicle auto-release timer...');
  console.log(`   Release timeout: ${VEHICLE_RELEASE_TIMEOUT_MS / 1000 / 60} minutes`);
  console.log(`   Cleanup interval: ${CLEANUP_INTERVAL_MS / 1000 / 60} minutes`);

  // Run immediately on start
  await releaseStuckVehicles();

  // Then run periodically
  cleanupIntervalId = setInterval(async () => {
    await releaseStuckVehicles();
  }, CLEANUP_INTERVAL_MS);
};

/**
 * Stop the automatic vehicle release timer
 */
export const stopVehicleAutoReleaseTimer = () => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('⏹️  Vehicle auto-release timer stopped');
  }
};

/**
 * Release all vehicles that have been "in-use" without recent updates
 */
export const releaseStuckVehicles = async () => {
  try {
    const { Vehicle } = await import('../models/Vehicle.js');
    const { Session } = await import('../models/Session.js');

    const now = new Date();
    const staleThreshold = new Date(now - VEHICLE_RELEASE_TIMEOUT_MS);

    console.log(`\n🔍 Checking for stuck vehicles (stale since ${staleThreshold.toISOString()})...`);

    // Find all vehicles that are "in-use" and haven't been updated recently
    const stuckVehicles = await Vehicle.find({
      status: 'in-use',
      last_active: { $lt: staleThreshold }
    }).lean();

    if (stuckVehicles.length === 0) {
      console.log('✅ No stuck vehicles found');
      return;
    }

    console.log(`⚠️  Found ${stuckVehicles.length} stuck vehicle(s). Releasing now...`);

    // Release each stuck vehicle
    for (const vehicle of stuckVehicles) {
      try {
        // Check if there's still an active session for this vehicle
        const activeSession = await Session.findOne({
          vehicleId: vehicle._id,
          status: 'active'
        }).lean();

        if (activeSession) {
          console.log(`   ⏳ Vehicle ${vehicle.vehicle_number} has active session (${activeSession._id}), skipping...`);
          // Don't force release if there's an active session
          continue;
        }

        // Release the vehicle
        const updated = await Vehicle.findByIdAndUpdate(
          vehicle._id,
          {
            status: 'available',
            assigned_driver: null,
            in_transit: false,
            last_active: new Date()
          },
          { new: true }
        );

        console.log(`   ✅ Released vehicle: ${updated.vehicle_number}`);
        console.log(`      Last active: ${vehicle.last_active.toISOString()}`);
        console.log(`      Time stuck: ${Math.round((now - vehicle.last_active) / 1000 / 60)} minutes`);

      } catch (error) {
        console.error(`   ❌ Error releasing vehicle ${vehicle.vehicle_number}:`, error.message);
      }
    }

    console.log(`✅ Vehicle release check completed\n`);

  } catch (error) {
    console.error('❌ Error in vehicle auto-release cleanup:', error.message);
  }
};

export default {
  startVehicleAutoReleaseTimer,
  stopVehicleAutoReleaseTimer,
  releaseStuckVehicles,
};
