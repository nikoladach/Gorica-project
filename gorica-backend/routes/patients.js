import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

// GET all patients with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let result;

    if (search) {
      // Search by first name, last name, or phone
      const searchTerm = `%${search}%`;
      result = await query(
        `SELECT * FROM patients 
         WHERE first_name ILIKE $1 
         OR last_name ILIKE $1 
         OR phone ILIKE $1 
         ORDER BY last_name, first_name`,
        [searchTerm]
      );
    } else {
      result = await query(
        'SELECT * FROM patients ORDER BY last_name, first_name'
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to fetch patients: ${error.message}`
        : 'Failed to fetch patients'
    });
  }
});

// GET single patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to fetch patient: ${error.message}`
        : 'Failed to fetch patient'
    });
  }
});

// POST create new patient
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, phone, dob, notes } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await query(
      `INSERT INTO patients (first_name, last_name, phone, dob, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [first_name, last_name, phone || null, dob || null, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating patient:', {
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
        error: 'A patient with this information already exists.'
      });
    }
    
    if (error.code === '23502') {
      // NOT NULL constraint violation
      return res.status(400).json({
        error: `Missing required field: ${error.column || 'unknown field'}`
      });
    }
    
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to create patient: ${error.message}`
        : 'Failed to create patient'
    });
  }
});

// PUT update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, dob, notes } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    const result = await query(
      `UPDATE patients 
       SET first_name = $1, last_name = $2, phone = $3, dob = $4, notes = $5
       WHERE id = $6
       RETURNING *`,
      [first_name, last_name, phone || null, dob || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient:', {
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
        error: 'A patient with this information already exists.'
      });
    }
    
    if (error.code === '23502') {
      // NOT NULL constraint violation
      return res.status(400).json({
        error: `Missing required field: ${error.column || 'unknown field'}`
      });
    }
    
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to update patient: ${error.message}`
        : 'Failed to update patient'
    });
  }
});

// DELETE patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient has appointments
    const appointmentsCheck = await query(
      'SELECT COUNT(*) FROM appointments WHERE patient_id = $1',
      [id]
    );

    if (parseInt(appointmentsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete patient with existing appointments. Cancel appointments first.'
      });
    }

    const result = await query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully', patient: result.rows[0] });
  } catch (error) {
    console.error('Error deleting patient:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack
    });
    
    // Handle foreign key constraint violation (if CASCADE doesn't work)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Cannot delete patient with existing appointments. Cancel appointments first.'
      });
    }
    
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' 
        ? `Failed to delete patient: ${error.message}`
        : 'Failed to delete patient'
    });
  }
});

export default router;

