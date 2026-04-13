#!/usr/bin/env node
/**
 * Complete Flow Test: Signup -> Create Vehicle -> Fetch through Auth
 * Simulates: Owner signs up -> Creates vehicle -> Assigns driver -> Mobile app fetches vehicles
 */

const API_BASE_URL = 'http://10.44.202.155:5000';
const TEST_EMAIL = `owner-${Date.now()}@test.com`; // Use unique email each run
const TEST_PASSWORD = 'password123';

async function completeFlow() {
  console.log('🚀 COMPLETE WORKFLOW TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Backend URL: ${API_BASE_URL}`);
  console.log(`👤 Test Account: ${TEST_EMAIL}\n`);

  try {
    // STEP 1: Signup
    console.log('1️⃣  SIGNUP - Create Owner Account');
    console.log('─────────────────────────────────────────────────');
    
    const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: 'Fleet',
        lastName: 'Manager'
      })
    });

    const signupData = await signupResponse.json();
    if (!signupResponse.ok) {
      console.error('❌ Signup failed:', signupData);
      process.exit(1);
    }

    const ownerId = signupData.data.ownerId;
    const token = signupData.data.token;
    
    console.log('✅ Owner created successfully');
    console.log(`   ownerId: ${ownerId}`);
    console.log(`   token: ${token.substring(0, 40)}...\n`);

    // STEP 2: Create a vehicle
    console.log('2️⃣  CREATE VEHICLE - Add a vehicle to fleet');
    console.log('─────────────────────────────────────────────────');
    
    const vehicleData = {
      vehicle_name: '2024 Volvo',
      vehicle_number: 'TST-001',
      status: 'active',
      protocol_status: 'ACTIVE',
      safety_rating: 88,
      fuel_level: 95,
      mileage: 1250,
      location: { type: 'Point', coordinates: [40.7128, -74.0060] }
    };

    const createVehicleResponse = await fetch(`${API_BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vehicleData)
    });

    const createVehiclePayload = await createVehicleResponse.json();
    if (!createVehicleResponse.ok) {
      console.error('❌ Vehicle creation failed:', createVehiclePayload);
      process.exit(1);
    }

    const vehicleId = createVehiclePayload.data._id;
    console.log('✅ Vehicle created successfully');
    console.log(`   vehicleId: ${vehicleId}`);
    console.log(`   vehicle_name: ${createVehiclePayload.data.vehicle_name}`);
    console.log(`   vehicle_number: ${createVehiclePayload.data.vehicle_number}\n`);

    // STEP 3: Fetch vehicles with PUBLIC endpoint (query param)
    console.log('3️⃣  FETCH VEHICLES - Using PUBLIC endpoint');
    console.log('─────────────────────────────────────────────────');
    console.log(`   GET /api/vehicles/public/available?ownerId=${ownerId}`);
    console.log(`   (No authentication required)\n`);
    
    const publicResponse = await fetch(
      `${API_BASE_URL}/api/vehicles/public/available?ownerId=${ownerId}`
    );

    const publicData = await publicResponse.json();
    const publicCount = publicData.data?.length || 0;
    
    console.log(`✅ Response: ${publicResponse.status} ${publicResponse.statusText}`);
    console.log(`   Vehicles found: ${publicCount}`);
    if (publicCount > 0) {
      console.log(`   First vehicle: ${publicData.data[0].vehicle_name} (${publicData.data[0].vehicle_number})`);
    }
    console.log();

    // STEP 4: Fetch vehicles with AUTHENTICATED endpoint
    console.log('4️⃣  FETCH VEHICLES - Using AUTHENTICATED endpoint');
    console.log('─────────────────────────────────────────────────');
    console.log(`   GET /api/vehicles/native/available`);
    console.log(`   Authorization: Bearer ${token.substring(0, 40)}...`);
    console.log(`   (Requires authentication - filters by req.ownerId from JWT)\n`);
    
    const authResponse = await fetch(
      `${API_BASE_URL}/api/vehicles/native/available`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const authData = await authResponse.json();
    const authCount = authData.data?.length || 0;
    
    console.log(`✅ Response: ${authResponse.status} ${authResponse.statusText}`);
    console.log(`   Vehicles found: ${authCount}`);  
    if (authCount > 0) {
      console.log(`   First vehicle: ${authData.data[0].vehicle_name} (${authData.data[0].vehicle_number})`);
    }
    console.log();

    // STEP 5: Detailed comparison
    console.log('5️⃣  RESULTS AND DIAGNOSIS');
    console.log('─────────────────────────────────────────────────');
    
    if (publicCount === 0 && authCount === 0) {
      console.log('❌ CRITICAL: No vehicles found on EITHER endpoint!');
      console.log('   Possible causes:');
      console.log('   - Vehicle creation failed silently');
      console.log('   - ownerId not properly stored in vehicle document');
    } else if (publicCount > 0 && authCount === 0) {
      console.log('❌ CRITICAL: Public endpoint shows vehicles but AUTH endpoint shows NONE!');
      console.log('   Problem: Authentication/token is working but req.ownerId filtering failed');
      console.log('   - Check if JWT ownerId matches vehicle ownerId in database');
      console.log('   - Check if backend controller is properly filtering by req.ownerId');
    } else if (publicCount === 0 && authCount > 0) {
      console.log('⚠️  STRANGE: Auth endpoint shows vehicles but public endpoint shows NONE!');
      console.log('   Possible misconfiguration in filtering logic');
    } else if (publicCount === authCount && publicCount > 0) {
      console.log('✅ SUCCESS: Both endpoints return same vehicles!');
      console.log('   This means:');
      console.log('   - Vehicle was created correctly with ownerId');
      console.log('   - Token contains correct ownerId');
      console.log('   - Auth middleware correctly extracts ownerId');
      console.log('   - Both public and auth endpoints work correctly');
      console.log('   - Mobile app should see vehicles when logged in as this owner');
    } else {
      console.log('⚠️  WARNING: Vehicle counts differ between endpoints');
      console.log(`   Public: ${publicCount}, Auth: ${authCount}`);
    }
    
    console.log('\n✅ Test Complete\n');
    console.log('📋 SUMMARY');
    console.log('─────────────────────────────────────────────────');
    console.log(`Created Test Account: ${TEST_EMAIL}`);
    console.log(`  Owner ID: ${ownerId}`);
    console.log(`  Token: ${token.substring(0, 40)}...`);
    console.log(`\nCreated Vehicle: ${vehicleData.vehicle_name}`);
    console.log(`  Vehicle ID: ${vehicleId}`);
    console.log(`  Vehicle Number: ${vehicleData.vehicle_number}`);
    console.log(`\nFetch Results:`);
    console.log(`  Public Endpoint: ${publicCount} vehicles`);
    console.log(`  Auth Endpoint: ${authCount} vehicles`);
    console.log(`\nTo test mobile app with this account:`);
    console.log(`  1. Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
    console.log(`  2. Mobile app should fetch and display ${publicCount > 0 ? publicCount : 'the'} vehicle(s)\n`);

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

completeFlow();
