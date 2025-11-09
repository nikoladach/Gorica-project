import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

// GET all reports with optional filters
router.get('/', async (req, res) => {
  try {
    const { appointment_id, patient_id, start_date, end_date } = req.query;
    let queryText = `
      SELECT 
        r.*,
        a.date as appointment_date,
        a.start_time as appointment_time,
        a.appointment_type,
        a.status as appointment_status,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob
      FROM physician_reports r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
    `;
    const params = [];
    const conditions = [];
    let paramCount = 1;

    if (appointment_id) {
      conditions.push(`r.appointment_id = $${paramCount}`);
      params.push(appointment_id);
      paramCount++;
    }

    if (patient_id) {
      conditions.push(`a.patient_id = $${paramCount}`);
      params.push(patient_id);
      paramCount++;
    }

    if (start_date && end_date) {
      conditions.push(`a.date BETWEEN $${paramCount} AND $${paramCount + 1}`);
      params.push(start_date, end_date);
      paramCount += 2;
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY r.created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET report by appointment ID
router.get('/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const result = await query(
      `SELECT 
        r.*,
        a.date as appointment_date,
        a.start_time as appointment_time,
        a.appointment_type,
        a.status as appointment_status,
        a.notes as appointment_notes,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob,
        p.notes as patient_notes
      FROM physician_reports r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      WHERE r.appointment_id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// GET report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
        r.*,
        a.date as appointment_date,
        a.start_time as appointment_time,
        a.appointment_type,
        a.status as appointment_status,
        a.notes as appointment_notes,
        p.first_name,
        p.last_name,
        p.phone,
        p.dob,
        p.notes as patient_notes
      FROM physician_reports r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST create new report
router.post('/', async (req, res) => {
  try {
    const {
      appointment_id,
      patient_name,
      date_of_birth,
      reason_for_visit,
      chief_complaint,
      history_of_present_illness,
      physical_examination,
      diagnosis,
      treatment_plan,
      medications_prescribed,
      follow_up_instructions,
      additional_notes
    } = req.body;

    // Validation
    if (!appointment_id || !patient_name) {
      return res.status(400).json({
        error: 'appointment_id and patient_name are required'
      });
    }

    // Check if appointment exists
    const appointmentCheck = await query(
      'SELECT id, patient_id FROM appointments WHERE id = $1',
      [appointment_id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if report already exists for this appointment
    const existingReport = await query(
      'SELECT id FROM physician_reports WHERE appointment_id = $1',
      [appointment_id]
    );

    if (existingReport.rows.length > 0) {
      return res.status(409).json({
        error: 'Report already exists for this appointment. Use PUT to update.'
      });
    }

    // Create report
    const result = await query(
      `INSERT INTO physician_reports (
        appointment_id,
        patient_name,
        date_of_birth,
        reason_for_visit,
        chief_complaint,
        history_of_present_illness,
        physical_examination,
        diagnosis,
        treatment_plan,
        medications_prescribed,
        follow_up_instructions,
        additional_notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        appointment_id,
        patient_name,
        date_of_birth || null,
        reason_for_visit || null,
        chief_complaint || null,
        history_of_present_illness || null,
        physical_examination || null,
        diagnosis || null,
        treatment_plan || null,
        medications_prescribed || null,
        follow_up_instructions || null,
        additional_notes || null,
        req.user?.id || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Report already exists for this appointment'
      });
    }
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// PUT update report
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patient_name,
      date_of_birth,
      reason_for_visit,
      chief_complaint,
      history_of_present_illness,
      physical_examination,
      diagnosis,
      treatment_plan,
      medications_prescribed,
      follow_up_instructions,
      additional_notes
    } = req.body;

    // Check if report exists
    const reportCheck = await query(
      'SELECT id FROM physician_reports WHERE id = $1',
      [id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update report
    const result = await query(
      `UPDATE physician_reports SET
        patient_name = COALESCE($1, patient_name),
        date_of_birth = $2,
        reason_for_visit = $3,
        chief_complaint = $4,
        history_of_present_illness = $5,
        physical_examination = $6,
        diagnosis = $7,
        treatment_plan = $8,
        medications_prescribed = $9,
        follow_up_instructions = $10,
        additional_notes = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        patient_name || null,
        date_of_birth || null,
        reason_for_visit || null,
        chief_complaint || null,
        history_of_present_illness || null,
        physical_examination || null,
        diagnosis || null,
        treatment_plan || null,
        medications_prescribed || null,
        follow_up_instructions || null,
        additional_notes || null,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// PUT update or create report by appointment ID
router.put('/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      patient_name,
      date_of_birth,
      reason_for_visit,
      chief_complaint,
      history_of_present_illness,
      physical_examination,
      diagnosis,
      treatment_plan,
      medications_prescribed,
      follow_up_instructions,
      additional_notes
    } = req.body;

    // Check if appointment exists
    const appointmentCheck = await query(
      'SELECT id, patient_id FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if report exists
    const existingReport = await query(
      'SELECT id FROM physician_reports WHERE appointment_id = $1',
      [appointmentId]
    );

    let result;
    if (existingReport.rows.length > 0) {
      // Update existing report
      result = await query(
        `UPDATE physician_reports SET
          patient_name = COALESCE($1, patient_name),
          date_of_birth = $2,
          reason_for_visit = $3,
          chief_complaint = $4,
          history_of_present_illness = $5,
          physical_examination = $6,
          diagnosis = $7,
          treatment_plan = $8,
          medications_prescribed = $9,
          follow_up_instructions = $10,
          additional_notes = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE appointment_id = $12
        RETURNING *`,
        [
          patient_name || null,
          date_of_birth || null,
          reason_for_visit || null,
          chief_complaint || null,
          history_of_present_illness || null,
          physical_examination || null,
          diagnosis || null,
          treatment_plan || null,
          medications_prescribed || null,
          follow_up_instructions || null,
          additional_notes || null,
          appointmentId
        ]
      );
    } else {
      // Create new report
      result = await query(
        `INSERT INTO physician_reports (
          appointment_id,
          patient_name,
          date_of_birth,
          reason_for_visit,
          chief_complaint,
          history_of_present_illness,
          physical_examination,
          diagnosis,
          treatment_plan,
          medications_prescribed,
          follow_up_instructions,
          additional_notes,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          appointmentId,
          patient_name || null,
          date_of_birth || null,
          reason_for_visit || null,
          chief_complaint || null,
          history_of_present_illness || null,
          physical_examination || null,
          diagnosis || null,
          treatment_plan || null,
          medications_prescribed || null,
          follow_up_instructions || null,
          additional_notes || null,
          req.user?.id || null
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error upserting report:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// DELETE report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM physician_reports WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;

