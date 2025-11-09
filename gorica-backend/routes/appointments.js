import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

// GET all appointments with optional filters
router.get('/', async (req, res) => {
  try {
    const { date, start_date, end_date, patient_id, status, service_type } = req.query;
    let result;
    let queryText = `
      SELECT 
        a.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob,
        p.notes as patient_notes
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
    `;
    const params = [];
    const conditions = [];
    let paramCount = 1;

    if (date) {
      conditions.push(`a.date = $${paramCount}`);
      params.push(date);
      paramCount++;
    }

    if (start_date && end_date) {
      conditions.push(`a.date BETWEEN $${paramCount} AND $${paramCount + 1}`);
      params.push(start_date, end_date);
      paramCount += 2;
    }

    if (patient_id) {
      conditions.push(`a.patient_id = $${paramCount}`);
      params.push(patient_id);
      paramCount++;
    }

    if (status) {
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (service_type) {
      conditions.push(`a.service_type = $${paramCount}`);
      params.push(service_type);
      paramCount++;
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY a.date, a.start_time';

    result = await query(queryText, params);
    
    // Format dates in all appointments to ensure they're strings, not timestamps
    const formattedAppointments = result.rows.map(appointment => {
      if (appointment.date) {
        // Convert date to YYYY-MM-DD format if it's a Date object or timestamp string
        if (appointment.date instanceof Date) {
          const year = appointment.date.getFullYear();
          const month = String(appointment.date.getMonth() + 1).padStart(2, '0');
          const day = String(appointment.date.getDate()).padStart(2, '0');
          appointment.date = `${year}-${month}-${day}`;
        } else if (typeof appointment.date === 'string' && appointment.date.includes('T')) {
          // If it's a timestamp string, extract just the date part
          appointment.date = appointment.date.split('T')[0];
        }
      }
      return appointment;
    });
    
    res.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to fetch appointments: ${error.message}`
        : 'Failed to fetch appointments'
    });
  }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT 
        a.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob,
        p.notes as patient_notes
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Format date to ensure it's returned as a string, not a timestamp
    const appointment = result.rows[0];
    if (appointment.date) {
      if (appointment.date instanceof Date) {
        const year = appointment.date.getFullYear();
        const month = String(appointment.date.getMonth() + 1).padStart(2, '0');
        const day = String(appointment.date.getDate()).padStart(2, '0');
        appointment.date = `${year}-${month}-${day}`;
      } else if (typeof appointment.date === 'string' && appointment.date.includes('T')) {
        appointment.date = appointment.date.split('T')[0];
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to fetch appointment: ${error.message}`
        : 'Failed to fetch appointment'
    });
  }
});

