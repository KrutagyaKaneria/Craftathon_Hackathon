# Route Documentation - Native App vs Webcam Screen

## Overview
Backend now has **separate routes** for Native App (owner-based) and Webcam screen (global view).

---

## 🔒 NATIVE APP ROUTES (Authentication Required)

### 1. Get Owner's Drivers Only
```
GET /api/drivers/owner/me
Headers: Authorization: Bearer <owner_token>

Response: Only drivers belonging to logged-in owner
Example:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "ownerId": "69d02ddf74f117215a1546c4"
    }
  ],
  "count": 2,
  "ownerId": "69d02ddf74f117215a1546c4"
}
```
**Use in**: Native Driver screen (shows only owner's drivers)

---

### 2. Get Owner Profile with Statistics
```
GET /api/owners/profile/me
Headers: Authorization: Bearer <owner_token>

Response: Owner profile with drivers, vehicles, and statistics
Example:
{
  "success": true,
  "data": {
    "owner": {
      "firstName": "Owner",
      "lastName": "One",
      "email": "owner@example.com",
      "totalDrivers": 2,
      "totalVehicles": 3
    },
    "drivers": [...],
    "vehicles": [...],
    "statistics": {
      "totalDrivers": 2,
      "totalVehicles": 3,
      "activeDrivers": 2,
      "activeVehicles": 3
    }
  }
}
```
**Use in**: Native Owner Dashboard (shows owner's data only)

---

## 📹 WEBCAM SCREEN ROUTES (No Authentication Required)

### 3. Get All Drivers (Global)
```
GET /api/drivers

Response: ALL drivers from ALL owners in database
Example:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "ownerId": "69d02ddf74f117215a1546c4"
    },
    {
      "_id": "...",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "ownerId": "69d02ddf74f117215a1546c7"
    }
  ],
  "count": 14
}
```
**Use in**: Webcam driver selection screen (shows all drivers for selection)

---

### 4. Get Specific Owner with Drivers & Vehicles
```
GET /api/owners/:id
Example: GET /api/owners/69d02ddf74f117215a1546c4

Response: Owner details + their drivers + their vehicles
Example:
{
  "success": true,
  "data": {
    "owner": {
      "_id": "69d02ddf74f117215a1546c4",
      "firstName": "Owner",
      "lastName": "One",
      "email": "owner@example.com",
      "totalDrivers": 2,
      "totalVehicles": 3
    },
    "drivers": [
      {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    ],
    "vehicles": [
      {
        "_id": "...",
        "vehicle_number": "DG-001",
        "vehicle_name": "Tesla Model 3",
        "status": "active"
      }
    ],
    "summary": {
      "totalDrivers": 2,
      "totalVehicles": 3
    }
  }
}
```
**Use in**: Webcam - when user selects an owner to see their buses and drivers

---

### 5. Get All Owners (Global)
```
GET /api/owners/all

Response: ALL owners from database
Example:
{
  "success": true,
  "data": [
    {
      "_id": "69d02ddf74f117215a1546c4",
      "firstName": "Owner",
      "lastName": "One",
      "email": "owner@example.com",
      "totalDrivers": 2,
      "totalVehicles": 3
    },
    {
      "_id": "69d02ddf74f117215a1546c7",
      "firstName": "Owner",
      "lastName": "Two",
      "email": "owner2@example.com",
      "totalDrivers": 1,
      "totalVehicles": 2
    }
  ],
  "count": 13
}
```
**Use in**: Webcam - initial screen to show all owners/buses available

---

## Route Comparison Table

| Purpose | Route | Auth | Returns | Use Case |
|---------|-------|------|---------|----------|
| **Native: Owner's Drivers** | `GET /api/drivers/owner/me` | ✅ Required | Only owner's drivers | Native driver list |
| **Native: Owner Profile** | `GET /api/owners/profile/me` | ✅ Required | Owner profile + stats | Native dashboard |
| **Webcam: Global Drivers** | `GET /api/drivers` | ❌ Not required | ALL drivers | Webcam driver selection |
| **Webcam: Specific Owner** | `GET /api/owners/:id` | ❌ Not required | Owner + drivers + vehicles | Webcam owner detail |
| **Webcam: Global Owners** | `GET /api/owners/all` | ❌ Not required | ALL owners | Webcam owner list |

---

## Implementation Examples

### Native App - React Native (useAuth hook)
```typescript
// Get logged-in owner's drivers only
const ownerDriversRes = await apiClient.get('/api/drivers/owner/me');
// ownerId is automatically attached from JWT token

// Get owner profile with statistics
const profileRes = await apiClient.get('/api/owners/profile/me');
```

### Webcam Screen - Web (No auth required)
```javascript
// Get all drivers for selection
const allDrivers = await fetch('http://backend:5000/api/drivers').then(r => r.json());

// Get all owners for selection
const allOwners = await fetch('http://backend:5000/api/owners/all').then(r => r.json());

// Get specific owner's details when selected
const ownerDetails = await fetch(`http://backend:5000/api/owners/${ownerId}`).then(r => r.json());
```

---

## Test Results ✅
All 5 tests passed:
- ✅ Native App: Get Owner Drivers (2 drivers for owner)
- ✅ Webcam: Get All Drivers (14+ drivers globally)
- ✅ Webcam: Get All Owners (13+ owners globally)
- ✅ Webcam: Get Specific Owner with Drivers
- ✅ Native App: Get Owner Profile with Statistics

---

## Summary
- **Native App**: Uses authenticated routes + `/owner/me` pattern
- **Webcam**: Uses global routes + `/all` pattern
- **Data Isolation**: Only native app can see owner-specific data
- **Webcam Screen**: Can view all data without authentication
