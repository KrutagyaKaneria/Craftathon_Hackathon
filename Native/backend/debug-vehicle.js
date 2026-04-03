import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

/**
 * Comprehensive test to debug the 500 error on vehicle creation
 */
const debugVehicleCreation = async () => {
  try {
    console.log('🔍 DEBUGGING VEHICLE CREATION 500 ERROR\n');
    console.log('Backend URL:', API_BASE);

    // Step 1: Create/login owner
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 1: Creating test owner');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const email = `test${Date.now()}@drive.com`;
    console.log('Signup payload:', { email, password: '***', firstName: 'Test', lastName: 'User' });
    
    const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
      email,
      password: 'Test@1234',
      firstName: 'Test',
      lastName: 'User',
      phone: '+919999999999'
    });

    const { ownerId, token } = signupRes.data.data;
    console.log('✅ Owner created successfully');
    console.log('Response:', {
      ownerId,
      email: signupRes.data.data.email,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...'
    });

    // Step 2: Verify token by making an authenticated request
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Verifying token by getting dashboard data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const dashRes = await axios.get(`${API_BASE}/dashboard/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Token verified - Dashboard accessible');
      console.log('Dashboard data keys:', Object.keys(dashRes.data.data || {}));
    } catch (dashErr) {
      console.warn('⚠️ Dashboard request failed:', dashErr.response?.data?.message);
    }

    // Step 3: Create vehicle with logging
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 3: Creating vehicle');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const vehicleNumber = `Dg-Test-${Math.floor(Math.random() * 10000)}`;
    const vehiclePayload = {
      ownerId,
      vehicle_number: vehicleNumber,
      vehicle_name: 'Tesla Model 3 Test'
    };

    console.log('Vehicle creation payload:', vehiclePayload);
    console.log('Headers:', {
      Authorization: `Bearer ${token.substring(0, 30)}...`,
      'Content-Type': 'application/json'
    });

    try {
      const vehicleRes = await axios.post(`${API_BASE}/vehicles`, vehiclePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Vehicle created successfully!');
      console.log('Vehicle data:', vehicleRes.data.data);
    } catch (vehicleErr) {
      console.error('❌ Vehicle creation failed');
      console.error('Status:', vehicleErr.response?.status);
      console.error('Error message:', vehicleErr.response?.data?.message);
      console.error('Full error response:', JSON.stringify(vehicleErr.response?.data, null, 2));
      
      // If it's a validation error, log details
      if (vehicleErr.response?.status === 500) {
        console.error('\n🔴 500 ERROR - Server error details:');
        console.error(vehicleErr.response?.data?.error);
        console.error('Stack trace:', vehicleErr.response?.data?.stack);
      }
      
      throw vehicleErr;
    }

    console.log('\n✅ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Response data:', error.response?.data);
    process.exit(1);
  }
};

debugVehicleCreation();
