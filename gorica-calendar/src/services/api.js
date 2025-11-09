import { formatDate } from '../utils/timeSlots';

// ✅ Always use your deployed backend by default
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'https://gorica-backend.onrender.com/api';

// --- Token management ---
let authToken = null;

export const tokenManager = {
  setToken: (token) => {
    authToken = token;
    if (token) localStorage.setItem('authToken', token);
    else localStorage.removeItem('authToken');
  },
  getToken: () => {
    if (!authToken) authToken = localStorage.getItem('authToken');
    return authToken;
  },
  clearToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
  },
};

// --- Helper: headers ---
function getHeaders(includeAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = tokenManager.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Helper: handle all API responses ---
async function handleResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      tokenManager.clearToken();
      throw new Error('Authentication required. Please login again.');
    }
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ========================= AUTH API =========================
export const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    if (data.token) tokenManager.setToken(data.token);
    return data;
  },

  register: async (username, password, name, role = 'doctor') => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      credentials: 'include',
      body: JSON.stringify({ username, password, name, role }),
    });
    const data = await handleResponse(response);
    if (data.token) tokenManager.setToken(data.token);
    return data;
  },

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

  verify: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// ========================= PATIENTS API =========================
export const patientsAPI = {
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

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  update: async (id, patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// ========================= APPOINTMENTS API =========================
export const appointmentsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const url = `${API_BASE_URL}/appointments${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

  update: async (id, appointmentData) => {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(appointmentData),
    });
    return handleResponse(response);
  },

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

// ========================= REPORTS API =========================
export const reportsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    const url = `${API_BASE_URL}/reports${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  getByAppointmentId: async (appointmentId) => {
    const response = await fetch(`${API_BASE_URL}/reports/appointment/${appointmentId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  create: async (reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  update: async (id, reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  upsertByAppointmentId: async (appointmentId, reportData) => {
    const response = await fetch(`${API_BASE_URL}/reports/appointment/${appointmentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(reportData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },
};

// ========================= DATA TRANSFORMERS =========================
export const dataTransformers = {
  appointmentToFrontend: (backendAppointment) => {
    const dateStr = backendAppointment.date;
    const timeStr = backendAppointment.start_time;
    if (!dateStr || !timeStr) {
      const fallbackDate = new Date();
      fallbackDate.setHours(9, 0, 0, 0);
      return {
        id: backendAppointment.id.toString(),
        patientName: `${backendAppointment.first_name || ''} ${backendAppointment.last_name || ''}`.trim(),
        patientId: backendAppointment.patient_id,
        time: fallbackDate,
        status: backendAppointment.status || 'scheduled',
      };
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return {
      id: backendAppointment.id.toString(),
      patientName: `${backendAppointment.first_name || ''} ${backendAppointment.last_name || ''}`.trim(),
      patientId: backendAppointment.patient_id,
      firstName: backendAppointment.first_name || '',
      lastName: backendAppointment.last_name || '',
      phone: backendAppointment.phone || '',
      dob: backendAppointment.dob || null,
      notes: backendAppointment.notes || '',
      time: date,
      status: backendAppointment.status || 'scheduled',
    };
  },

  appointmentToBackend: (frontendAppointment, patientId, serviceType = 'doctor') => {
    const date = new Date(frontendAppointment.time);
    const dateStr = formatDate(date);
    const [year, month, day] = dateStr.split('-').map(Number);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const endMinutes = minutes + 15;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalEndMinutes = endMinutes % 60;
    const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(finalEndMinutes).padStart(2, '0')}:00`;

    return {
      patient_id: patientId,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      start_time: startTime,
      end_time: endTime,
      appointment_type: frontendAppointment.appointmentType,
      notes: frontendAppointment.notes || null,
      status: frontendAppointment.status || 'scheduled',
      service_type: serviceType,
    };
  },

  parsePatientName: (fullName) => {
    if (!fullName || typeof fullName !== 'string') throw new Error('Patient name is required');
    const parts = fullName.trim().split(/\s+/);
    return parts.length === 1
      ? { first_name: parts[0], last_name: parts[0] }
      : { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  },
};
