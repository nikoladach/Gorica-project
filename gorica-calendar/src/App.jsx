import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useTranslation } from './i18n/translations';
import { getAppointmentTypeLabel } from './utils/appointmentTypes';
import Login from './components/Login';
import Navigation from './components/Navigation';
import ShiftToggle from './components/ShiftToggle';
import Sidebar from './components/Sidebar';
import DayView from './components/calendar/DayView';
import WeekView from './components/calendar/WeekView';
import MonthView from './components/calendar/MonthView';
import PatientReports from './components/PatientReports';

function App() {
  const { 
    isAuthenticated, 
    user,
    currentView, 
    fetchAppointments, 
    loading, 
    error, 
    currentDate, 
    setGlobalSearchQuery, 
    globalSearchQuery, 
    selectedMode,
    logout,
    verifyAuth,
    authLoading
  } = useAppStore();
  const { t } = useTranslation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientReportsOpen, setIsPatientReportsOpen] = useState(false);
  // Sidebar state - closed by default on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return false;
  });

  // Verify authentication on mount
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Fetch appointments on mount and when date changes (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments().catch((err) => {
        console.error('Failed to load appointments:', err);
      });
    }
  }, [fetchAppointments, isAuthenticated]);

  // Update sidebar state when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true); // Open on desktop
      } else {
        setSidebarOpen(false); // Closed on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderCalendar = () => {
    switch (currentView) {
      case 'day':
        return <DayView />;
      case 'week':
        return <WeekView />;
      case 'month':
        return <MonthView />;
      default:
        return <DayView />;
    }
  };

  const renderSearchResults = () => {
    const { getFilteredAppointments } = useAppStore.getState();
    const filteredAppointments = getFilteredAppointments();
    
    if (!globalSearchQuery || globalSearchQuery.trim() === '') {
      return null;
    }

    return (
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {t('search.searchResults')} "{globalSearchQuery}"
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {t('search.found')} {filteredAppointments.length} {filteredAppointments.length !== 1 ? t('search.appointments') : t('search.appointment')}
            </p>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 text-lg">{t('search.noResults')} "{globalSearchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments
                .sort((a, b) => {
                  const dateA = a.time instanceof Date ? a.time : new Date(a.time);
                  const dateB = b.time instanceof Date ? b.time : new Date(b.time);
                  return dateA - dateB;
                })
                .map((apt) => (
                  <div
                    key={apt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Get unique patient ID from the appointment
                      // The appointment should have patientId from the transformation
                      const patientId = apt.patientId;
                      console.log('Clicked appointment:', apt);
                      console.log('Patient ID:', patientId);
                      
                      if (patientId) {
                        setSelectedPatient({
                          id: patientId,
                          name: apt.patientName
                        });
                        setIsPatientReportsOpen(true);
                      } else {
                        // If no patientId, log warning and try to find patient by name
                        console.warn('No patientId found for appointment:', apt);
                        // Try to find patient by name using the patients API
                        // For now, show error message
                        alert(t('reports.patientIdRequired') || 'Patient ID not found. Cannot load reports.');
                      }
                    }}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-5 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 truncate">
                          {apt.patientName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          {getAppointmentTypeLabel(apt.appointmentType, selectedMode || 'doctor')}
                        </p>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto whitespace-nowrap ${
                        apt.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : apt.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t(`status.${apt.status}`) || apt.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {(() => {
                          const date = new Date(apt.time);
                          const dayNames = [
                            t('calendar.sunday'),
                            t('calendar.monday'),
                            t('calendar.tuesday'),
                            t('calendar.wednesday'),
                            t('calendar.thursday'),
                            t('calendar.friday'),
                            t('calendar.saturday')
                          ];
                          const monthNames = [
                            t('calendar.months.january'),
                            t('calendar.months.february'),
                            t('calendar.months.march'),
                            t('calendar.months.april'),
                            t('calendar.months.may'),
                            t('calendar.months.june'),
                            t('calendar.months.july'),
                            t('calendar.months.august'),
                            t('calendar.months.september'),
                            t('calendar.months.october'),
                            t('calendar.months.november'),
                            t('calendar.months.december')
                          ];
                          const dayName = dayNames[date.getDay()];
                          const monthName = monthNames[date.getMonth()];
                          return `${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;
                        })()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(apt.time).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{t('appointments.notes')}:</span> {apt.notes}
                        </p>
                      </div>
                    )}

                    {apt.phone && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">{t('appointments.patientPhone')}:</span> {apt.phone}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="p-2 sm:p-3 md:p-4">
          {/* Top row: Title and Hamburger (mobile) / Full controls (desktop) */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
            {/* Left: Title and User Info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-primary truncate">
                {selectedMode === 'doctor' ? `🏥 ${t('header.doctorScheduler')}` : `💆 ${t('header.estheticianScheduler')}`}
              </h1>
              {/* User info - hidden on very small screens, shown on sm+ */}
              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span className="hidden md:inline">{t('auth.loggedInAs')}</span>
                <span className="font-semibold text-primary truncate">{user?.name || user?.username}</span>
                <span className="px-2 py-1 bg-primary-light text-primary rounded text-xs whitespace-nowrap">
                  {selectedMode === 'doctor' ? t('auth.doctor') : t('auth.esthetician')}
                </span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Hamburger menu button - mobile only */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden bg-primary text-white p-2 rounded-lg shadow-sm hover:bg-primary-dark transition-colors flex-shrink-0"
                aria-label={sidebarOpen ? t('common.close') : t('sidebar.openSidebar')}
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
              <ShiftToggle />
              <button
                onClick={logout}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>

          {/* Second row: User info (mobile only) */}
          <div className="sm:hidden flex items-center gap-2 text-xs text-gray-600 mb-2">
            <span className="font-semibold text-primary">{user?.name || user?.username}</span>
            <span className="px-2 py-0.5 bg-primary-light text-primary rounded text-xs">
              {selectedMode === 'doctor' ? t('auth.doctor') : t('auth.esthetician')}
            </span>
          </div>

          {/* Search Bar - Full width, prominent */}
          <div className="relative">
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder={t('header.searchPatientName')}
              className="w-full px-3 sm:px-4 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <svg
              className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-sm text-red-600">
            ⚠️ {error} - {t('errors.refreshPage')}
          </p>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <p className="text-sm text-blue-600">{t('appointments.loadingAppointments')}</p>
        </div>
      )}

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Show search results if search query exists, otherwise show calendar */}
        {globalSearchQuery && globalSearchQuery.trim() !== '' ? (
          renderSearchResults()
        ) : (
          <>
            {/* Calendar View */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {renderCalendar()}
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          </>
        )}
      </div>

      {/* Patient Reports Modal */}
      {selectedPatient && (
        <PatientReports
          isOpen={isPatientReportsOpen}
          onClose={() => {
            setIsPatientReportsOpen(false);
            setSelectedPatient(null);
          }}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
        />
      )}
    </div>
  );
}

export default App;

