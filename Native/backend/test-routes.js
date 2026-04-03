import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
let testResults = [];

/**
 * Comprehensive test for Native App and Webcam routes
 */
const runTests = async () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 COMPREHENSIVE ROUTE TESTING - Native App vs Webcam');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create owners for testing
    console.log('📋 SETUP: Creating test owners...\n');
    
    const owner1Email = `owner1-${Date.now()}@test.com`;
    const owner2Email = `owner2-${Date.now()}@test.com`;

    const owner1Res = await axios.post(`${API_BASE}/auth/signup`, {
      email: owner1Email,
      password: 'Test@123',
      firstName: 'Owner',
      lastName: 'One',
      phone: '+919999999999'
    });

    const owner2Res = await axios.post(`${API_BASE}/auth/signup`, {
      email: owner2Email,
      password: 'Test@123',
      firstName: 'Owner',
      lastName: 'Two',
      phone: '+919999999999'
    });

    const owner1Id = owner1Res.data.data.ownerId;
    const owner1Token = owner1Res.data.data.token;
    const owner2Id = owner2Res.data.data.ownerId;

    console.log('✅ Owner 1 created:', owner1Email);
    console.log('✅ Owner 2 created:', owner2Email);
    console.log('');

    // Step 2: Create drivers for testing
    console.log('📋 SETUP: Creating test drivers...\n');

    const driver1Res = await axios.post(`${API_BASE}/drivers`, {
      ownerId: owner1Id,
      firstName: 'Driver',
      lastName: 'One',
      email: `driver1-${Date.now()}@test.com`,
      phone: '+919999999999',
      password: 'test123'
    }, { headers: { Authorization: `Bearer ${owner1Token}` } });

    const driver2Res = await axios.post(`${API_BASE}/drivers`, {
      ownerId: owner1Id,
      firstName: 'Driver',
      lastName: 'Two',
      email: `driver2-${Date.now()}@test.com`,
      phone: '+919999999999',
      password: 'test123'
    }, { headers: { Authorization: `Bearer ${owner1Token}` } });

    const driver3Res = await axios.post(`${API_BASE}/drivers`, {
      ownerId: owner2Id,
      firstName: 'Driver',
      lastName: 'Three',
      email: `driver3-${Date.now()}@test.com`,
      phone: '+919999999999',
      password: 'test123'
    });

    console.log('✅ Driver 1 created for Owner 1');
    console.log('✅ Driver 2 created for Owner 1');
    console.log('✅ Driver 3 created for Owner 2');
    console.log('');

    // ═════════════════════════════════════════════════════════════
    // TEST 1: NATIVE APP DRIVERS (Owner-based, Auth required)
    // ═════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔒 TEST 1: NATIVE APP - Get Owner\'s Drivers Only');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Route: GET /api/drivers/owner/me');
    console.log('Auth: Required (Owner 1 Token)');
    console.log('Expected: Only Owner 1\'s drivers (2 drivers)\n');

    const nativeDriversRes = await axios.get(`${API_BASE}/drivers/owner/me`, {
      headers: { Authorization: `Bearer ${owner1Token}` }
    });

    console.log('✅ Request successful - Status:', nativeDriversRes.status);
    console.log('📊 Response:');
    console.log(`   - Total drivers: ${nativeDriversRes.data.count}`);
    console.log(`   - Owner ID: ${nativeDriversRes.data.ownerId}`);
    nativeDriversRes.data.data.forEach((driver, i) => {
      console.log(`   [${i+1}] ${driver.firstName} ${driver.lastName} (${driver.email})`);
    });
    console.log('');

    testResults.push({
      test: 'Native App: Get Owner Drivers',
      route: 'GET /api/drivers/owner/me',
      status: nativeDriversRes.status,
      count: nativeDriversRes.data.count,
      expected: 2,
      pass: nativeDriversRes.data.count === 2
    });

    // ═════════════════════════════════════════════════════════════
    // TEST 2: WEBCAM SCREEN - ALL DRIVERS
    // ═════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📹 TEST 2: WEBCAM - Get ALL Drivers (Global)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Route: GET /api/drivers');
    console.log('Auth: NOT required');
    console.log('Expected: All drivers from all owners (3+ drivers)\n');

    const webcamDriversRes = await axios.get(`${API_BASE}/drivers`);

    console.log('✅ Request successful - Status:', webcamDriversRes.status);
    console.log('📊 Response:');
    console.log(`   - Total drivers: ${webcamDriversRes.data.count}`);
    webcamDriversRes.data.data.slice(0, 5).forEach((driver, i) => {
      console.log(`   [${i+1}] ${driver.firstName} ${driver.lastName} - Owner: ${driver.ownerId}`);
    });
    if (webcamDriversRes.data.count > 5) {
      console.log(`   ... and ${webcamDriversRes.data.count - 5} more`);
    }
    console.log('');

    testResults.push({
      test: 'Webcam: Get All Drivers',
      route: 'GET /api/drivers',
      status: webcamDriversRes.status,
      count: webcamDriversRes.data.count,
      expected: '≥ 3',
      pass: webcamDriversRes.data.count >= 3
    });

    // ═════════════════════════════════════════════════════════════
    // TEST 3: WEBCAM - Get ALL OWNERS
    // ═════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📹 TEST 3: WEBCAM - Get ALL Owners');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Route: GET /api/owners/all');
    console.log('Auth: NOT required');
    console.log('Expected: All owners from database (2+ owners)\n');

    const webcamOwnersRes = await axios.get(`${API_BASE}/owners/all`);

    console.log('✅ Request successful - Status:', webcamOwnersRes.status);
    console.log('📊 Response:');
    console.log(`   - Total owners: ${webcamOwnersRes.data.count}`);
    webcamOwnersRes.data.data.slice(0, 5).forEach((owner, i) => {
      console.log(`   [${i+1}] ${owner.firstName} ${owner.lastName} (${owner.email}) - Drivers: ${owner.totalDrivers}, Vehicles: ${owner.totalVehicles}`);
    });
    if (webcamOwnersRes.data.count > 5) {
      console.log(`   ... and ${webcamOwnersRes.data.count - 5} more`);
    }
    console.log('');

    testResults.push({
      test: 'Webcam: Get All Owners',
      route: 'GET /api/owners/all',
      status: webcamOwnersRes.status,
      count: webcamOwnersRes.data.count,
      expected: '≥ 2',
      pass: webcamOwnersRes.data.count >= 2
    });

    // ═════════════════════════════════════════════════════════════
    // TEST 4: WEBCAM - Get SPECIFIC OWNER with Drivers & Vehicles
    // ═════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📹 TEST 4: WEBCAM - Get Specific Owner with Drivers');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Route: GET /api/owners/${owner1Id}`);
    console.log('Auth: NOT required');
    console.log(`Expected: Owner 1 with their 2 drivers\n`);

    const ownerDetailRes = await axios.get(`${API_BASE}/owners/${owner1Id}`);

    console.log('✅ Request successful - Status:', ownerDetailRes.status);
    console.log('📊 Owner Details:');
    const owner = ownerDetailRes.data.data.owner;
    console.log(`   - Name: ${owner.firstName} ${owner.lastName}`);
    console.log(`   - Email: ${owner.email}`);
    console.log(`   - Total Drivers: ${owner.totalDrivers}`);
    console.log(`   - Total Vehicles: ${owner.totalVehicles}`);
    console.log('📊 Drivers:');
    ownerDetailRes.data.data.drivers.forEach((driver, i) => {
      console.log(`   [${i+1}] ${driver.firstName} ${driver.lastName} (${driver.email})`);
    });
    console.log('');

    testResults.push({
      test: 'Webcam: Get Owner with Drivers',
      route: `GET /api/owners/${owner1Id}`,
      status: ownerDetailRes.status,
      count: ownerDetailRes.data.data.drivers.length,
      expected: 2,
      pass: ownerDetailRes.data.data.drivers.length === 2
    });

    // ═════════════════════════════════════════════════════════════
    // TEST 5: NATIVE APP - Get Owner Profile
    // ═════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔒 TEST 5: NATIVE APP - Get Owner Profile');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Route: GET /api/owners/profile/me');
    console.log('Auth: Required (Owner 1 Token)');
    console.log('Expected: Owner 1 profile with statistics\n');

    const profileRes = await axios.get(`${API_BASE}/owners/profile/me`, {
      headers: { Authorization: `Bearer ${owner1Token}` }
    });

    console.log('✅ Request successful - Status:', profileRes.status);
    console.log('📊 Owner Profile:');
    const profOwner = profileRes.data.data.owner;
    console.log(`   - Name: ${profOwner.firstName} ${profOwner.lastName}`);
    console.log(`   - Email: ${profOwner.email}`);
    console.log('📊 Statistics:');
    const stats = profileRes.data.data.statistics;
    console.log(`   - Total Drivers: ${stats.totalDrivers}`);
    console.log(`   - Active Drivers: ${stats.activeDrivers}`);
    console.log(`   - Total Vehicles: ${stats.totalVehicles}`);
    console.log(`   - Active Vehicles: ${stats.activeVehicles}`);
    console.log('');

    testResults.push({
      test: 'Native App: Get Owner Profile',
      route: 'GET /api/owners/profile/me',
      status: profileRes.status,
      pass: profileRes.status === 200
    });

    // ═════════════════════════════════════════════════════════════
    // SUMMARY
    // ═════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Test Results:');
    testResults.forEach((result, i) => {
      const icon = result.pass ? '✅' : '❌';
      console.log(`${icon} ${i+1}. ${result.test}`);
      console.log(`   Route: ${result.route}`);
      console.log(`   Status: ${result.status}`);
      if (result.count !== undefined) {
        console.log(`   Count: ${result.count} (Expected: ${result.expected})`);
      }
    });

    const passCount = testResults.filter(t => t.pass).length;
    console.log(`\n✅ PASSED: ${passCount}/${testResults.length}`);
    console.log('\n═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    console.error('Details:', error.response?.data);
  }
};

runTests();
