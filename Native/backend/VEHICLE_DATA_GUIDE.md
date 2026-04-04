# Vehicle Data Generator Guide

## Overview
The vehicle data generator provides a comprehensive system for creating vehicle objects with all UI-required fields. When new vehicles are added, they automatically get realistic random details.

## Complete Vehicle Data Structure

Every vehicle object contains these fields (shown in UI):

```javascript
{
  // ===== IDENTIFICATION =====
  vehicle_number: "BUS-1234-01",      // ✅ Unique ID (e.g., shown in list)
  vehicle_name: "Metro Transit Pulsar", // Display name
  vin: "VLV1A2B3C4D5E",                // Vehicle Identification Number
  
  // ===== MODEL & YEAR =====
  model: "Volvo 9400 B11R",            // Vehicle model
  year: 2023,                          // Manufacture year
  
  // ===== STATUS (Dashboard Status Badge) =====
  status: "available",                 // ✅ Status: available, in-use, maintenance, etc
  protocol_status: "IDLE",             // ✅ Protocol: ACTIVE, IDLE, IN_TRANSIT, DIAGNOSTIC
  in_transit: false,                   // Whether vehicle is currently moving
  
  // ===== METRICS (Gauge Display in UI) =====
  safety_rating: 92,                   // ✅ Safety gauge (0-100%) - Green/Yellow/Red
  fuel_level: 85,                      // ✅ Fuel/Battery gauge (0-100%)
  
  // ===== LOCATION & MILEAGE =====
  mileage: 12500,                      // ✅ Distance in km
  location: {
    type: 'Point',
    coordinates: [72.5234, 23.1815]   // ✅ [longitude, latitude]
  },
  
  // ===== DRIVER ASSIGNMENT =====
  assigned_driver: null,               // ✅ Driver ObjectId or null = "Unassigned"
  
  // ===== MAINTENANCE =====
  maintenance_due: Date,               // When next maintenance is due
  
  // ===== PERFORMANCE TRACKING =====
  recent_performance: [85, 88, 90, 87, 89, 91, 88], // 7-day performance metrics
  
  // ===== METADATA =====
  notes: "✅ GOOD - Well maintained",
  last_active: Date,
  created_at: Date,
  updated_at: Date
}
```

---

## Usage Examples

### 1. Generate Random Vehicle (with all random details)

```javascript
import { generateRandomVehicleData } from './src/utils/vehicleGenerator.js';

// Generate vehicle with random details
const vehicle = generateRandomVehicleData('owner123', 1);
// Result:
// {
//   vehicle_number: "BUS-0123-01",
//   vehicle_name: "InterCity Voyager",
//   safety_rating: 75,
//   fuel_level: 65,
//   mileage: 35000,
//   status: "available",
//   ... (all other fields with random values)
// }
```

### 2. Generate Multiple Random Vehicles

```javascript
import { generateRandomVehicles } from './src/utils/vehicleGenerator.js';

// Create 5 vehicles with random details
const fleet = generateRandomVehicles('owner123', 5);
// Creates BUS-0123-01 through BUS-0123-05 with different random data each
```

### 3. Create Vehicle with Predefined Templates

```javascript
import { vehicleTemplates } from './src/utils/vehicleGenerator.js';

// Excellent condition vehicle
const newBus = vehicleTemplates.excellent('owner123', 1);
// Result:
// {
//   safety_rating: 95,
//   fuel_level: 95,
//   mileage: 5000,
//   status: "available",
//   protocol_status: "ACTIVE",
//   notes: "⭐ EXCELLENT - Brand new!"
// }

// Vehicle needing maintenance
const maintenance = vehicleTemplates.needsMaintenance('owner123', 2);
// Result:
// {
//   safety_rating: 68,
//   fuel_level: 25,
//   mileage: 85000,
//   status: "maintenance",
//   notes: "⚠️ NEEDS MAINTENANCE"
// }

// Vehicle in transit
const transit = vehicleTemplates.inTransit('owner123', 3);
// Result:
// {
//   status: "in-use",
//   protocol_status: "IN_TRANSIT",
//   in_transit: true,
//   notes: "🚌 IN_TRANSIT"
// }
```

### 4. Create Standard Fleet (Diverse Vehicles)

```javascript
import { createStandardFleet } from './src/utils/vehicleGenerator.js';

// Creates 3 diverse vehicles: Excellent, Good, In-Transit
const fleet = createStandardFleet('owner123');
// Returns array of 3 vehicles with different conditions
```

### 5. Create Vehicle with Custom Data

```javascript
import { generateComprehensiveVehicleData } from './src/utils/vehicleGenerator.js';

// Create vehicle but override specific fields
const custom = generateComprehensiveVehicleData('owner123', 1, {
  safety_rating: 88,           // Override safety
  fuel_level: 55,              // Override fuel
  vehicle_name: "My Custom Bus", // Override name
  status: "in-use"            // Override status
});
```

### 6. Create Vehicle with Simple API

```javascript
import { createVehicleObject } from './src/utils/vehicleGenerator.js';

// Simple way to create vehicle
const vehicle = createVehicleObject('BUS-CUSTOM-01', 'My Bus');
// Returns vehicle with random model, year, default good condition

// Override specific fields
const customVehicle = createVehicleObject('BUS-CUSTOM-02', 'Another Bus', {
  safety_rating: 78,
  fuel_level: 60
});
```

