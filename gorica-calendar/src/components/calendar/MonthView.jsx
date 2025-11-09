import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDate } from '../../utils/timeSlots';
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
    // Always create a new appointment slot for the clicked day at 9 AM
    // This allows creating new appointments even if the day already has appointments
    // Use formatDate to get the date string, then parse it to avoid timezone issues
    const dateStr = formatDate(day); // Returns "YYYY-MM-DD" format
    const [year, month, dayNum] = dateStr.split('-').map(Number);
    
    // Create date using local time components - this ensures no timezone conversion
    // Use noon (12:00) as the base time to avoid any midnight timezone edge cases
    // Then we'll set it to 9 AM after creation
    const newSlot = new Date(year, month - 1, dayNum, 9, 0, 0, 0);
    
    // Verify the date is correct by formatting it again
    const verifyDateStr = formatDate(newSlot);
    
    console.log('MonthView - Creating slot for day:', {
      clickedDay: day.toISOString(),
      clickedDayLocal: dateStr,
      dateStr,
      parsed: { year, month: month - 1, dayNum },
      newSlot: newSlot.toISOString(),
      newSlotLocal: verifyDateStr,
      newSlotComponents: {
        year: newSlot.getFullYear(),
        month: newSlot.getMonth() + 1,
        date: newSlot.getDate(),
        hours: newSlot.getHours()
      },
      dateMatch: dateStr === verifyDateStr
    });
    
    // Double-check: if dates don't match, log a warning
    if (dateStr !== verifyDateStr) {
      console.error('⚠️ DATE MISMATCH!', {
        expected: dateStr,
        actual: verifyDateStr,
        clickedDay: day,
        newSlot: newSlot
      });
    }
    
    setEditingAppointment(null);
    setSelectedSlot(newSlot);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (e, appointment) => {
    // Stop event propagation to prevent day click
    e.stopPropagation();
    // Open modal to edit the clicked appointment
    setEditingAppointment(appointment);
    setSelectedSlot(appointment.time);
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

