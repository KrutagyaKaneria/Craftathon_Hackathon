# 📱 Complete Workflow Guide: Owner → Driver Assignment → Vehicle Access

This explains how the DriveGuard system works from an owner's perspective.

---

## 🏗️ Architecture Overview

```
Fleet Owner              Drivers                 Vehicles
─────────────────────────────────────────────────────────
  │                       │                        │
  ├─ Login to App         │                        │
  │  (Owner Account)      │                        │
  │                       │                        │
  ├─ Create Driver ───────→ Driver Record Created  │
  │  (name, email, etc)   │                        │
  │                       │                        │
  ├─ Create Vehicle       │                        ├─ Vehicle Created
  │  (bus info)           │                        │  (owned by owner)
  │                       │                        │
  ├─ Assign Driver to ────→ Driver Associates ────→ Vehicle
  │  Vehicle              │ with Vehicle          │
  │                       │                        │
  │                  ┌─ Driver Verifies Face ─────┤
  │                  │  (mobile app)              │
  │                  │                            │
  └─ Monitor Fleet ──┴─ Driver Logs In ──────────→ Driver Sees Assigned Vehicle
                      (as assigned driver)         (in their dashboard)
```

---

## 🔑 Key Concepts

### Owner Account
- **What it is:** You (the fleet manager)
- **What you can do:** 
  - Log in to mobile app
  - Create/manage drivers for your fleet
  - Create/manage vehicles
  - Assign drivers to vehicles
  - Monitor fleet status
- **API Token contains:** Your `ownerId`
- **When you fetch vehicles:** You see **your** vehicles (filtered by your ownerId)