---

## Using in Backend API

### When Creating Vehicle via POST /api/vehicles

```javascript
// vehicleController.js
import { createVehicleObject, generateRandomVehicles } from '../utils/vehicleGenerator.js';

export const createVehicle = async (req, res) => {
  const { vehicle_number, vehicle_name, generateRandom } = req.body;
  
  let vehicleData;
  
  if (generateRandom) {
    // Auto-generate all details
    vehicleData = generateRandomVehicleData(req.user.ownerId, 1);
  } else {
    // Create with provided data
    vehicleData = createVehicleObject(vehicle_number, vehicle_name);
  }
  
  const vehicle = new Vehicle({ ...vehicleData, ownerId: req.user.ownerId });
  await vehicle.save();
  
  res.status(201).json(vehicle);
};
```

### Request Examples

```bash
# Generate vehicle with random details
POST /api/vehicles
{
  "generateRandom": true
}

# Create vehicle with specific name and auto-generated model/year/etc
POST /api/vehicles
{
  "vehicle_number": "BUS-FLEET-01",
  "vehicle_name": "New Transit Bus"
}

# Create vehicle with all custom details
POST /api/vehicles
{
  "vehicle_number": "BUS-FLEET-02",
  "vehicle_name": "Premium Bus",
  "model": "Mercedes-Benz Travego",
  "year": 2026,
  "safety_rating": 95,
  "fuel_level": 90
}
```

---

## Available Vehicle Conditions/Templates

| Template | Safety | Fuel | Mileage | Status | Use Case |
|----------|--------|------|---------|--------|----------|
| `excellent` | 95% | 95% | 5,000 km | Available | Brand new vehicle |
| `goodCondition` | 90% | 85% | 15,000 km | Available | Regular service |
| `inTransit` | 82% | 60% | 45,000 km | In-Use | Currently on route |
| `needsMaintenance` | 68% | 25% | 85,000 km | Maintenance | Needs service |
| `inactive` | 75% | 40% | 32,000 km | Available | Parked/idle |

---

## Building a Fleet from Scratch

```javascript
import { 
  createStandardFleet, 
  vehicleTemplates,
  generateRandomVehicles 
} from './src/utils/vehicleGenerator.js';

// Method 1: Standard fleet (3 diverse vehicles)
const fleet1 = createStandardFleet('owner123');

// Method 2: All random vehicles
const fleet2 = generateRandomVehicles('owner123', 6);

// Method 3: Mix templates and random
const fleet3 = [
  vehicleTemplates.excellent('owner123', 1),
  vehicleTemplates.goodCondition('owner123', 2),
  ...generateRandomVehicles('owner123', 3) // Vehicles 3-5 are random
];

// Save to database
for (const vehicleData of fleet3) {
  const vehicle = new Vehicle({ ...vehicleData, ownerId: 'owner123' });
  await vehicle.save();
}
```

---

## Data Arrays Available for Reference

```javascript
import { vehicleDataArrays } from './src/utils/vehicleGenerator.js';

vehicleDataArrays.statuses        // ['available', 'in-use', 'maintenance', ...]
vehicleDataArrays.protocolStatuses // ['ACTIVE', 'IDLE', 'IN_TRANSIT', ...]
vehicleDataArrays.models          // ['Volvo 9400 B11R', 'Scania Metroliner', ...]
vehicleDataArrays.vehicleNames    // ['Metro Transit Pulsar', 'City Link Connect', ...]
vehicleDataArrays.safetyRatings   // [62, 68, 72, 75, 78, 80, 82, 85, 87, 88, 90, 92, 95]
vehicleDataArrays.fuelLevels      // [10, 25, 35, 45, 55, 60, 65, 75, 78, 80, 85, 90, 95]
vehicleDataArrays.mileages        // [5000, 12500, 18000, 28000, ...]
vehicleDataArrays.years           // [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
vehicleDataArrays.locations       // 8 different Ahmedabad locations with coordinates
vehicleDataArrays.conditions      // Status labels with descriptions
vehicleDataArrays.vins            // VIN prefixes for generation
```

---

## Real-World Usage in Mobile App

When user adds a new vehicle from the app:

```typescript
// vehicleService.ts
export const vehicleAPI = {
  async createVehicle(name: string, model?: string) {
    // User enters vehicle name
    // System fills in other fields randomly
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify({
        vehicle_number: generateUniqueNumber(), // User/system decides
        vehicle_name: name,
        generateRandom: true  // All other fields auto-generated
      })
    });
    
    return response.json(); // Returns complete vehicle object
  }
}
```

---

## Tips & Best Practices

1. **When Adding Single Vehicle**: Use `createVehicleObject()` for simple case
2. **When Adding Multiple Vehicles**: Use `generateRandomVehicles()` for fleet creation
3. **For Testing**: Use predefined templates (excellent, needsMaintenance, etc.)
4. **For Realistic Data**: Use `generateComprehensiveVehicleData()` with random values
5. **For Custom Logic**: Combine templates with custom overrides

---

## Summary

✅ **All vehicle details are now properly structured**
✅ **Random data generation works automatically**
✅ **Predefined templates available for consistency**
✅ **Easy to use in API endpoints**
✅ **Mobile app can request vehicles with/without random data**
