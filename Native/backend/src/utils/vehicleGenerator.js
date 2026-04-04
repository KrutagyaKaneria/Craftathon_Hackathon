/**
 * Vehicle Data Generator Utility
 * Comprehensive vehicle data factory with realistic random generation
 * Handles all vehicle details: Safety, Fuel, Status, Mileage, Location, Assignment, etc.
 */

export const vehicleDataArrays = {
  statuses: ['available', 'in-use', 'active', 'inactive', 'maintenance', 'decommissioned'],
  protocolStatuses: ['ACTIVE', 'IDLE', 'IN_TRANSIT', 'DIAGNOSTIC', 'OFFLINE'],
  
  fuelLevels: [10, 25, 35, 45, 55, 60, 65, 75, 78, 80, 85, 90, 95],
  
  mileages: [5000, 12500, 18000, 28000, 35000, 45000, 55000, 68000, 78000, 85000, 95000, 120000],
  
  safetyRatings: [62, 68, 72, 75, 78, 80, 82, 85, 87, 88, 90, 92, 95],
  
  years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  
  models: [
    'Volvo 9400 B11R',
    'Scania Metroliner',
    'Mercedes-Benz Travego',
    'Tata 1518',
    'Ashok Leyland Lynx',
    'Eicher Pro 1055',
    'Hino 500 Series',
    'MAN Lion\'s Coach',
  ],
  
  vehicleNames: [
    'Metro Transit Pulsar',
    'City Link Connect',
    'InterCity Voyager',
    'Regional Express',
    'Urban Shuttle Pro',
    'Highway Cruiser',
    'Daily Commuter',
    'Express Runner',
    'Elite Transport',
    'Swift Mover',
  ],
  
  locations: [
    { lat: 23.1815, lon: 72.5234, name: 'Ahmedabad Center' },
    { lat: 23.1563, lon: 72.5367, name: 'East Zone' },
    { lat: 23.2010, lon: 72.5142, name: 'North Terminal' },
    { lat: 23.1245, lon: 72.5500, name: 'South Depot' },
    { lat: 23.1892, lon: 72.5089, name: 'West Hub' },
    { lat: 23.1734, lon: 72.5456, name: 'Central Station' },
    { lat: 23.1950, lon: 72.5120, name: 'City Garage' },
    { lat: 23.1400, lon: 72.5280, name: 'Transit Point' },
  ],
  
  conditions: [
    { label: '✅ GOOD', description: 'Well maintained, excellent condition', minSafety: 80 },
    { label: '⚠️ NEEDS MAINTENANCE', description: 'High mileage, needs maintenance soon', minSafety: 65 },
    { label: '⭐ EXCELLENT', description: 'Brand new! Perfect condition', minSafety: 90 },
    { label: '📊 AVERAGE', description: 'Regular condition, moderate maintenance', minSafety: 75 },
    { label: '🟡 FAIR', description: 'Acceptable condition, monitor closely', minSafety: 70 },
    { label: '🔴 POOR', description: 'Needs immediate attention', minSafety: 60 },
  ],

  vins: ['VLV', 'SCA', 'MBZ', 'TTA', 'ASK', 'EIR', 'HNO', 'MAN'],
};

/**
 * Helper utilities for random generation
 */
const randomIndex = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = () => Math.random() > 0.5;

/**
 * Create a complete vehicle object with all details
 * @param {string} ownerId - Owner ID for the vehicle
 * @param {number} index - Index for vehicle number (e.g., BUS-01)
 * @param {object} customData - Override specific fields (optional)
 * @returns {object} Complete vehicle data object with all fields shown in UI
 */
export function generateComprehensiveVehicleData(ownerId, index, customData = {}) {
  const condition = randomIndex(vehicleDataArrays.conditions);
  const year = randomIndex(vehicleDataArrays.years);
  const location = randomIndex(vehicleDataArrays.locations);
  const safety = randomIndex(vehicleDataArrays.safetyRatings);
  const fuel = randomIndex(vehicleDataArrays.fuelLevels);
  const mileage = randomIndex(vehicleDataArrays.mileages);
  const model = randomIndex(vehicleDataArrays.models);
  const vinPrefix = randomIndex(vehicleDataArrays.vins);
  const vinSuffix = Math.random().toString(36).substring(2, 15).toUpperCase();
  const status = fuel < 30 ? 'maintenance' : randomIndex(vehicleDataArrays.statuses);
  const protocolStatus = randomIndex(vehicleDataArrays.protocolStatuses);
  
  const baseData = {
    // ===== IDENTIFICATION =====
    vehicle_number: `BUS-${ownerId.toString().slice(-4)}-${String(index).padStart(2, '0')}`,
    vehicle_name: randomIndex(vehicleDataArrays.vehicleNames),
    vin: `${vinPrefix}${vinSuffix}`,
    
    // ===== MODEL & YEAR =====
    model,
    year,
    
    // ===== STATUS FIELDS (Shown in UI) =====
    status, // ✅ Status badge
    protocol_status: protocolStatus,
    in_transit: protocolStatus === 'IN_TRANSIT',
    
    // ===== METRICS (Shown as gauges/progress bars in UI) =====
    safety_rating: safety, // ✅ Safety % gauge
    fuel_level: fuel, // ✅ Fuel/Battery % gauge
    
    // ===== MILEAGE & LOCATION =====
    mileage, // ✅ Mileage (km)
    location: {
      type: 'Point',
      coordinates: [location.lon, location.lat], // ✅ Location [lon, lat]
    },
    
    // ===== DRIVER ASSIGNMENT =====
    assigned_driver: null, // ✅ "Unassigned" initially
    
    // ===== MAINTENANCE =====
    maintenance_due: new Date(Date.now() + randomRange(10, 180) * 24 * 60 * 60 * 1000),
    
    // ===== PERFORMANCE TRACKING =====
    recent_performance: Array(7)
      .fill(0)
      .map(() => randomRange(60, 100)), // 7 days of performance metrics
    
    // ===== DESCRIPTIVE FIELDS =====
    notes: `${condition.label} - ${condition.description} (Year: ${year}, Model: ${model}, Status: ${protocolStatus})`,
    
    // ===== METADATA =====
    last_active: new Date(Date.now() - randomRange(0, 24 * 60 * 60 * 1000)),
    created_at: new Date(),
    updated_at: new Date(),
  };

  // ===== MERGE CUSTOM DATA =====
  return { ...baseData, ...customData };
}

