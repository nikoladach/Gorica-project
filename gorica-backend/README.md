# Gorica Calendar Backend API

Backend API server for the Gorica Calendar application using Node.js, Express, and PostgreSQL.

## 🏗️ Architecture

This backend follows a simplified single-doctor architecture:
- **One Doctor**: The office itself (no doctor table needed)
- **Many Patients**: Searchable patient management
- **Appointments**: Links patients to time slots

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE gorica_calendar;
```

2. Copy the environment file:
```bash
cp env.example .env
```

3. Update `.env` with your database credentials:
```env
DATABASE_URL=postgres://postgres:your_password@127.0.0.1:5432/gorica_calendar
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Note:** You can use either `DATABASE_URL` (connection string) or individual connection parameters. The connection string format is: `postgres://username:password@host:port/database`

### 3. Run Database Migration

```bash
npm run db:migrate
```

This will create the `patients` and `appointments` tables with all necessary indexes and triggers.

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## 📊 Database Schema

### Patients Table
- `id` (SERIAL PRIMARY KEY)
- `first_name` (VARCHAR(100))
- `last_name` (VARCHAR(100))
- `phone` (VARCHAR(20))
- `dob` (DATE)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Appointments Table
- `id` (SERIAL PRIMARY KEY)
- `patient_id` (INTEGER, FK to patients)
- `date` (DATE)
- `start_time` (TIME)
- `end_time` (TIME)
- `appointment_type` (VARCHAR(50))
- `notes` (TEXT)
- `status` (VARCHAR(20)) - 'scheduled', 'completed', or 'cancelled'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check server and database status

### Patients

- `GET /api/patients` - Get all patients (optional `?search=term` query parameter)
- `GET /api/patients/:id` - Get single patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (only if no appointments exist)

**Example POST /api/patients:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "123-456-7890",
  "dob": "1990-01-15",
  "notes": "Regular patient"
}
```

### Appointments

- `GET /api/appointments` - Get all appointments
  - Query parameters: `date`, `start_date`, `end_date`, `patient_id`, `status`
- `GET /api/appointments/:id` - Get single appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment (soft delete)
  - Add `?hard_delete=true` for permanent deletion

**Example POST /api/appointments:**
```json
{
  "patient_id": 1,
  "date": "2024-01-15",
  "start_time": "09:00",
  "end_time": "09:15",
  "appointment_type": "consultation",
  "notes": "Follow-up visit",
  "status": "scheduled"
}
```

## 🔒 Features

- **Overlap Prevention**: Automatically prevents double-booking of time slots
- **Soft Deletes**: Appointments are cancelled (not deleted) by default
- **Patient Search**: Search patients by name or phone number
- **Automatic Timestamps**: `created_at` and `updated_at` are managed automatically
- **CORS Enabled**: Configured for frontend communication

## 🧪 Testing

Test the API using curl or Postman:

```bash
# Health check
curl http://localhost:3001/health

# Get all patients
curl http://localhost:3001/api/patients

# Create a patient
curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","phone":"123-456-7890"}'
```

## 📝 Notes

- The backend validates appointment overlaps before creating/updating
- Patients cannot be deleted if they have existing appointments
- All timestamps are in UTC
- The API returns patient information joined with appointments for convenience