// POST create new appointment
router.post('/', async (req, res) => {
  try {
    const { patient_id, date, start_time, end_time, appointment_type, notes, status, service_type } = req.body;

    // Use authenticated user's role as default if service_type not provided
    const finalServiceType = service_type || req.user?.role || 'doctor';

    // Log received data for debugging
    console.log('Received appointment data:', {
      patient_id,
      date,
      dateType: typeof date,
      start_time,
      end_time,
      appointment_type,
      notes,
      status,
      service_type: service_type || 'not provided',
      finalServiceType,
      userRole: req.user?.role
    });

    // Validation
    if (!patient_id || !date || !start_time || !end_time || !appointment_type) {
      return res.status(400).json({
        error: 'patient_id, date, start_time, end_time, and appointment_type are required'
      });
    }

    // Normalize date to YYYY-MM-DD format if it's a timestamp string
    let normalizedDate = date;
    if (typeof date === 'string' && date.includes('T')) {
      // Extract just the date part from timestamp string
      normalizedDate = date.split('T')[0];
      console.log('Normalized date from timestamp:', { original: date, normalized: normalizedDate });
    } else if (date instanceof Date) {
      // Convert Date object to YYYY-MM-DD string
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      normalizedDate = `${year}-${month}-${day}`;
      console.log('Normalized date from Date object:', { original: date, normalized: normalizedDate });
    }
    
    // Validate date format (should be YYYY-MM-DD)
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(normalizedDate)) {
      return res.status(400).json({
        error: `Invalid date format: "${normalizedDate}". Expected format: YYYY-MM-DD`
      });
    }

    // Validate time format (should be HH:MM:SS or HH:MM)
    const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeFormatRegex.test(start_time)) {
      return res.status(400).json({
        error: `Invalid start_time format: "${start_time}". Expected format: HH:MM:SS or HH:MM`
      });
    }
    if (!timeFormatRegex.test(end_time)) {
      return res.status(400).json({
        error: `Invalid end_time format: "${end_time}". Expected format: HH:MM:SS or HH:MM`
      });
    }

    // Normalize time format to HH:MM:SS if needed
    const normalizeTime = (time) => {
      if (time.length === 5) {
        // HH:MM format, add seconds
        return `${time}:00`;
      }
      return time; // Already HH:MM:SS
    };
    
    const normalizedStartTime = normalizeTime(start_time);
    const normalizedEndTime = normalizeTime(end_time);

    // Check if patient exists
    const patientCheck = await query('SELECT id FROM patients WHERE id = $1', [patient_id]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check for existing appointment with same date and start_time (including cancelled)
    // This handles the unique constraint that might include cancelled appointments
    // Only check for the same service_type
    const existingAppointment = await query(
      `SELECT a.id, a.status, a.patient_id, p.first_name, p.last_name 
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.date = $1 AND a.start_time = $2 AND a.service_type = $3`,
      [normalizedDate, normalizedStartTime, finalServiceType]
    );

    // If there's an existing appointment with the same time slot
    if (existingAppointment.rows.length > 0) {
      const existing = existingAppointment.rows[0];
      console.log('Found existing appointment:', {
        id: existing.id,
        status: existing.status,
        date: normalizedDate,
        start_time: normalizedStartTime,
        patient: `${existing.first_name || ''} ${existing.last_name || ''}`.trim()
      });
      
      if (existing.status === 'cancelled') {
        // Delete the cancelled appointment to free up the slot
        console.log('Deleting cancelled appointment to free up slot:', existing.id);
        await query('DELETE FROM appointments WHERE id = $1', [existing.id]);
      } else {
        // Active appointment exists at the exact same time - this is not allowed
        const patientName = `${existing.first_name || ''} ${existing.last_name || ''}`.trim() || 'Unknown';
        return res.status(409).json({
          error: `This time slot is already booked by ${patientName}. Please choose another time.`
        });
      }
    }
    
    // Check for overlapping appointments (different start_time but overlapping times)
    // Only check overlaps for the same service_type
    const overlapCheck = await query(
      `SELECT a.id, a.start_time, a.end_time, p.first_name, p.last_name 
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       WHERE a.date = $1 
       AND a.status != 'cancelled'
       AND a.service_type = $4
       AND (
         (a.start_time <= $2 AND a.end_time > $2) OR
         (a.start_time < $3 AND a.end_time >= $3) OR
         (a.start_time >= $2 AND a.end_time <= $3)
       )`,
      [normalizedDate, normalizedStartTime, normalizedEndTime, finalServiceType]
    );

    if (overlapCheck.rows.length > 0) {
      const conflicting = overlapCheck.rows[0];
      const patientName = `${conflicting.first_name || ''} ${conflicting.last_name || ''}`.trim() || 'Unknown';
      console.log('Found overlapping appointment:', {
        id: conflicting.id,
        start_time: conflicting.start_time,
        end_time: conflicting.end_time,
        patient: patientName,
        requested: { start: normalizedStartTime, end: normalizedEndTime }
      });
      return res.status(409).json({
        error: `Time slot overlaps with an appointment for ${patientName} (${conflicting.start_time} - ${conflicting.end_time}). Please choose another time.`
      });
    }

    console.log('Inserting appointment with normalized date:', {
      patient_id,
      date: normalizedDate,
      start_time: normalizedStartTime,
      end_time: normalizedEndTime,
      appointment_type
    });

    const result = await query(
      `INSERT INTO appointments (patient_id, date, start_time, end_time, appointment_type, notes, status, service_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        patient_id,
        normalizedDate,
        normalizedStartTime,
        normalizedEndTime,
        appointment_type,
        notes || null,
        status || 'scheduled',
        finalServiceType
      ]
    );

    // Fetch appointment with patient details
    const appointmentWithPatient = await query(
      `SELECT 
        a.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob,
        p.notes as patient_notes
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1`,
      [result.rows[0].id]
    );

    // Format date to ensure it's returned as a string, not a timestamp
    const appointment = appointmentWithPatient.rows[0];
    if (appointment.date) {
      // Convert date to YYYY-MM-DD format if it's a Date object
      if (appointment.date instanceof Date) {
        const year = appointment.date.getFullYear();
        const month = String(appointment.date.getMonth() + 1).padStart(2, '0');
        const day = String(appointment.date.getDate()).padStart(2, '0');
        appointment.date = `${year}-${month}-${day}`;
      } else if (typeof appointment.date === 'string' && appointment.date.includes('T')) {
        // If it's a timestamp string, extract just the date part
        appointment.date = appointment.date.split('T')[0];
      }
    }

    console.log('Returning appointment:', {
      id: appointment.id,
      date: appointment.date,
      start_time: appointment.start_time,
      patient: `${appointment.first_name} ${appointment.last_name}`
    });

    res.status(201).json(appointment);
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error creating appointment:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        error: error.constraint === 'unique_time_slot_per_day_per_service' || error.constraint === 'unique_time_slot_per_day'
          ? 'This time slot is already booked for this service type. Please choose another time.'
          : 'A duplicate entry already exists. Please check your data.'
      });
    }
    
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        error: 'Invalid patient ID. The patient does not exist in the database.'
      });
    }
    
    if (error.code === '23502') {
      // NOT NULL constraint violation
      return res.status(400).json({
        error: `Missing required field: ${error.column || 'unknown field'}`
      });
    }
    
    if (error.code === '22007' || error.code === '22008') {
      // Invalid date/time format
      return res.status(400).json({
        error: 'Invalid date or time format. Please ensure dates are in YYYY-MM-DD format and times are in HH:MM:SS format.'
      });
    }
    
    // Generic error response with more details in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to create appointment: ${error.message}`
      : 'Failed to create appointment';
    
    res.status(500).json({ error: errorMessage });
  }
});

