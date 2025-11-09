import { formatDate } from '../utils/timeSlots';

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Token management
let authToken = null;

export const tokenManager = {
  setToken: (token) => {
    authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },
  getToken: () => {
    if (!authToken) {
      authToken = localStorage.getItem('authToken');
    }
    return authToken;
  },
  clearToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
  },
};

// Helper function to get headers with authentication
function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      tokenManager.clearToken();
      // Redirect to login will be handled by the component
      throw new Error('Authentication required. Please login again.');
    }
    
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Auth API
export const authAPI = {
  // Login
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      credentials: 'include', // Include cookies
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      tokenManager.setToken(data.token);
    }
    return data;
  },

  // Register (optional, for admin use)
  register: async (username, password, name, role = 'doctor') => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      credentials: 'include',
      body: JSON.stringify({ username, password, name, role }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      tokenManager.setToken(data.token);
    }
    return data;
  },

  // Logout
  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearToken();
    }
  },

  // Verify token and get current user
  verify: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get current user info
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Patients API
export const patientsAPI = {
  // Get all patients with optional search
  getAll: async (search = '') => {
    const url = search 
      ? `${API_BASE_URL}/patients?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/patients`;
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get single patient by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Create new patient
  create: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  // Update patient
  update: async (id, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  // Delete patient
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Appointments API
export const appointmentsAPI = {
  // Get all appointments with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.service_type) params.append('service_type', filters.service_type);

    const url = `${API_BASE_URL}/appointments${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get single appointment by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Create new appointment
  create: async (appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  // Update appointment
  update: async (id, appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  // Delete/cancel appointment
  delete: async (id, hardDelete = false) => {
    const url = `${API_BASE_URL}/appointments/${id}${hardDelete ? '?hard_delete=true' : ''}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Reports API
export const reportsAPI = {
  // Get all reports with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.appointment_id) params.append('appointment_id', filters.appointment_id);
    if (filters.patient_id) {
      // Ensure patient_id is converted to string for URLSearchParams
      params.append('patient_id', String(filters.patient_id));
    }
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const url = `${API_BASE_URL}/reports${params.toString() ? '?' + params.toString() : ''}`;
    console.log('Fetching reports from:', url);
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
    });
    const data = await handleResponse(response);
    console.log('Reports API response:', data);
    return data;
  },

  // Get report by appointment ID
  getByAppointmentId: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/reports/appointment/${appointmentId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get report by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Create new report
  create: async (reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  // Update report
  update: async (id, reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  // Update or create report by appointment ID
  upsertByAppointmentId: async (appointmentId, reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports/appointment/${appointmentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  // Delete report
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// Helper functions to transform data between frontend and backend formats
export const dataTransformers = {
  // Transform backend appointment to frontend format
  appointmentToFrontend: (backendAppointment) => {
    // Combine date and start_time to create a Date object
    const dateStr = backendAppointment.date;
    const timeStr = backendAppointment.start_time;
    
    // Validate that we have both date and time
    if (!dateStr || !timeStr) {
      console.warn('Invalid appointment data: missing date or time', backendAppointment);
      // Create a fallback date (today at 9:00 AM) if data is invalid
      const fallbackDate = new Date();
      fallbackDate.setHours(9, 0, 0, 0);
      return {
        id: backendAppointment.id.toString(),
        patientName: `${backendAppointment.first_name || ''} ${backendAppointment.last_name || ''}`.trim(),
        patientId: backendAppointment.patient_id,
        firstName: backendAppointment.first_name || '',
        lastName: backendAppointment.last_name || '',
        phone: backendAppointment.phone || '',
        dob: backendAppointment.dob || null,
        patientNotes: backendAppointment.patient_notes || '',
        appointmentType: backendAppointment.appointment_type || '',
        notes: backendAppointment.notes || '',
        time: fallbackDate,
        status: backendAppointment.status || 'scheduled',
      };
    }
    
    // Try to create a proper Date object
    // Handle time formats: "HH:mm:ss", "HH:mm", or already combined with date
    let normalizedTimeStr = timeStr;
    
    // If time already includes 'T', it's already a full datetime string
    if (timeStr.includes('T')) {
      normalizedTimeStr = timeStr;
    } else {
      // Normalize time format to HH:mm:ss
      // Handle "HH:mm" (5 chars) or "HH:mm:ss" (8 chars)
      if (timeStr.length === 5) {
        // Format: "09:00" -> "09:00:00"
        normalizedTimeStr = `${timeStr}:00`;
      } else if (timeStr.length === 8) {
        // Format: "09:00:00" -> use as-is
        normalizedTimeStr = timeStr;
      } else {
        // Try to parse as-is
        normalizedTimeStr = timeStr;
      }
    }
    
    // Parse date and time components manually to avoid timezone issues
    // Always use local time components
    let time;
    try {
      const timeParts = normalizedTimeStr.split(':');
      const dateParts = dateStr.split('-');
      
      if (timeParts.length >= 2 && dateParts.length === 3) {
        // Create date using local time components to avoid timezone shifts
        time = new Date(
          parseInt(dateParts[0], 10), // year
          parseInt(dateParts[1], 10) - 1, // month (0-indexed)
          parseInt(dateParts[2], 10), // day
          parseInt(timeParts[0], 10), // hours
          parseInt(timeParts[1], 10), // minutes
          timeParts[2] ? parseInt(timeParts[2], 10) : 0 // seconds
        );
      } else {
        // Fallback to string parsing if manual parsing fails
        const dateTimeStr = `${dateStr}T${normalizedTimeStr}`;
        time = new Date(dateTimeStr);
      }
    } catch (parseError) {
      console.warn('Failed to parse date manually, trying string parse:', parseError);
      // Fallback to string parsing
      const dateTimeStr = `${dateStr}T${normalizedTimeStr}`;
      time = new Date(dateTimeStr);
    }
    
    // Validate the created date
    if (isNaN(time.getTime())) {
      console.warn('Invalid date created from:', dateStr, timeStr);
      console.warn('Using fallback date for appointment:', backendAppointment.id);
      const fallbackDate = new Date();
      fallbackDate.setHours(9, 0, 0, 0);
      return {
        id: backendAppointment.id.toString(),
        patientName: `${backendAppointment.first_name || ''} ${backendAppointment.last_name || ''}`.trim(),
        patientId: backendAppointment.patient_id,
        firstName: backendAppointment.first_name || '',
        lastName: backendAppointment.last_name || '',
        phone: backendAppointment.phone || '',
        dob: backendAppointment.dob || null,
        patientNotes: backendAppointment.patient_notes || '',
        appointmentType: backendAppointment.appointment_type || '',
        notes: backendAppointment.notes || '',
        time: fallbackDate,
        status: backendAppointment.status || 'scheduled',
      };
    }

    return {
      id: backendAppointment.id.toString(),
      patientName: `${backendAppointment.first_name || ''} ${backendAppointment.last_name || ''}`.trim(),
      patientId: backendAppointment.patient_id,
      firstName: backendAppointment.first_name || '',
      lastName: backendAppointment.last_name || '',
      phone: backendAppointment.phone || '',
      dob: backendAppointment.dob || null,
      patientNotes: backendAppointment.patient_notes || '',
      appointmentType: backendAppointment.appointment_type || '',
      notes: backendAppointment.notes || '',
      time: time,
      status: backendAppointment.status || 'scheduled',
    };
  },

  // Transform frontend appointment to backend format
  appointmentToBackend: (frontendAppointment, patientId, serviceType = 'doctor') => {
    // Ensure we're working with a proper Date object
    const date = new Date(frontendAppointment.time);
    
    // Use formatDate to get the date string in local time, then parse it
    // This ensures we get the correct date regardless of timezone
    const dateStr = formatDate(date); // Returns "YYYY-MM-DD" format
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Verify the date components match what we expect
    // This is a safety check to ensure no timezone shift occurred
    const verifyDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid midnight edge cases
    const verifyDateStr = formatDate(verifyDate);
    
    if (dateStr !== verifyDateStr) {
      console.error('⚠️ DATE MISMATCH in appointmentToBackend!', {
        expected: dateStr,
        actual: verifyDateStr,
        original: frontendAppointment.time,
        parsed: { year, month, day }
      });
    }
    
    // Extract time components using local time methods
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Calculate end time (15 minutes after start) using local time
    const endMinutes = minutes + 15;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalEndMinutes = endMinutes % 60;
    
    const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(finalEndMinutes).padStart(2, '0')}:00`;

    const finalDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Log for debugging
    console.log('Transforming appointment to backend:', {
      original: frontendAppointment.time,
      originalISO: date.toISOString(),
      dateStr,
      parsed: { year, month, day },
      hours,
      minutes,
      finalDate,
      start_time: startTime,
      end_time: endTime,
      dateMatch: dateStr === verifyDateStr
    });

    return {
      patient_id: patientId,
      date: finalDate,
      start_time: startTime,
      end_time: endTime,
      appointment_type: frontendAppointment.appointmentType,
      notes: frontendAppointment.notes || null,
      status: frontendAppointment.status || 'scheduled',
      service_type: serviceType,
    };
  },

  // Parse patient name into first and last name
  parsePatientName: (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
      throw new Error('Patient name is required');
    }
    
    const trimmed = fullName.trim();
    if (!trimmed) {
      throw new Error('Patient name cannot be empty');
    }
    
    const parts = trimmed.split(/\s+/).filter(part => part.length > 0);
    
    if (parts.length === 0) {
      throw new Error('Patient name is required');
    }
    
    // If only one part, use it as first name and set last name to a default
    // Some backends require both fields, so we'll use the first name as last name too
    if (parts.length === 1) {
      return {
        first_name: parts[0],
        last_name: parts[0], // Use first name as last name if only one name provided
      };
    }
    
    // Multiple parts: first is first_name, rest is last_name
    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
    };
  },
};

