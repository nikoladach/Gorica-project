# Gorica Backend API Endpoints

## Base URL
- Development: `http://localhost:3001/api`
- Health Check: `http://localhost:3001/health`

## API Routes Summary

### ✅ Health Check
- **GET** `/health`
  - Tests database connection
  - Returns: `{ status: 'healthy', database: 'connected', timestamp: '...' }`

---

## 👥 Patients API (`/api/patients`)

### ✅ GET All Patients
- **Endpoint**: `GET /api/patients`
- **Query Parameters**:
  - `search` (optional): Search by first name, last name, or phone
- **Response**: Array of patient objects
- **Status Codes**: 200 (success), 500 (error)

### ✅ GET Single Patient
- **Endpoint**: `GET /api/patients/:id`
- **Response**: Patient object
- **Status Codes**: 200 (success), 404 (not found), 500 (error)

### ✅ CREATE Patient
- **Endpoint**: `POST /api/patients`
- **Body**:
  ```json
  {
    "first_name": "string (required)",
    "last_name": "string (required)",
    "phone": "string (optional)",
    "dob": "YYYY-MM-DD (optional)",
    "notes": "string (optional)"
  }
  ```
- **Response**: Created patient object
- **Status Codes**: 201 (created), 400 (bad request), 409 (duplicate), 500 (error)

### ✅ UPDATE Patient
- **Endpoint**: `PUT /api/patients/:id`
- **Body**: Same as CREATE
- **Response**: Updated patient object
- **Status Codes**: 200 (success), 400 (bad request), 404 (not found), 409 (duplicate), 500 (error)

### ✅ DELETE Patient
- **Endpoint**: `DELETE /api/patients/:id`
- **Response**: `{ message: 'Patient deleted successfully', patient: {...} }`
- **Status Codes**: 200 (success), 400 (has appointments), 404 (not found), 500 (error)
- **Note**: Cannot delete patient with existing appointments

---

## 📅 Appointments API (`/api/appointments`)

### ✅ GET All Appointments
- **Endpoint**: `GET /api/appointments`
- **Query Parameters**:
  - `date` (optional): Filter by specific date (YYYY-MM-DD)
  - `start_date` (optional): Start date for range filter
  - `end_date` (optional): End date for range filter (requires start_date)
  - `patient_id` (optional): Filter by patient ID
  - `status` (optional): Filter by status ('scheduled', 'completed', 'cancelled')
- **Response**: Array of appointment objects with patient details
- **Status Codes**: 200 (success), 500 (error)

### ✅ GET Single Appointment
- **Endpoint**: `GET /api/appointments/:id`
- **Response**: Appointment object with patient details
- **Status Codes**: 200 (success), 404 (not found), 500 (error)

### ✅ CREATE Appointment
- **Endpoint**: `POST /api/appointments`
- **Body**:
  ```json
  {
    "patient_id": "number (required)",
    "date": "YYYY-MM-DD (required)",
    "start_time": "HH:MM:SS or HH:MM (required)",
    "end_time": "HH:MM:SS or HH:MM (required)",
    "appointment_type": "string (required)",
    "notes": "string (optional)",
    "status": "string (optional, default: 'scheduled')"
  }
  ```
- **Response**: Created appointment object with patient details
- **Status Codes**: 201 (created), 400 (bad request), 404 (patient not found), 409 (time slot booked), 500 (error)
- **Features**:
  - Automatically normalizes time format (HH:MM → HH:MM:SS)
  - Checks for overlapping appointments
  - Validates patient exists
  - Handles cancelled appointments (replaces them)

### ✅ UPDATE Appointment
- **Endpoint**: `PUT /api/appointments/:id`
- **Body**: Same as CREATE (all fields optional)
- **Response**: Updated appointment object with patient details
- **Status Codes**: 200 (success), 400 (bad request), 404 (not found), 409 (time slot booked), 500 (error)
- **Features**:
  - Automatically normalizes time format
  - Checks for overlapping appointments (excluding current appointment)
  - Only updates provided fields

### ✅ DELETE/CANCEL Appointment
- **Endpoint**: `DELETE /api/appointments/:id`
- **Query Parameters**:
  - `hard_delete` (optional): Set to `true` for permanent deletion
- **Response**: 
  - Soft delete: `{ message: 'Appointment cancelled successfully', appointment: {...} }`
  - Hard delete: `{ message: 'Appointment deleted successfully', appointment: {...} }`
- **Status Codes**: 200 (success), 404 (not found), 500 (error)
- **Note**: Default is soft delete (sets status to 'cancelled')

---

## 🔧 Error Handling

All endpoints now include comprehensive error handling:

### PostgreSQL Error Codes Handled:
- **23505**: Unique constraint violation → 409 Conflict
- **23503**: Foreign key constraint violation → 400 Bad Request
- **23502**: NOT NULL constraint violation → 400 Bad Request
- **22007/22008**: Invalid date/time format → 400 Bad Request

### Error Response Format:
```json
{
  "error": "Error message here"
}
```

### Development Mode:
- In development (`NODE_ENV !== 'production'`), error messages include full error details
- All errors are logged to console with full stack traces

---

## 📊 Database Schema

### Patients Table
- `id` (SERIAL PRIMARY KEY)
- `first_name` (VARCHAR(100) NOT NULL)
- `last_name` (VARCHAR(100) NOT NULL)
- `phone` (VARCHAR(20))
- `dob` (DATE)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Appointments Table
- `id` (SERIAL PRIMARY KEY)
- `patient_id` (INTEGER NOT NULL, FOREIGN KEY)
- `date` (DATE NOT NULL)
- `start_time` (TIME NOT NULL)
- `end_time` (TIME NOT NULL)
- `appointment_type` (VARCHAR(50) NOT NULL)
- `notes` (TEXT)
- `status` (VARCHAR(20) DEFAULT 'scheduled', CHECK: 'scheduled'|'completed'|'cancelled')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## ✅ Connection Status

All routes are properly connected in `server.js`:
- ✅ `/api/patients` → `patientsRouter`
- ✅ `/api/appointments` → `appointmentsRouter`
- ✅ `/health` → Health check endpoint
- ✅ CORS configured for development
- ✅ Error handling middleware in place
- ✅ 404 handler for unknown routes

---

## 🧪 Testing Endpoints

You can test all endpoints using:
- **Browser**: Navigate to GET endpoints
- **Postman/Insomnia**: Full CRUD testing
- **curl**: Command-line testing
- **Frontend**: React app at `http://localhost:5173`

---

## 📝 Notes

1. **Time Format**: All times are automatically normalized to `HH:MM:SS` format
2. **Date Format**: All dates must be in `YYYY-MM-DD` format
3. **Patient Deletion**: Patients with appointments cannot be deleted
4. **Appointment Overlaps**: System prevents double-booking of time slots
5. **Cancelled Appointments**: Cancelled appointments are replaced when a new appointment is created at the same time