### Driver Account  
- **What it is:** Employee drivers within your fleet
- **Relationship:** Driver belongs to an Owner (they're in your fleet)
- **What they do:**
  - Eventually log in separately
  - See only their assigned vehicle
  - Perform face verification
  - Record trip data

### Vehicle Record
- **What it is:** A bus/truck in your fleet
- **Ownership:** Linked to an Owner via `ownerId`
- **Assignment:** Can be assigned to one Driver at a time
- **Visibility:**
  - Owner sees their own vehicles
  - Driver sees their assigned vehicle
  - NOT visible across fleet boundaries

---

## 📋 Step-by-Step: Start Fresh

If you're starting with a NEW account and want to test the full workflow:

### Step 1: Owner Signup on Mobile App
```
1. Launch DriveGuard app
2. Click "Create Account"
3. Email: anything@example.com
4. Password: anything (min 6 chars)
5. Tap "CREATE ACCOUNT"

Result: ✅ You're logged in as owner
Your ownerId: [stored in token and app storage]
```

### Step 2: Create a Vehicle
```
Option A: Using Mobile App (if implemented)
  1. Go to vehicle management screen
  2. Tap "Add Vehicle"
  3. Enter vehicle details
  4. Save
  Result: Vehicle created with your ownerId

Option B: Using Backend API
  # Login first
  EMAIL="your@email.com"
  PASSWORD="yourpassword"
  
  # Get token
  TOKEN=$(curl -X POST http://10.44.202.155:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"'$EMAIL'","password":"'$PASSWORD'"}' | jq '.data.token')
  
  # Create vehicle
  curl -X POST http://10.44.202.155:5000/api/vehicles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "vehicle_name": "Bus-001",
      "vehicle_number": "DG-2024-001",
      "status": "active",
      "safety_rating": 85,
      "fuel_level": 90
    }'
  
  Result: ✅ Vehicle created with your ownerId
```

### Step 3: Create a Driver (in your fleet)
```
Option A: Using assign-vehicle screen
  1. Go to assign-vehicle screen
  2. Tap "Add Driver" or similar
  3. Enter driver details (name, email, phone)
  4. Driver joins YOUR fleet (linked to your ownerId)

Option B: Using Backend API
  DRIVER_EMAIL="driver@example.com"
  DRIVER_PASSWORD="password123"
  
  curl -X POST http://10.44.202.155:5000/api/drivers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'$DRIVER_EMAIL'",
      "password": "'$DRIVER_PASSWORD'",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "5551234567"
    }'
  
  Result: ✅ Driver created and associated with your fleet
```

### Step 4: Assign Driver to Vehicle
```
On Mobile App:
  1. Go to assign-vehicle screen
  2. Select the driver
  3. Select the vehicle you created
  4. Confirm assignment

API:
  curl -X PUT http://10.44.202.155:5000/api/drivers/{driverId}/assign-vehicles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"vehicleId": "{vehicleId}"}'
  
  Result: ✅ Driver assigned to vehicle
```

### Step 5: Verify Vehicles Show Up
```
What should happen on mobile app:
  1. You (owner) navigate to assign-vehicle screen
  2. You see YOUR vehicle(s) in the list
  3. Ready for driver assignment

If vehicles don't show:
  1. Check you're logged in as owner (not driver)
  2. Check vehicle was created with your account
  3. Run diagnostics: node test-complete-flow.js
```

---

## 🔍 Understanding the `assign-vehicle` Screen

This screen is designed for **OWNERS** to:

1. **View all your vehicles** 
   - Calls: `GET /api/vehicles/native/available`
   - Returns: Vehicles filtered by your ownerId from JWT
   - Shows: Buses that YOU own

2. **See assignment status**
   - Which driver is assigned to which vehicle
   - Which vehicles are unassigned

3. **Manage assignments**
   - Assign a driver to a vehicle
   - Reassign to different driver
   - Unassign driver from vehicle

**This is NOT a driver app** - drivers will have a separate interface in the future.

---

## 🐛 Troubleshooting: "No vehicles showing"

### Check 1: Are you logged in?
```bash
# Test login and vehicle fetch
node test-vehicle-auth.js

Should show:
✅ Login successful
✅ Token received
✅ X vehicles found
```

### Check 2: Do you own any vehicles?
```bash
# Get your ownerId from the app or token
# Then check:
curl "http://10.44.202.155:5000/api/vehicles/public/available?ownerId=YOUR_OWNER_ID"

If empty: No vehicles created yet
If shows vehicles: Backend is OK, mobile app issue
```

### Check 3: Is auth working?
```bash
# Extract JWT from mobile app (check mobile logs)
# Then:
curl http://10.44.202.155:5000/api/auth/debug-token \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_JWT_TOKEN"}'

Should echo back your ownerId from the token
```

### Check 4: Can mobile app send the token?
```
Look for these logs in mobile app console:
  🔐 API Request Interceptor - Token: [token starts with...]
  ✅ Authorization header set

If missing: Mobile app not reading token from storage
```

---

## 🔄 Multi-Account Testing

To test with your current setup (existing vehicles):

1. **Find the original owner's credentials**
   - Email: ? (need to find)
   - Password: ? (need to find)

2. **Log out** of mobile app

3. **Log in** with original credentials

4. **Vehicles should appear** immediately
   - If you created them: ✅ You'll see them
   - If someone else created them: ☑️ You won't see them (different ownerId)

5. **To add more vehicles to your fleet:**
   - Create new ones through the app
   - Or use: `node test-complete-flow.js`
   - Or use the backend API directly

---

## 🎯 The Big Picture

```
Your Mobile App Status:
├─ Authentication: ✅ WORKING
├─ Token Generation: ✅ WORKING  
├─ Token Storage: ✅ WORKING
├─ Request Headers: ✅ WORKING
├─ Backend Verification: ✅ WORKING
│
└─ Vehicle Visibility: ⚠️ DEPENDS ON ACCOUNT
    ├─ If logged in with RIGHT owner: ✅ Shows vehicles
    ├─ If logged in with WRONG owner: ❌ Shows nothing
    └─ If vehicles don't exist: ❌ Shows nothing
```

**You need to make sure:**
1. You're logged in as the owner who OWNS the vehicles
2. OR create new vehicles for your current owner account

Everything else is working perfectly! ✅

---

## 📞 Quick Reference

**To test if backend is working:**
```bash
curl http://10.44.202.155:5000/api/health
# Should return: {"status": "Backend is running", ...}
```

**To create a test owner + vehicle + verify:**
```bash
cd c:\ARJUN\ DIVRANIYA\Coding\ Gita\Craftathon\Craftathon_Hackathon\Native\backend
node test-complete-flow.js
# Creates: owner + vehicle + fetches from both endpoints
```

**To debug your specific account:**
```bash
node test-vehicle-auth.js
# Login with your credentials + debug token
```

---

**All technical components are verified working. ✅ The solution is ensuring you test with the right account or create vehicles for your current account.**
