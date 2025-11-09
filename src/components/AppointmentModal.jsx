import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatTime, formatDateDisplay } from '../utils/timeSlots';
import { getAppointmentTypes } from '../utils/appointmentTypes';
import { useTranslation } from '../i18n/translations';
import PhysicianReport from './PhysicianReport';

export default function AppointmentModal({ isOpen, onClose, selectedSlot, appointment = null }) {
  const { addAppointment, updateAppointment, deleteAppointment, loading, selectedMode, user } = useAppStore();
  const { t } = useTranslation();
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // Get appointment types based on service type
  const availableAppointmentTypes = getAppointmentTypes(selectedMode || 'doctor');

  useEffect(() => {
    if (appointment) {
      setPatientName(appointment.patientName || '');
      setPatientPhone(appointment.phone || '');
      setAppointmentType(appointment.appointmentType || '');
      setNotes(appointment.notes || '');
    } else {
      setPatientName('');
      setPatientPhone('');
      setAppointmentType('');
      setNotes('');
    }
    setError('');
  }, [appointment, isOpen]);

  if (!isOpen || !selectedSlot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    const trimmedName = patientName.trim();
    if (!trimmedName) {
      setError(t('appointments.patientNameRequired'));
      return;
    }
    
    if (!appointmentType) {
      setError(t('appointments.typeRequired'));
      return;
    }
    
    try {
      if (appointment) {
        await updateAppointment(appointment.id, {
          patientName: trimmedName,
          phone: patientPhone.trim() || null,
          appointmentType,
          notes: notes.trim() || '',
          time: selectedSlot,
        });
      } else {
        await addAppointment({
          patientName: trimmedName,
          phone: patientPhone.trim() || null,
          appointmentType,
          notes: notes.trim() || '',
          time: selectedSlot,
          status: 'scheduled',
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || t('appointments.failedToSave'));
      console.error('Error saving appointment:', err);
    }
  };

  const handleDelete = async () => {
    if (appointment && window.confirm(t('appointments.cancelConfirm'))) {
      try {
        await deleteAppointment(appointment.id);
        onClose();
      } catch (err) {
        setError(err.message || t('appointments.failedToCancel'));
        console.error('Error deleting appointment:', err);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {appointment ? t('appointments.editAppointment') : t('appointments.newAppointment')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none p-1"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          <p><strong>{t('appointments.date')}:</strong> {formatDateDisplay(selectedSlot, t)}</p>
          <p><strong>{t('appointments.time')}:</strong> {formatTime(selectedSlot)}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointments.patientName')} *
            </label>
            <input
              type="text"
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={t('appointments.patientName')}
            />
          </div>

          <div>
            <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointments.patientPhone')}
            </label>
            <input
              type="tel"
              id="patientPhone"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={t('appointments.patientPhone')}
            />
          </div>

          <div>
            <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointments.appointmentType')} *
            </label>
            <select
              id="appointmentType"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{t('appointments.selectType')}</option>
              {availableAppointmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('appointments.notes')}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={t('appointments.notesPlaceholder')}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? t('common.loading') : appointment ? t('common.update') : t('common.create')} {t('appointments.title')}
            </button>
            <div className="flex gap-2">
              {appointment && user?.role === 'doctor' && (
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  disabled={loading}
                  className="btn-secondary bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 py-2"
                  title={t('reports.openReport')}
                >
                  📋 <span className="hidden sm:inline">{t('reports.openReport')}</span>
                </button>
              )}
              {appointment && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="btn-secondary bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 py-2"
                >
                  {t('appointments.cancelAppointment')}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-3 py-2"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Physician Report Modal */}
      {appointment && (
        <PhysicianReport
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          appointment={appointment}
        />
      )}
    </div>
  );
}

