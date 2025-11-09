// Appointment types configuration based on service type
import { getTranslation } from '../i18n/translations';

export const appointmentTypes = {
  doctor: [
    { value: 'consultation', labelKey: 'appointmentTypes.consultation' },
    { value: 'follow-up', labelKey: 'appointmentTypes.follow-up' },
    { value: 'checkup', labelKey: 'appointmentTypes.checkup' },
    { value: 'procedure', labelKey: 'appointmentTypes.procedure' },
    { value: 'emergency', labelKey: 'appointmentTypes.emergency' },
  ],
  esthetician: [
    { value: 'facial', labelKey: 'appointmentTypes.facial' },
    { value: 'laser', labelKey: 'appointmentTypes.laser' },
    { value: 'wax', labelKey: 'appointmentTypes.wax' },
  ],
};

// Get appointment types for a specific service type
export const getAppointmentTypes = (serviceType, language = 'mk') => {
  const types = appointmentTypes[serviceType] || appointmentTypes.doctor;
  return types.map(type => ({
    ...type,
    label: getTranslation(type.labelKey, language),
  }));
};

// Get all appointment type values for a specific service type
export const getAppointmentTypeValues = (serviceType) => {
  const types = appointmentTypes[serviceType] || appointmentTypes.doctor;
  return types.map(type => type.value);
};

// Get appointment type label by value and service type
export const getAppointmentTypeLabel = (value, serviceType, language = 'mk') => {
  const types = appointmentTypes[serviceType] || appointmentTypes.doctor;
  const type = types.find(t => t.value === value);
  if (type) {
    return getTranslation(type.labelKey, language);
  }
  // Fallback: try to get translation directly
  return getTranslation(`appointmentTypes.${value}`, language) || value;
};

