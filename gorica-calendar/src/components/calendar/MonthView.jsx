import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDate, formatTime, formatDateDisplay } from '../../utils/timeSlots';
import { getAppointmentTypeLabel } from '../../utils/appointmentTypes';
import { useTranslation } from '../../i18n/translations';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek, addDays } from 'date-fns';
import AppointmentModal from '../AppointmentModal';

export default function MonthView() {
  const { currentDate, getFilteredAppointments, selectedMode } = useAppStore();
  const { t } = useTranslation();
  const appointments = getFilteredAppointments();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayAppointmentsOpen, setIsDayAppointmentsOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the first day of the week for the month start
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const daysBeforeMonth = [];
  let currentDay = weekStart;
  while (currentDay < monthStart) {
    daysBeforeMonth.push(currentDay);
    currentDay = addDays(currentDay, 1);
  }

  const getDayAppointments = (day) => {
    const dayDate = formatDate(day);
    return appointments.filter((apt) => {
      const aptDate = formatDate(apt.time);
      return aptDate && dayDate && aptDate === dayDate;
    });
  };

  const handleDayClick = (day) => {
    // Show all appointments for the clicked day in a modal
    setSelectedDay(day);
    setIsDayAppointmentsOpen(true);
  };

  const handleCreateNewAppointment = (day) => {
    // Create a new appointment slot for the selected day at 9 AM
    const dateStr = formatDate(day);
    const [year, month, dayNum] = dateStr.split('-').map(Number);
    const newSlot = new Date(year, month - 1, dayNum, 9, 0, 0, 0);
    
    setEditingAppointment(null);
    setSelectedSlot(newSlot);
    setIsDayAppointmentsOpen(false);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (e, appointment) => {
    // Stop event propagation to prevent day click
    e.stopPropagation();
    // Open modal to edit the clicked appointment
    setEditingAppointment(appointment);
    setSelectedSlot(appointment.time);
    setIsDayAppointmentsOpen(false);
    setIsModalOpen(true);
  };

  const handleDayAppointmentCardClick = (appointment) => {
    // Open modal to edit the clicked appointment from the day appointments modal
    setEditingAppointment(appointment);
    setSelectedSlot(appointment.time);
    setIsDayAppointmentsOpen(false);
    setIsModalOpen(true);
  };

  const weekDays = [
    t('calendar.mondayShort'),
    t('calendar.tuesdayShort'),
    t('calendar.wednesdayShort'),
    t('calendar.thursdayShort'),
    t('calendar.fridayShort'),
    t('calendar.saturdayShort'),
    t('calendar.sundayShort')
  ];

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-1 sm:p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded text-xs sm:text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Days before month */}
            {daysBeforeMonth.map((day) => (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className="p-1 sm:p-2 min-h-[60px] sm:min-h-[100px] bg-gray-50 rounded border border-gray-200 opacity-50"
              >
                <div className="text-xs sm:text-sm text-gray-400">{format(day, 'd')}</div>
              </div>
            ))}

            {/* Month days */}
            {monthDays.map((day) => {
              const dayAppointments = getDayAppointments(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  onClick={() => handleDayClick(day)}
                  className={`
                    p-1 sm:p-2 min-h-[60px] sm:min-h-[100px] rounded border-2 cursor-pointer transition-all
                    ${isToday 
                      ? 'border-primary bg-primary-light' 
                      : 'border-gray-200 bg-white hover:border-primary/50'
                    }
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                  `}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => handleAppointmentClick(e, apt)}
                        className="text-[10px] sm:text-xs p-0.5 sm:p-1 bg-primary text-white rounded truncate cursor-pointer hover:bg-primary-dark transition-colors"
                        title={`${apt.patientName} - ${getAppointmentTypeLabel(apt.appointmentType, selectedMode || 'doctor')} (${t('appointments.clickToEdit')})`}
                      >
                        {apt.patientName}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        +{dayAppointments.length - 2} {t('calendar.more')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Appointments Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDayAppointmentsOpen(false);
              setSelectedDay(null);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  {formatDateDisplay(selectedDay, t)}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getDayAppointments(selectedDay).length} {getDayAppointments(selectedDay).length !== 1 ? t('appointments.appointments') : t('appointments.appointment')}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDayAppointmentsOpen(false);
                  setSelectedDay(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none p-1"
                aria-label={t('common.close')}
              >
                ×
              </button>
            </div>

            {/* Scrollable Appointments List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {getDayAppointments(selectedDay).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg mb-4">{t('appointments.noAppointments')}</p>
                  <button
                    onClick={() => handleCreateNewAppointment(selectedDay)}
                    className="btn-primary"
                  >
                    {t('appointments.newAppointment')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDayAppointments(selectedDay)
                    .sort((a, b) => {
                      const dateA = a.time instanceof Date ? a.time : new Date(a.time);
                      const dateB = b.time instanceof Date ? b.time : new Date(b.time);
                      return dateA - dateB;
                    })
                    .map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => handleDayAppointmentCardClick(apt)}
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(apt.time)}
                          </div>
                          {apt.notes && (
                            <div className="text-sm text-gray-600">
                              <p className="line-clamp-2">{apt.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer with Create New Button */}
            {getDayAppointments(selectedDay).length > 0 && (
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <button
                  onClick={() => handleCreateNewAppointment(selectedDay)}
                  className="btn-primary w-full"
                >
                  {t('appointments.newAppointment')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
          setEditingAppointment(null);
        }}
        selectedSlot={selectedSlot}
        appointment={editingAppointment}
      />
    </div>
  );
}

