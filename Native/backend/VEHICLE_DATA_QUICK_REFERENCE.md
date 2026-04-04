# Vehicle Data Generator - Quick Reference

## ⚡ Common Use Cases

### 1️⃣ User Adds Single Vehicle (Generate All Details)
```javascript
import { generateRandomVehicleData } from './src/utils/vehicleGenerator.js';

// Automatically fills in: model, year, safety, fuel, mileage, location, etc.
const vehicle = generateRandomVehicleData(ownerId, 1);
await Vehicle(vehicle).save();
```

### 2️⃣ User Adds Vehicle (Provide Name Only)
```javascript
import { createVehicleObject } from './src/utils/vehicleGenerator.js';

// User enters name, rest auto-generated
const vehicle = createVehicleObject('BUS-123-01', 'My Bus Name');
await Vehicle(vehicle).save();
```

### 3️⃣ Create Fleet of 6 Random Vehicles
```javascript
import { generateRandomVehicles } from './src/utils/vehicleGenerator.js';

const fleet = generateRandomVehicles(ownerId, 6);
for (const v of fleet) {
  await Vehicle(v).save();
}
```

### 4️⃣ Create Diverse Fleet (3 Different Conditions)
```javascript
import { createStandardFleet } from './src/utils/vehicleGenerator.js';

const fleet = createStandardFleet(ownerId);
// Returns: [Excellent, Good, In-Transit] vehicles
```

### 5️⃣ Create Specific Condition Vehicle
```javascript
import { vehicleTemplates } from './src/utils/vehicleGenerator.js';

// Pick a template based on need
const excellent = vehicleTemplates.excellent(ownerId, 1);       // 95% safety
const maintenance = vehicleTemplates.needsMaintenance(ownerId, 2); // Needs service
const inTransit = vehicleTemplates.inTransit(ownerId, 3);        // Currently moving
```

### 6️⃣ Create Vehicle with Custom Values
```javascript
import { generateComprehensiveVehicleData } from './src/utils/vehicleGenerator.js';

const vehicle = generateComprehensiveVehicleData(ownerId, 1, {
  safety_rating: 88,
  fuel_level: 75,
  vehicle_name: 'Custom Name'
});
```

---

## 📋 Vehicle Fields

| Field | Type | UI Usage | Example |
|-------|------|----------|---------|
| `vehicle_number` | String | ID/Header | `BUS-1234-01` |
| `vehicle_name` | String | Subtitle | `Metro Transit Pulsar` |
| `safety_rating` | Number | Gauge | `92` (92%) |
| `fuel_level` | Number | Gauge | `85` (85%) |
| `mileage` | Number | Display | `12500` (km) |
| `status` | String | Badge | `available` \| `in-use` \| `maintenance` |
| `protocol_status` | String | Status | `IDLE` \| `ACTIVE` \| `IN_TRANSIT` |
| `location` | Object | Map | `{coordinates: [72.52, 23.18]}` |
| `assigned_driver` | ObjectId | Display | `null` = "Unassigned" |
| `model` | String | Detail | `Volvo 9400 B11R` |
| `year` | Number | Detail | `2023` |

---

## 🎯 Predefined Templates

| Template | Safety | Fuel | Use When |
|----------|--------|------|----------|
| `excellent` | 95% | 95% | New vehicle |
| `goodCondition` | 90% | 85% | Regular service |
| `inTransit` | 82% | 60% | On active route |
| `needsMaintenance` | 68% | 25% | Needs service |
| `inactive` | 75% | 40% | Parked/idle |

---

## 🔧 API Integration

### POST /api/vehicles - Create Vehicle

#### Option A: Auto-generate everything
```json
{
  "generateRandom": true
}
```

#### Option B: User provides name only
```json
{
  "vehicle_number": "BUS-ABC-01",
  "vehicle_name": "My Bus"
}
```

#### Option C: Custom values
```json
{
  "vehicle_number": "BUS-ABC-01",
  "vehicle_name": "My Bus",
  "safety_rating": 88,
  "fuel_level": 75
}
```

---

## 📱 iOS App Integration

```typescript
// User clicks "Add Vehicle" button
async function addVehicle(name: string) {
  const response = await fetch('/api/vehicles', {
    method: "POST",
    body: JSON.stringify({
      vehicle_number: generateId(),
      vehicle_name: name,
      // System auto-fills: safety_rating, fuel_level, model, year, mileage, etc.
    })
  });
  
  return response.json(); // Returns complete vehicle
}
```

---

## 📊 Dashboard Stats

When displaying dashboard (shown in your screenshot):
- **Total_Vehicles**: Count all vehicles
- **Active_Units**: Count vehicles with `status: in-use`
- **Avg_Safety**: Average of all `safety_rating` values
- **Fuel_Low**: Count vehicles with `fuel_level < 30`

---

## 🚀 Quick Start

```bash
# Option 1: Use existing seed script
node seed_vehicles.js

# Option 2: Use advanced seeding script (recommended)
node seed-vehicles-advanced.js

# Option 3: Manual creation via API
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{"vehicle_number":"BUS-001","vehicle_name":"Bus 1"}'
```

---

## ✅ Checklist for Adding Vehicles

- [x] Import generator function
- [x] Call generator (with or without custom data)
- [x] All fields automatically populated
- [x] Random values generated
- [x] Save to database
- [x] Return to client

No more hardcoding! 🎉
