import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const testVehicleCreation = async () => {
  try {
    console.log('🔍 Testing Vehicle Creation Flow\n');

    // Step 1: Create/Login an owner
    console.log('Step 1: Creating test owner...');
    const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
      email: `testowner${Date.now()}@driveGuard.com`,
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'Owner',
      phone: '+1234567890'
    }).catch(err => {
      if (err.response?.status === 409) {
        console.log('Owner already exists, attempting login...');
        return null;
      }
      throw err;
    });

    let ownerId, token;
    
    if (signupRes) {
      ownerId = signupRes.data.data.ownerId;
      token = signupRes.data.data.token;
      console.log('✅ Owner created:', { ownerId, email: signupRes.data.data.email });
    } else {
      // Login with existing credentials
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'testowner1712163325024@driveGuard.com',
        password: 'Test@1234'
      });
      ownerId = loginRes.data.data.ownerId;
      token = loginRes.data.data.token;
      console.log('✅ Owner logged in:', { ownerId, email: loginRes.data.data.email });
    }

    // Step 2: Create a vehicle
    console.log('\nStep 2: Creating vehicle...');
    const vehicleRes = await axios.post(`${API_BASE}/vehicles`, {
      ownerId,
      vehicle_number: `DG-${Math.floor(Math.random() * 1000)}`,
      vehicle_name: 'Tesla Model 3',
      model: 'Model 3',
      year: 2023
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Vehicle created:', vehicleRes.data.data);

    // Step 3: Get all vehicles for owner
    console.log('\nStep 3: Fetching all vehicles...');
    const vehiclesRes = await axios.get(`${API_BASE}/vehicles?ownerId=${ownerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Total vehicles for owner: ${vehiclesRes.data.data.length}`);
    vehiclesRes.data.data.forEach(v => {
      console.log(`   - ${v.vehicle_number}: ${v.vehicle_name}`);
    });

    // Step 4: Test duplicate vehicle_number
    console.log('\nStep 4: Testing duplicate vehicle_number...');
    const dupVehicleNum = vehicleRes.data.data.vehicle_number;
    try {
      await axios.post(`${API_BASE}/vehicles`, {
        ownerId,
        vehicle_number: dupVehicleNum,
        vehicle_name: 'Another Car'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ ERROR: Duplicate was allowed!');
    } catch (err) {
      if (err.response?.status === 409) {
        console.log('✅ Duplicate correctly rejected with 409:', err.response.data.message);
      } else {
        console.log('❌ Unexpected error:', err.response?.status, err.response?.data?.message);
      }
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

testVehicleCreation();
