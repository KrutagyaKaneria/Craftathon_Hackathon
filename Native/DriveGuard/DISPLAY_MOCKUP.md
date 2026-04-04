# Frontend Display Mockup - Vehicle Details

## Dashboard Header (Metrics Overview)
```
┌────────────────────────────────────────────┐
│ Active Fleet Units                   ◉ Ops │
│ Real-time monitoring of fleet vehicles.   │
│ Tactical data synchronized with protocol. │
├────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐         │
│ │ Total_       │ │ Active_      │         │
│ │ Vehicles     │ │ Units        │         │
│ │              │ │              │         │
│ │     6        │ │      1       │         │
│ └──────────────┘ └──────────────┘         │
│ ┌──────────────┐ ┌──────────────┐         │
│ │ Avg_Safety   │ │ Fuel_Low     │         │
│ │              │ │              │         │
│ │    85%       │ │      0       │         │
│ └──────────────┘ └──────────────┘         │
└────────────────────────────────────────────┘
```

## Vehicle Card - Collapsed View
```
┌─────────────────────────────────────────┐
│ 🚗 BUS-6                         🔽      │
│    2027                                 │
│    ⚖️  85%    🔋 75%    ✓ IDLE         │
└─────────────────────────────────────────┘
```

## Vehicle Card - Expanded View (Full Details)

```
┌─────────────────────────────────────────┐
│ 🚗 BUS-6                         🔼      │
│    Metro Transit Pulsar                 │
│    ⚖️  85%    🔋 75%    ✓ IDLE         │
├─────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐  │
│ │    Model       │ │     Year       │  │
│ │ Volvo 9400 B11R│ │      2023      │  │
│ └────────────────┘ └────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐  │
│ │ Safety Rating  │ │  Fuel Level    │  │
│ │      92%       │ │      85%       │  │
│ █████████████░░░░ │ █████████████░░░░  │
│ └────────────────┘ └────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐  │
│ │     Status     │ │ Protocol Status│  │
│ │   AVAILABLE    │ │     ACTIVE     │  │
│ └────────────────┘ └────────────────┘  │
│                                         │
│ Mileage          │   12,500 km         │
│ ───────────────────────────────────────│
│ Location         │  72.5234, 23.1815   │
│ ───────────────────────────────────────│
│ Assigned To      │     Unassigned      │
│ ───────────────────────────────────────│
│ Maintenance Due  │    07/04/2026       │
│ ───────────────────────────────────────│
│ VIN              │  VLV1A2B3C4D5E      │
│ ───────────────────────────────────────│
│ Condition        │  ✅ GOOD - Well     │
│                  │  maintained         │
│ ───────────────────────────────────────│
│                                         │
│  7-Day Performance                      │
│  │                                      │
│ █│ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮              │
│  └────═────═────═────═────═────═────   │
│     1D  2D  3D  4D  5D  6D  7D          │
│                                         │
└─────────────────────────────────────────┘
```

## Vehicle Info Card - BUS-5 (In Transit)
```
┌─────────────────────────────────────────┐
│ 🚗 BUS-5                         🔼      │
│    City Link Connect                    │
│    ⚖️  85%    🔋 75%    • IN_TRANSIT   │
├─────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐  │
│ │    Model       │ │     Year       │  │
│ │Scania Metroliner│ │      2026      │  │
│ └────────────────┘ └────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐  │
│ │ Safety Rating  │ │  Fuel Level    │  │
│ │      82%       │ │      60%       │  │
│ █████████████░░░░ │ ████████░░░░░░░░   │
│ └────────────────┘ └────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐  │
│ │     Status     │ │ Protocol Status│  │
│ │    IN-USE      │ │  IN_TRANSIT    │  │
│ └────────────────┘ └────────────────┘  │
│                                         │
│ Mileage          │   45,000 km         │
│ ───────────────────────────────────────│
│ Location         │  72.5367, 23.1563   │
│ ───────────────────────────────────────│
│ Assigned To      │   Assigned          │
│ ───────────────────────────────────────│
│ Maintenance Due  │    06/20/2026       │
│ ───────────────────────────────────────│
│ VIN              │  SCA1D2E3F4G5H      │
│ ───────────────────────────────────────│
│ Condition        │  🚌 IN_TRANSIT -    │
│                  │  Currently on route │
│ ───────────────────────────────────────│
│                                         │
│  7-Day Performance                      │
│  │                                      │
│ █│ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮              │
│  └────═────═────═────═────═────═────   │
│     1D  2D  3D  4D  5D  6D  7D          │
│                                         │
└─────────────────────────────────────────┘
```

