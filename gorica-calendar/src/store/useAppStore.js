import { create } from 'zustand';
import { appointmentsAPI, patientsAPI, authAPI, dataTransformers } from '../services/api';

export const useAppStore = create((set, get) => ({
  // Authentication state
  user: null, // { id, username, role, name }
  isAuthenticated: false,
  authLoading: true, // Track if we're checking authentication on load
  
  // Login function
  login: (role, userData) => {
    set({ 
      user: userData,
      isAuthenticated: true,
      selectedMode: role // Set mode based on role
    });
    // Refetch appointments when logged in
    get().fetchAppointments();
  },
  
  // Logout function
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ 
        user: null,
        isAuthenticated: false,
        selectedMode: 'doctor',
        appointments: [],
        globalSearchQuery: ''
      });
    }
  },
  
  // Verify authentication on app load
  verifyAuth: async () => {
    set({ authLoading: true });
    try {
      const response = await authAPI.verify();
      if (response.user && response.authenticated) {
        set({ 
          user: response.user,
          isAuthenticated: true,
          selectedMode: response.user.role,
          authLoading: false
        });
        // Refetch appointments when authenticated
        get().fetchAppointments();
      } else {
        set({ 
          isAuthenticated: false,
          authLoading: false
        });
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      set({ 
        isAuthenticated: false,
        authLoading: false
      });
    }
  },
  
  // View state
  currentView: 'day', // 'day' | 'week' | 'month'
  currentDate: (() => {
    // Initialize with today at noon local time to avoid timezone issues
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
  })(),
  
  // Shift state
  selectedShift: 'morning', // 'morning' | 'evening'
  shifts: {
    morning: { start: 9, end: 17 },
    evening: { start: 14, end: 21 },
  },
  
  // Service mode state (derived from user role)
  selectedMode: 'doctor', // 'doctor' | 'esthetician'
  setSelectedMode: (mode) => {
    set({ selectedMode: mode });
    // Refetch appointments when mode changes
    get().fetchAppointments();
  },
  
  // Appointments
  appointments: [],
  loading: false,
  error: null,
  
  // Global search query
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  
  // Get filtered appointments based on global search
  getFilteredAppointments: () => {
    const { appointments, globalSearchQuery } = get();
    if (!globalSearchQuery || globalSearchQuery.trim() === '') {
      return appointments;
    }
    return appointments.filter((apt) =>
      apt.patientName.toLowerCase().includes(globalSearchQuery.toLowerCase().trim())
    );
  },
  
  // Patients cache
  patients: [],
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setSelectedShift: (shift) => set({ selectedShift: shift }),
  
  // Fetch appointments from backend
  fetchAppointments: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      // Filter out cancelled appointments by default unless status filter is explicitly set
      const fetchFilters = { ...filters };
      if (!fetchFilters.status) {
        // Don't fetch cancelled appointments by default
        // We'll filter them out after fetching
      }
      // Add service_type filter based on user role (selectedMode)
      const { selectedMode } = get();
      if (selectedMode) {
        fetchFilters.service_type = selectedMode;
      }
      const data = await appointmentsAPI.getAll(fetchFilters);
      
      // Filter out cancelled appointments and transform
      const transformedAppointments = data
        .filter(apt => apt.status !== 'cancelled')
        .map(dataTransformers.appointmentToFrontend);
      
      set({ 
        appointments: transformedAppointments, 
        loading: false 
      });
      return transformedAppointments;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Search for patient by name
  searchPatient: async (name) => {
    try {
      const patients = await patientsAPI.getAll(name);
      return patients;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  },
  
  // Create or find patient
  createOrFindPatient: async (fullName, phone = null) => {
    try {
      // Validate name before processing
      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        throw new Error('Patient name is required');
      }
      
      // First, try to find existing patient
      const existingPatients = await patientsAPI.getAll(fullName);
      if (existingPatients.length > 0) {
        // Try to find exact match
        const exactMatch = existingPatients.find(p => 
          `${p.first_name} ${p.last_name}`.toLowerCase() === fullName.toLowerCase()
        );
        if (exactMatch) {
          return exactMatch;
        }
        // Return first match if no exact match
        return existingPatients[0];
      }
      
      // If not found, create new patient
      let first_name, last_name;
      try {
        const parsed = dataTransformers.parsePatientName(fullName);
        first_name = parsed.first_name;
        last_name = parsed.last_name;
      } catch (parseError) {
        console.error('Error parsing patient name:', parseError);
        throw new Error(parseError.message || 'Invalid patient name format');
      }
      
      // Ensure both first_name and last_name are provided
      if (!first_name || !last_name) {
        throw new Error('Both first name and last name are required');
      }
      
      const newPatient = await patientsAPI.create({
        first_name,
        last_name,
        phone: phone || null,
      });
      return newPatient;
    } catch (error) {
      console.error('Error creating/finding patient:', error);
      throw error;
    }
  },
  
  // Add appointment (syncs with backend)
  addAppointment: async (appointment) => {
    set({ loading: true, error: null });
    try {
      // Create or find patient
      const patient = await get().createOrFindPatient(
        appointment.patientName,
        appointment.phone
      );
      
      // Transform appointment to backend format
      const { selectedMode } = get();
      const backendAppointment = dataTransformers.appointmentToBackend(
        appointment,
        patient.id,
        selectedMode
      );
      
      // Create appointment in backend
      const createdAppointment = await appointmentsAPI.create(backendAppointment);
      
      // Transform back to frontend format
      const frontendAppointment = dataTransformers.appointmentToFrontend(createdAppointment);
      
      // Refresh appointments from backend to ensure we have the latest data
      await get().fetchAppointments();
      
      return frontendAppointment;
    } catch (error) {
      console.error('Error adding appointment:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Update appointment (syncs with backend)
  updateAppointment: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const appointment = get().appointments.find(apt => apt.id === id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Merge updates with existing appointment
      const updatedAppointment = { ...appointment, ...updates };
      
      // If patient name changed, create or find new patient
      let patientId = updatedAppointment.patientId;
      if (updates.patientName && updates.patientName !== appointment.patientName) {
        const patient = await get().createOrFindPatient(
          updates.patientName,
          updates.phone
        );
        patientId = patient.id;
      }
      
      // Transform to backend format
      const { selectedMode } = get();
      const backendAppointment = dataTransformers.appointmentToBackend(
        updatedAppointment,
        patientId,
        selectedMode
      );
      
      // Update in backend
      const result = await appointmentsAPI.update(id, backendAppointment);
      
      // Transform back to frontend format
      const frontendAppointment = dataTransformers.appointmentToFrontend(result);
      
      // Refresh appointments from backend to ensure we have the latest data
      await get().fetchAppointments();
      
      return frontendAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Delete appointment (syncs with backend)
  deleteAppointment: async (id) => {
    set({ loading: true, error: null });
    try {
      // Use hard delete to actually remove from database
      await appointmentsAPI.delete(id, true); // Hard delete (permanent removal)
      
      // Update local state - remove from list
      set((state) => ({
        appointments: state.appointments.filter((apt) => apt.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  goToToday: () => {
    // Create today's date at noon local time to avoid timezone issues
    const today = new Date();
    const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
    set({ currentDate: todayAtNoon });
  },
}));

