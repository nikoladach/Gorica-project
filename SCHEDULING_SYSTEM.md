# 🗓️ How the Scheduling System Works

## Overview
This is a **15-minute appointment slot system** for a doctor's office. Each appointment is exactly 15 minutes long, and the system prevents double-booking.

---

## 📋 System Architecture

### **Frontend (React)**
- **Calendar Views**: Day, Week, Month
- **Time Slots**: Generated in 15-minute intervals
- **State Management**: Zustand store
- **API Communication**: REST API calls

### **Backend (Node.js/Express)**
- **Database**: PostgreSQL
- **Validation**: Conflict detection before insertion
- **Error Handling**: Detailed error messages

---

## ⏰ Time Slot System

### **Time Slot Generation**
- **Morning Shift**: 9:00 AM - 5:00 PM (9:00, 9:15, 9:30, ... 16:45)
- **Evening Shift**: 2:00 PM - 9:00 PM (14:00, 14:15, 14:30, ... 20:45)
- **Interval**: 15 minutes between slots
- **Format**: Each slot is a JavaScript `Date` object

### **How Slots Work**
```javascript
// Example: Morning shift on Nov 6, 2025
09:00 - 09:15 (Slot 1)
09:15 - 09:30 (Slot 2)
09:30 - 09:45 (Slot 3)
... and so on
```

---

## 🔄 Appointment Creation Flow

### **Step 1: User Clicks a Time Slot**
- User clicks on an available time slot in the calendar
- The `AppointmentModal` opens with the selected date/time pre-filled

### **Step 2: User Fills Form**
- **Patient Name** (required): e.g., "John Doe"
- **Phone Number** (optional): e.g., "555-0101"
- **Appointment Type** (required): Consultation, Follow-up, Checkup, Procedure, Emergency
- **Notes** (optional): Additional information

### **Step 3: Frontend Processing**
```javascript
// 1. Create or find patient
const patient = await createOrFindPatient("John Doe", "555-0101");

// 2. Transform to backend format
{
  patient_id: 5,
  date: "2025-11-06",
  start_time: "09:00:00",
  end_time: "09:15:00",  // Always 15 minutes after start
  appointment_type: "consultation",
  notes: "Routine check",
  status: "scheduled"
}
```

### **Step 4: Backend Validation**
The backend performs **3 critical checks**:

#### **Check 1: Patient Exists**
```sql
SELECT id FROM patients WHERE id = $1
```
- Verifies the patient exists in the database
- Returns 404 if patient not found

#### **Check 2: Exact Time Slot Conflict**
```sql
SELECT id, status FROM appointments 
WHERE date = '2025-11-06' AND start_time = '09:00:00'
```
- Checks if the exact same time slot is already booked
- **If cancelled**: Deletes the cancelled appointment and allows booking
- **If active**: Returns 409 Conflict error

#### **Check 3: Overlapping Time Slots**
```sql
SELECT id FROM appointments 
WHERE date = '2025-11-06' 
AND status != 'cancelled'
AND (
  (start_time <= '09:00:00' AND end_time > '09:00:00') OR
  (start_time < '09:15:00' AND end_time >= '09:15:00') OR
  (start_time >= '09:00:00' AND end_time <= '09:15:00')
)
```
- Prevents overlapping appointments
- Example: If 09:00-09:15 is booked, you can't book 09:10-09:25

### **Step 5: Database Insertion**
```sql
INSERT INTO appointments 
(patient_id, date, start_time, end_time, appointment_type, notes, status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *
```

### **Step 6: Frontend Refresh**
- After successful creation, frontend refreshes all appointments
- Calendar updates to show the new appointment

---

## 🗄️ Database Schema