/**
 * Generate random vehicle data (legacy - alias for generateComprehensiveVehicleData)
 * @param {string} ownerId - Owner ID for the vehicle
 * @param {number} index - Index for vehicle number (e.g., BUS-01)
 * @returns {object} Random vehicle data
 */
export function generateRandomVehicleData(ownerId, index) {
  return generateComprehensiveVehicleData(ownerId, index);
}

/**
 * Generate multiple random vehicles
 * @param {string} ownerId - Owner ID
 * @param {number} count - Number of vehicles to generate
 * @returns {array} Array of random vehicle data
 */
export function generateRandomVehicles(ownerId, count) {
  return Array.from({ length: count }, (_, index) =>
    generateRandomVehicleData(ownerId, index + 1)
  );
}

/**
 * Predefined vehicle templates - Use when you need specific data
 * Can be customized per use case
 */
export const vehicleTemplates = {
  // Good condition vehicle
  goodCondition: (ownerId, index = 1) => generateComprehensiveVehicleData(ownerId, index, {
    safety_rating: 90,
    fuel_level: 85,
    mileage: 15000,
    status: 'available',
    protocol_status: 'IDLE',
    notes: '✅ GOOD - Well maintained, excellent condition'
  }),

  // Needs maintenance (low fuel)
  needsMaintenance: (ownerId, index = 1) => generateComprehensiveVehicleData(ownerId, index, {
    safety_rating: 68,
    fuel_level: 25,
    mileage: 85000,
    status: 'maintenance',
    protocol_status: 'IDLE',
    notes: '⚠️ NEEDS MAINTENANCE - Low fuel, high mileage'
  }),

  // Excellent condition (brand new)
  excellent: (ownerId, index = 1) => generateComprehensiveVehicleData(ownerId, index, {
    safety_rating: 95,
    fuel_level: 95,
    mileage: 5000,
    year: 2026,
    status: 'available',
    protocol_status: 'ACTIVE',
    notes: '⭐ EXCELLENT - Brand new! Perfect condition'
  }),

  // In transit
  inTransit: (ownerId, index = 1) => generateComprehensiveVehicleData(ownerId, index, {
    safety_rating: 82,
    fuel_level: 60,
    mileage: 45000,
    status: 'in-use',
    protocol_status: 'IN_TRANSIT',
    in_transit: true,
    notes: '🚌 IN_TRANSIT - Currently on route'
  }),

  // Inactive/Parked
  inactive: (ownerId, index = 1) => generateComprehensiveVehicleData(ownerId, index, {
    safety_rating: 75,
    fuel_level: 40,
    mileage: 32000,
    status: 'available',
    protocol_status: 'IDLE',
    in_transit: false,
    notes: 'IDLE - Currently parked and available'
  }),
};

/**
 * Create a standardized set of 3 diverse vehicles for testing
 * @param {string} ownerId - Owner ID
 * @returns {array} Array of 3 diverse vehicle objects
 */
export function createStandardFleet(ownerId) {
  return [
    vehicleTemplates.excellent(ownerId, 1),
    vehicleTemplates.goodCondition(ownerId, 2),
    vehicleTemplates.inTransit(ownerId, 3),
  ];
}

/**
 * Create a complete vehicle object with default values
 * Safe to use when creating vehicles via API
 * @param {string} vehicleNumber - Vehicle identifier (e.g., "BUS-ABCD-01")
 * @param {string} vehicleName - Human readable name
 * @param {object} overrides - Any fields to override
 * @returns {object} Complete vehicle object ready for database
 */
export function createVehicleObject(vehicleNumber, vehicleName, overrides = {}) {
  const defaultVehicle = {
    vehicle_number: vehicleNumber,
    vehicle_name: vehicleName,
    model: randomIndex(vehicleDataArrays.models),
    year: randomIndex(vehicleDataArrays.years),
    vin: `${randomIndex(vehicleDataArrays.vins)}${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
    
    // Default to good condition
    status: 'available',
    protocol_status: 'IDLE',
    safety_rating: randomRange(80, 95),
    fuel_level: randomRange(70, 95),
    
    location: {
      type: 'Point',
      coordinates: [randomIndex(vehicleDataArrays.locations).lon, randomIndex(vehicleDataArrays.locations).lat]
    },
    
    mileage: randomRange(5000, 50000),
    assigned_driver: null,
    in_transit: false,
    
    maintenance_due: new Date(Date.now() + randomRange(30, 180) * 24 * 60 * 60 * 1000),
    last_active: new Date(),
    
    recent_performance: Array(7).fill(0).map(() => randomRange(75, 95)),
    notes: 'Vehicle created successfully',
  };

  return { ...defaultVehicle, ...overrides };
}
