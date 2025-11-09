# Gorica Calendar - Frontend & Backend Integration Guide

This guide explains how the frontend and backend are integrated and how to run the complete application.

## 🏗️ Architecture Overview

The application consists of two separate parts:

1. **Frontend** (`Gorica-calendar/`) - React + Vite application
2. **Backend** (`Gorica-backend/`) - Node.js + Express + PostgreSQL API

## 📦 Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Gorica-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE gorica_calendar;
   ```

4. **Configure environment:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and update with your database credentials:
   ```env
   DATABASE_URL=postgres://postgres:your_password@127.0.0.1:5432/gorica_calendar
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

5. **Run database migration:**
   ```bash
   npm run db:migrate
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

   The backend will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Gorica-calendar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (optional):**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` if your backend runs on a different URL:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## 🔌 How Integration Works

### API Communication

The frontend communicates with the backend through REST API endpoints:

- **Base URL:** `http://localhost:3001/api` (configurable via `VITE_API_URL`)
- **Patients API:** `/api/patients`
- **Appointments API:** `/api/appointments`

### Data Flow

1. **App Load:**
   - Frontend fetches all appointments from backend on mount
   - Appointments are transformed from backend format to frontend format

2. **Creating Appointment:**
   - User enters patient name and appointment details
   - Frontend searches for existing patient or creates new one
   - Appointment is created in backend with patient_id
   - Backend validates time slot availability (prevents overlaps)
   - Frontend updates local state with new appointment

3. **Updating Appointment:**
   - User modifies appointment details
   - If patient name changed, frontend creates/finds new patient
   - Appointment is updated in backend
   - Frontend syncs local state

4. **Deleting Appointment:**
   - User cancels appointment
   - Backend marks appointment as 'cancelled' (soft delete)
   - Frontend removes from local state

### Data Transformation

The application includes data transformers to convert between frontend and backend formats:

**Backend Format:**
```json
{
  "id": 1,
  "patient_id": 5,
  "date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "09:15:00",
  "appointment_type": "consultation",
  "notes": "Follow-up visit",
  "status": "scheduled",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "123-456-7890"
}
```

**Frontend Format:**
```json
{
  "id": "1",
  "patientId": 5,
  "patientName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "123-456-7890",
  "appointmentType": "consultation",
  "notes": "Follow-up visit",
  "time": "2024-01-15T09:00:00Z", // Date object
  "status": "scheduled"
}
```

## 🎯 Key Features

### Patient Management
- **Automatic Patient Creation:** When creating an appointment, if the patient doesn't exist, a new patient record is automatically created
- **Patient Search:** The system searches for existing patients by name before creating new ones
- **Patient Matching:** Tries to find exact name matches first, then falls back to partial matches

### Appointment Management
- **Overlap Prevention:** Backend prevents double-booking of time slots
- **Soft Deletes:** Cancelled appointments are marked as 'cancelled' rather than deleted
- **Status Tracking:** Appointments can be 'scheduled', 'completed', or 'cancelled'

### Error Handling
- **Network Errors:** Frontend displays error messages if backend is unavailable
- **Validation Errors:** Backend returns descriptive error messages for validation failures
- **Loading States:** UI shows loading indicators during API calls

## 🧪 Testing the Integration

1. **Start both servers:**
   - Backend: `cd Gorica-backend && npm run dev`
   - Frontend: `cd Gorica-calendar && npm run dev`

2. **Test creating an appointment:**
   - Open frontend in browser
   - Click on a time slot
   - Enter patient name and details
   - Submit the form
   - Check backend console for API logs

3. **Test patient search:**
   - Create an appointment with "John Doe"
   - Create another appointment with "John Doe"
   - Verify it uses the same patient record

4. **Test overlap prevention:**
   - Create an appointment at 9:00 AM
   - Try to create another at 9:00 AM
   - Should see error message about time slot being booked

## 📝 API Endpoints Reference

### Patients
- `GET /api/patients` - Get all patients (optional `?search=term`)
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get all appointments (optional filters: `?date=YYYY-MM-DD`, `?start_date=...&end_date=...`, `?patient_id=...`, `?status=...`)
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment (add `?hard_delete=true` for permanent deletion)

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists: `CREATE DATABASE gorica_calendar;`
- Run migration: `npm run db:migrate`

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env` file
- Check CORS settings in backend `server.js`
- Check browser console for CORS errors

### Appointments not loading
- Check browser console for errors
- Verify backend is running and accessible
- Check network tab in browser dev tools
- Verify database has data: `SELECT * FROM appointments;`

### Patient creation fails
- Check patient name is not empty
- Verify database connection
- Check backend logs for detailed error messages

## 📚 File Structure

### Backend
```
Gorica-backend/
├── database/
│   ├── db.js          # Database connection
│   └── schema.sql     # Database schema
├── routes/
│   ├── patients.js    # Patient API routes
│   └── appointments.js # Appointment API routes
├── scripts/
│   └── migrate.js    # Database migration script
├── server.js          # Express server
└── package.json       # Dependencies
```

### Frontend
```
Gorica-calendar/
├── src/
│   ├── services/
│   │   └── api.js     # API service layer
│   ├── store/
│   │   └── useAppStore.js # Zustand store with API integration
│   └── components/
│       └── AppointmentModal.jsx # Updated with patient management
└── package.json
```

## ✅ Next Steps

The integration is complete! You can now:
- Create, update, and delete appointments
- Automatically manage patients
- Prevent appointment overlaps
- Persist all data in PostgreSQL

To enhance the application further, consider:
- Adding patient search/autocomplete in the appointment modal
- Adding appointment filtering by date range
- Adding appointment status management UI
- Adding patient management page
- Adding appointment reminders/notifications