## Vehicle Info Card - BUS-4 (Needs Maintenance)
```
┌─────────────────────────────────────────┐
│ 🚗 BUS-4                         🔼      │
│    Regional Express                     │
│    ⚖️  68%    🔋 25%    ⚠️ IDLE        │
├─────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐  │
│ │    Model       │ │     Year       │  │
│ │Mercedes Travego │ │      2024      │  │
│ └────────────────┘ └────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐  │
│ │ Safety Rating  │ │  Fuel Level    │  │
│ │      68%       │ │      25%       │  │
│ ███████░░░░░░░░░░ │ ██░░░░░░░░░░░░░░   │
│ └────────────────┘ └────────────────┘  │
│ ┌────────────────┐ ┌────────────────┐  │
│ │     Status     │ │ Protocol Status│  │
│ │  MAINTENANCE   │ │     IDLE       │  │
│ └────────────────┘ └────────────────┘  │
│                                         │
│ Mileage          │   85,000 km         │
│ ───────────────────────────────────────│
│ Location         │  72.5142, 23.2010   │
│ ───────────────────────────────────────│
│ Assigned To      │     Unassigned      │
│ ───────────────────────────────────────│
│ Maintenance Due  │    04/10/2026       │
│ ───────────────────────────────────────│
│ VIN              │  MBZ5I6J7K8L9M      │
│ ───────────────────────────────────────│
│ Condition        │  ⚠️ NEEDS           │
│                  │  MAINTENANCE - Low  │
│                  │  fuel, high mileage │
│ ───────────────────────────────────────│
│                                         │
│  7-Day Performance                      │
│  │                                      │
│ █│ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮ ▮▮              │
│  └────═────═────═────═────═────═────   │
│     1D  2D  3D  4D  5D  6D  7D          │
│                                         │
└─────────────────────────────────────────┘
```

## Color Legend

### Safety Rating Colors
- 🟢 ≥ 85%: Excellent (Green)
- 🟡 70-84%: Good (Yellow)  
- 🔴 < 70%: Needs Attention (Red)

### Fuel Level Colors
- 🟢 ≥ 50%: Adequate (Green)
- 🟡 30-49%: Low (Yellow)
- 🔴 < 30%: Critical (Red)

### Status Indicators
- 🟢 Available (Green)
- 🔵 In Transit (Cyan)
- ⚠️ Maintenance (Yellow)
- 🔴 Offline (Red)

## Vehicle List View (Scrollable)
```
┌──────────────────────────────────────────┐
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🚗 BUS-6              🔽            │  │
│ │    2027                            │  │
│ │    ⚖️  85%  🔋 75%  ✓ IDLE        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🚗 BUS-5              🔽            │  │
│ │    2026                            │  │
│ │    ⚖️  85%  🔋 75%  • IN_TRANSIT  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🚗 BUS-4              🔽            │  │
│ │    2026                            │  │
│ │    ⚖️  68%  🔋 25%  ⚠️ IDLE        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🚗 METRO-01           🔽            │  │
│ │    2024                            │  │
│ │    ⚖️  92%  🔋 90%  ✓ IDLE        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🚗 CITY-03            🔽            │  │
│ │    2025                            │  │
│ │    ⚖️  75%  🔋 60%  ✓ IDLE        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 🚗 TRUCK-02           🔽            │  │
│ │    2023                            │  │
│ │    ⚖️  88%  🔋 45%  ✓ IDLE        │  │
│ └────────────────────────────────────┘  │
│                                          │
│                 ⊕ [Add Vehicle]         │
│                                          │
└──────────────────────────────────────────┘
```

## Performance Chart (7-Day History)

```
Performance %
100 │                                    
 90 │ ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮
 80 │ ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮
 70 │ ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮
 60 │ ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮
 50 │ ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮  ▮▮
    └──────────────────────────────→
      1D  2D  3D  4D  5D  6D  7D

Actual Values: [92, 88, 90, 87, 89, 91, 88]
```

## Button States

### FAB (Floating Action Button) - Add Vehicle
```
        ⊕
    [  +  ]
      Blue button
   at bottom right
```

### Expand/Collapse Button
- Collapsed: 🔽 (Chevron Down)
- Expanded: 🔼 (Chevron Up)

### Search/Filter
```
┌──────────────────────┐  ┌──────────┐
│ 🔍 Identify vehicle  │  │ Filters  │
└──────────────────────┘  └──────────┘
```

## Information Density

### Collapsed = Minimal
- Vehicle ID
- Vehicle Name
- Safety %
- Fuel %
- Status badge

### Expanded = Complete
- All collapsed info
- Model & Year
- Mileage
- Location coordinates
- Driver assignment
- Maintenance due date
- VIN
- Condition notes
- 7-day performance chart

---

**Total Vehicle Fields Displayed:**
✅ 15+ distinct vehicle data points per expanded card view
✅ Real-time data from comprehensive backend object
✅ Color-coded for quick visual assessment
✅ Organized in intuitive sections
✅ Mobile-optimized responsive layout