// PUT update appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, date, start_time, end_time, appointment_type, notes, status, service_type } = req.body;

    // Log received data for debugging
    console.log('Received update appointment data:', {
      id,
      patient_id,
      date,
      start_time,
      end_time,
      appointment_type,
      notes,
      status
    });

    // Check if appointment exists
    const appointmentCheck = await query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Normalize time format to HH:MM:SS if needed
    const normalizeTime = (time) => {
      if (!time) return time;
      if (time.length === 5) {
        // HH:MM format, add seconds
        return `${time}:00`;
      }
      return time; // Already HH:MM:SS or null
    };
    
    const normalizedStartTime = start_time ? normalizeTime(start_time) : undefined;
    const normalizedEndTime = end_time ? normalizeTime(end_time) : undefined;

    // If time/date is being changed, check for overlaps (excluding current appointment)
    if (date || normalizedStartTime || normalizedEndTime) {
      const finalDate = date || appointmentCheck.rows[0].date;
      const finalStartTime = normalizedStartTime || appointmentCheck.rows[0].start_time;
      const finalEndTime = normalizedEndTime || appointmentCheck.rows[0].end_time;

      // Get the service_type from new value, existing appointment, or authenticated user's role
      const finalServiceType = service_type || appointmentCheck.rows[0].service_type || req.user?.role || 'doctor';

      const overlapCheck = await query(
        `SELECT id FROM appointments 
         WHERE id != $1
         AND date = $2 
         AND status != 'cancelled'
         AND service_type = $5
         AND (
           (start_time <= $3 AND end_time > $3) OR
           (start_time < $4 AND end_time >= $4) OR
           (start_time >= $3 AND end_time <= $4)
         )`,
        [id, finalDate, finalStartTime, finalEndTime, finalServiceType]
      );

      if (overlapCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Time slot is already booked. Please choose another time.'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (patient_id !== undefined) {
      updates.push(`patient_id = $${paramCount}`);
      params.push(patient_id);
      paramCount++;
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount}`);
      params.push(date);
      paramCount++;
    }
    if (normalizedStartTime !== undefined) {
      updates.push(`start_time = $${paramCount}`);
      params.push(normalizedStartTime);
      paramCount++;
    }
    if (normalizedEndTime !== undefined) {
      updates.push(`end_time = $${paramCount}`);
      params.push(normalizedEndTime);
      paramCount++;
    }
    if (appointment_type !== undefined) {
      updates.push(`appointment_type = $${paramCount}`);
      params.push(appointment_type);
      paramCount++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
      paramCount++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (service_type !== undefined) {
      updates.push(`service_type = $${paramCount}`);
      params.push(service_type);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const result = await query(
      `UPDATE appointments 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    // Fetch appointment with patient details
    const appointmentWithPatient = await query(
      `SELECT 
        a.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob,
        p.notes as patient_notes
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1`,
      [id]
    );

    // Format date to ensure it's returned as a string, not a timestamp
    const appointment = appointmentWithPatient.rows[0];
    if (appointment.date) {
      if (appointment.date instanceof Date) {
        const year = appointment.date.getFullYear();
        const month = String(appointment.date.getMonth() + 1).padStart(2, '0');
        const day = String(appointment.date.getDate()).padStart(2, '0');
        appointment.date = `${year}-${month}-${day}`;
      } else if (typeof appointment.date === 'string' && appointment.date.includes('T')) {
        appointment.date = appointment.date.split('T')[0];
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack
    });
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        error: 'This time slot is already booked. Please choose another time.'
      });
    }
    
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        error: 'Invalid patient ID. The patient does not exist in the database.'
      });
    }
    
    if (error.code === '23502') {
      // NOT NULL constraint violation
      return res.status(400).json({
        error: `Missing required field: ${error.column || 'unknown field'}`
      });
    }
    
    if (error.code === '22007' || error.code === '22008') {
      // Invalid date/time format
      return res.status(400).json({
        error: 'Invalid date or time format. Please ensure dates are in YYYY-MM-DD format and times are in HH:MM:SS format.'
      });
    }
    
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to update appointment: ${error.message}`
        : 'Failed to update appointment'
    });
  }
});

// DELETE appointment (soft delete by setting status to cancelled)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete } = req.query;

    if (hard_delete === 'true') {
      // Hard delete
      const result = await query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json({ message: 'Appointment deleted successfully', appointment: result.rows[0] });
    } else {
      // Soft delete (set status to cancelled)
      const result = await query(
        'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
        ['cancelled', id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json({ message: 'Appointment cancelled successfully', appointment: result.rows[0] });
    }
  } catch (error) {
    console.error('Error deleting appointment:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to delete appointment: ${error.message}`
        : 'Failed to delete appointment'
    });
  }
});

export default router;

