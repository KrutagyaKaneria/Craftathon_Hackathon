#!/usr/bin/env node
/**
 * Test Script: Vehicle Fetching with Authentication
 * Debug the complete flow: Login -> Get Token -> Fetch Vehicles
 */

const API_BASE_URL = 'http://10.44.202.155:5000';
const TEST_EMAIL = 'driver@test.com';
const TEST_PASSWORD = 'password123';

async function testVehicleAuth() {
  console.log('🚀 Starting Vehicle Authentication Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Backend URL: ${API_BASE_URL}`);
  console.log(`👤 Test Credentials: ${TEST_EMAIL} / ${TEST_PASSWORD}\n`);

  try {
    // Step 1: Health Check
    console.log('Step 1️⃣ : Backend Health Check');
    console.log('─────────────────────────────────────────────────');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`Status: ${healthResponse.status} ${healthResponse.statusText}`);
    console.log(`Body: ${JSON.stringify(healthData, null, 2)}\n`);

    if (!healthResponse.ok) {
      console.error('❌ Backend is not responding correctly to health check');
      process.exit(1);
    }

    // Step 2: Try Login, if fails try Signup
    console.log('Step 2️⃣ : Owner Login');
    console.log('─────────────────────────────────────────────────');
    console.log(`POST ${API_BASE_URL}/api/auth/login`);
    console.log(`Body: { email: "${TEST_EMAIL}", password: "${TEST_PASSWORD}" }`);
    
    let loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });

    let loginData = await loginResponse.json();
    console.log(`Status: ${loginResponse.status} ${loginResponse.statusText}`);
    console.log(`Response: ${JSON.stringify(loginData, null, 2)}\n`);

    // If login failed with 401, try signup
    if (!loginResponse.ok && loginResponse.status === 401) {
      console.log('⚠️ Account not found, attempting signup...\n');
      
      console.log('Step 2a️⃣ : Owner Signup');
      console.log('─────────────────────────────────────────────────');
      console.log(`POST ${API_BASE_URL}/api/auth/signup`);
      console.log(`Body: { email: "${TEST_EMAIL}", password: "${TEST_PASSWORD}", firstName: "Test", lastName: "Driver" }`);
      
      const signupResponse = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: TEST_EMAIL, 
          password: TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'Driver'
        })
      });

      const signupData = await signupResponse.json();
      console.log(`Status: ${signupResponse.status} ${signupResponse.statusText}`);
      console.log(`Response: ${JSON.stringify(signupData, null, 2)}\n`);

      if (!signupResponse.ok || !signupData.data.token) {
        console.error('❌ Signup failed');
        process.exit(1);
      }
      
      loginData = signupData;
      console.log('✅ Signup successful! Using new account for testing\n');
    } else if (!loginResponse.ok || !loginData.data.token) {
      console.error('❌ Login failed');
      process.exit(1);
    } else {
      console.log('✅ Login successful!\n');
    }

    const token = loginData.data.token;
    const ownerId = loginData.data.ownerId;
    
    console.log('✅ Login Successful!');
    console.log(`🔑 Token: ${token.substring(0, 40)}...`);
    console.log(`👤 ownerId: ${ownerId}\n`);

    // Step 3: Debug Token
    console.log('Step 3️⃣ : Debug Token');
    console.log('─────────────────────────────────────────────────');
    console.log(`POST ${API_BASE_URL}/api/auth/debug-token`);
    console.log(`Body: { token: "${token.substring(0, 40)}..." }`);
    
    const debugResponse = await fetch(`${API_BASE_URL}/api/auth/debug-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const debugData = await debugResponse.json();
    console.log(`Status: ${debugResponse.status} ${debugResponse.statusText}`);
    console.log(`Response: ${JSON.stringify(debugData, null, 2)}\n`);

    if (!debugResponse.ok) {
      console.error('❌ Token debug failed');
    } else {
      console.log('✅ Token is valid and contains correct ownerId\n');
    }

    // Step 4: Fetch Vehicles with Public Endpoint
    console.log('Step 4️⃣ : Fetch Vehicles (PUBLIC endpoint)');
    console.log('─────────────────────────────────────────────────');
    console.log(`GET ${API_BASE_URL}/api/vehicles/public/available?ownerId=${ownerId}`);
    console.log('Headers: (none - public route)');

    const publicVehiclesResponse = await fetch(
      `${API_BASE_URL}/api/vehicles/public/available?ownerId=${ownerId}`
    );
    const publicVehiclesData = await publicVehiclesResponse.json();
    console.log(`Status: ${publicVehiclesResponse.status} ${publicVehiclesResponse.statusText}`);
    console.log(`Found ${publicVehiclesData.data?.length || 0} vehicles`);
    if (publicVehiclesData.data?.length > 0) {
      console.log(`First vehicle: ${JSON.stringify(publicVehiclesData.data[0], null, 2)}`);
    }
    console.log(`Full Response: ${JSON.stringify(publicVehiclesData, null, 2)}\n`);

    // Step 5: Fetch Vehicles with Native/Auth Endpoint
    console.log('Step 5️⃣ : Fetch Vehicles (AUTHENTICATED /native/available endpoint)');
    console.log('─────────────────────────────────────────────────');
    console.log(`GET ${API_BASE_URL}/api/vehicles/native/available`);
    console.log(`Headers: { Authorization: "Bearer ${token.substring(0, 40)}..." }`);

    const nativeVehiclesResponse = await fetch(
      `${API_BASE_URL}/api/vehicles/native/available`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const nativeVehiclesData = await nativeVehiclesResponse.json();
    console.log(`Status: ${nativeVehiclesResponse.status} ${nativeVehiclesResponse.statusText}`);
    console.log(`Found ${nativeVehiclesData.data?.length || 0} vehicles`);
    if (nativeVehiclesData.data?.length > 0) {
      console.log(`First vehicle: ${JSON.stringify(nativeVehiclesData.data[0], null, 2)}`);
    }
    console.log(`Full Response: ${JSON.stringify(nativeVehiclesData, null, 2)}\n`);

    // Step 6: Comparison
    console.log('Step 6️⃣ : Comparison Results');
    console.log('─────────────────────────────────────────────────');
    const publicCount = publicVehiclesData.data?.length || 0;
    const nativeCount = nativeVehiclesData.data?.length || 0;
    
    console.log(`📊 Public Endpoint Results: ${publicCount} vehicles`);
    console.log(`📊 Native Auth Endpoint Results: ${nativeCount} vehicles`);
    
    if (publicCount === 0 && nativeCount === 0) {
      console.error('⚠️ WARNING: No vehicles found on either endpoint!');
      console.error('   Possible issues:');
      console.error('   - ownerId does not own any vehicles in the database');
      console.error('   - Vehicles were not created with this ownerId');
    } else if (publicCount > 0 && nativeCount === 0) {
      console.error('❌ CRITICAL ISSUE: Public endpoint works but authenticated endpoint returns no vehicles');
      console.error('   Possible issues:');
      console.error('   - Auth middleware not properly setting req.ownerId');
      console.error('   - Token is not being verified correctly');
      console.error('   - getAllVehicles controller not filtering by req.ownerId when present');
    } else if (publicCount === nativeCount) {
      console.log('✅ GOOD: Both endpoints return the same number of vehicles');
    } else {
      console.warn('⚠️ WARNING: Different counts between public and native endpoints');
    }

    console.log('\n✅ Test Complete\n');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testVehicleAuth();