### **Appointments Table**
```sql
- id (SERIAL PRIMARY KEY)
- patient_id (INTEGER, FOREIGN KEY → patients.id)
- date (DATE) - e.g., '2025-11-06'
- start_time (TIME) - e.g., '09:00:00'
- end_time (TIME) - e.g., '09:15:00'
- appointment_type (VARCHAR) - consultation, follow-up, etc.
- notes (TEXT)
- status (VARCHAR) - 'scheduled', 'completed', 'cancelled'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Patients Table**
```sql
- id (SERIAL PRIMARY KEY)
- first_name (VARCHAR)
- last_name (VARCHAR)
- phone (VARCHAR)
- dob (DATE)
- notes (TEXT)
```

---

## 🔍 Conflict Detection Logic

### **Scenario 1: Exact Match**
```
Existing: Nov 6, 2025 at 09:00:00
Requested: Nov 6, 2025 at 09:00:00
Result: ❌ BLOCKED - "This time slot is already booked by [Patient Name]"
```

### **Scenario 2: Overlap - Start Time Conflicts**
```
Existing: 09:00:00 - 09:15:00
Requested: 09:10:00 - 09:25:00
Result: ❌ BLOCKED - Overlaps with existing appointment
```

### **Scenario 3: Overlap - End Time Conflicts**
```
Existing: 09:15:00 - 09:30:00
Requested: 09:00:00 - 09:20:00
Result: ❌ BLOCKED - Overlaps with existing appointment
```

### **Scenario 4: Complete Overlap**
```
Existing: 09:00:00 - 09:15:00
Requested: 09:05:00 - 09:10:00
Result: ❌ BLOCKED - Completely within existing appointment
```

### **Scenario 5: Cancelled Appointment**
```
Existing: Nov 6, 2025 at 09:00:00 (status: 'cancelled')
Requested: Nov 6, 2025 at 09:00:00
Result: ✅ ALLOWED - Cancelled appointment is deleted, slot freed
```

---

## 📅 Calendar Display Logic

### **Day View**
- Shows all time slots for the selected day
- Each slot displays:
  - Time (e.g., "09:00")
  - Patient name (if booked)
  - Appointment type
  - Notes (if any)
- **Matching Logic**: Compares appointment date/time with slot date/time

### **Week View**
- Shows 7 days (Monday - Sunday)
- Each day has time slots
- Appointments appear in the correct day/time

### **Month View**
- Shows calendar grid
- Displays up to 3 appointments per day
- Shows "+X more" if there are more appointments

### **Sidebar**
- Shows today's appointments only
- Filterable by appointment type
- Sorted by time

---

## 🔄 Data Flow

```
1. User clicks time slot
   ↓
2. AppointmentModal opens
   ↓
3. User fills form and submits
   ↓
4. Frontend: createOrFindPatient()
   ↓
5. Frontend: Transform to backend format
   ↓
6. API: POST /api/appointments
   ↓
7. Backend: Validate patient exists
   ↓
8. Backend: Check for conflicts
   ↓
9. Backend: Insert into database
   ↓
10. Backend: Return appointment with patient details
   ↓
11. Frontend: Refresh all appointments
   ↓
12. Calendar updates to show new appointment
```

---

## 🛡️ Safety Features

### **1. Patient Auto-Creation**
- If patient doesn't exist, system creates them automatically
- Searches for existing patients by name first
- Prevents duplicate patients

### **2. Time Format Normalization**
- Accepts both `HH:MM` and `HH:MM:SS` formats
- Automatically converts to `HH:MM:SS` for database

### **3. Cancelled Appointment Handling**
- Cancelled appointments are automatically deleted when slot is reused
- Prevents "ghost" appointments from blocking slots

### **4. Error Messages**
- Shows which patient has conflicting appointment
- Shows time range of overlapping appointments
- Clear, actionable error messages

---

## 📊 Key Features

✅ **15-minute appointment slots**
✅ **Automatic conflict detection**
✅ **Patient auto-creation**
✅ **Multiple calendar views** (Day/Week/Month)
✅ **Shift-based scheduling** (Morning/Evening)
✅ **Soft delete** (cancelled status)
✅ **Real-time updates** (refreshes after changes)
✅ **Date navigation** (view any date)

---

## 🐛 Common Issues & Solutions

### **Issue: "Time slot already booked" but calendar shows empty**
**Cause**: Appointment exists in database but frontend isn't showing it
**Solution**: 
- Check backend console for conflicting appointment details
- Verify date format matches (YYYY-MM-DD)
- Refresh appointments manually

### **Issue: Appointments not showing on correct date**
**Cause**: Date mismatch between frontend and backend
**Solution**: 
- Navigate to the correct date using date picker
- Check that appointment date matches calendar date

### **Issue: Can't create appointment for future dates**
**Cause**: No restrictions - should work for any date
**Solution**: 
- Use date picker to navigate to desired date
- Click on available time slot
- Fill form and submit

---

## 🔧 Technical Details

### **Time Slot Matching**
```javascript
isSameTimeSlot(date1, date2) {
  // Compares:
  // 1. Date (YYYY-MM-DD format)
  // 2. Time (HH:MM format)
  // Both must match exactly
}
```

### **Date Transformation**
```javascript
// Frontend → Backend
Date object → { date: "2025-11-06", start_time: "09:00:00" }

// Backend → Frontend
{ date: "2025-11-06", start_time: "09:00:00" } → Date object
```

### **Appointment Duration**
- **Fixed**: Always 15 minutes
- **Calculated**: `end_time = start_time + 15 minutes`
- **Example**: 09:00 → 09:15, 09:15 → 09:30

---

This system ensures **no double-booking** and provides a **smooth scheduling experience** for both staff and patients.

