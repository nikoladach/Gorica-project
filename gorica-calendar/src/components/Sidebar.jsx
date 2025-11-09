import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatDate, formatTime } from '../utils/timeSlots';
import { format } from 'date-fns';
import { getAppointmentTypeValues, getAppointmentTypeLabel } from '../utils/appointmentTypes';
import { useTranslation } from '../i18n/translations';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { appointments, currentDate, selectedMode } = useAppStore();
  const { t } = useTranslation();
  
  // If props are not provided, use internal state (for backward compatibility)
  const [internalIsOpen, setInternalIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return false;
  });
  
  // Use props if provided, otherwise use internal state
  const sidebarIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setSidebarIsOpen = setIsOpen || setInternalIsOpen;
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = formatDate(apt.time);
    const currentDateStr = formatDate(currentDate);
    return aptDate && currentDateStr && aptDate === currentDateStr;
  });

  // Filter by appointment type
  const typeFilteredAppointments = filterType === 'all' 
    ? todayAppointments 
    : todayAppointments.filter((apt) => apt.appointmentType === filterType);

  // Filter by patient name search
  const filteredAppointments = searchQuery.trim() === ''
    ? typeFilteredAppointments
    : typeFilteredAppointments.filter((apt) => 
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );

  // Get appointment types based on service type, with 'all' option
  const appointmentTypeValues = getAppointmentTypeValues(selectedMode || 'doctor');
  const appointmentTypes = ['all', ...appointmentTypeValues];

  // Update sidebar state when window is resized (only if using internal state)
  useEffect(() => {
    if (setIsOpen) return; // Don't handle resize if controlled by parent
    
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setInternalIsOpen(true); // Open on desktop
      } else {
        setInternalIsOpen(false); // Closed on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 right-0 z-40
          w-full sm:w-80 bg-white shadow-lg border-l border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarIsOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          pt-4 md:pt-4
        `}
      >
        <div className="p-3 sm:p-4 h-full overflow-y-auto">
          <div className="mb-3 sm:mb-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  {formatDate(currentDate) === formatDate(new Date()) 
                    ? t('calendar.todaySchedule')
                    : `${t('calendar.scheduleFor')} ${format(currentDate, 'd MMM yyyy')}`
                  }
                </h2>
                <span className={`px-2 py-1 rounded text-xs font-medium self-start ${
                  selectedMode === 'doctor'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-pink-100 text-pink-800'
                }`}>
                  {selectedMode === 'doctor' ? t('auth.doctor') : t('auth.esthetician')}
                </span>
              </div>
              {/* Close button - visible on mobile when sidebar is open */}
              <button
                onClick={() => setSidebarIsOpen(false)}
                className="md:hidden flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={t('common.close')}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {selectedMode === 'doctor' 
                ? t('calendar.showingDoctorOnly')
                : t('calendar.showingEstheticianOnly')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sidebar.searchPatient')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('sidebar.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sidebar.filterByType')}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' 
                    ? t('sidebar.allTypes')
                    : getAppointmentTypeLabel(type, selectedMode || 'doctor')}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="mb-4 p-3 bg-primary-light rounded-lg">
            <p className="text-sm text-gray-600">{t('appointments.totalAppointments')}</p>
            <p className="text-2xl font-bold text-primary">{todayAppointments.length}</p>
          </div>

          {/* Appointments List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {t('appointments.appointments')} ({filteredAppointments.length})
            </h3>
            {filteredAppointments.length === 0 ? (
              <p className="text-sm text-gray-500">{t('appointments.noAppointments')}</p>
            ) : (
              filteredAppointments
                .sort((a, b) => {
                  const dateA = a.time instanceof Date ? a.time : new Date(a.time);
                  const dateB = b.time instanceof Date ? b.time : new Date(b.time);
                  return dateA - dateB;
                })
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-gray-800">{apt.patientName}</p>
                      <span className="text-xs text-gray-500">
                        {formatTime(apt.time)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getAppointmentTypeLabel(apt.appointmentType, selectedMode || 'doctor')}
                    </p>
                    {apt.notes && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{apt.notes}</p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile - below modals */}
      {sidebarIsOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarIsOpen(false)}
        />
      )}
    </>
  );
}

