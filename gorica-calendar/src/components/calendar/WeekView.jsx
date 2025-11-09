import { useState, Fragment } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateTimeSlots, formatTime, isSameTimeSlot, formatDate } from '../../utils/timeSlots';
import { getAppointmentTypeLabel } from '../../utils/appointmentTypes';
import { useTranslation } from '../../i18n/translations';
import { startOfWeek, addDays, format } from 'date-fns';
import AppointmentModal from '../AppointmentModal';

export default function WeekView() {
  const { currentDate, selectedShift, setCurrentDate, getFilteredAppointments, selectedMode } = useAppStore();
  const { t } = useTranslation();
  const appointments = getFilteredAppointments();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  // Show only Monday to Friday (5 days)
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const timeSlots = generateTimeSlots(currentDate, selectedShift);
  
  // Get day name in Macedonian
  const getDayName = (day) => {
    const dayOfWeek = day.getDay();
    const dayNames = [
      t('calendar.sundayShort'),    // 0 - Sunday
      t('calendar.mondayShort'),    // 1 - Monday
      t('calendar.tuesdayShort'),   // 2 - Tuesday
      t('calendar.wednesdayShort'), // 3 - Wednesday
      t('calendar.thursdayShort'),  // 4 - Thursday
      t('calendar.fridayShort'),    // 5 - Friday
      t('calendar.saturdayShort')   // 6 - Saturday
    ];
    return dayNames[dayOfWeek];
  };
  
  const handleDayHeaderClick = (day) => {
    // Update currentDate to show that day's appointments in the sidebar
    setCurrentDate(day);
  };

  const handleSlotClick = (slot, day) => {
    // Create a new date combining the day with the slot's time
    // Use formatDate to get the date string to avoid timezone issues
    const dayDateStr = formatDate(day); // Returns "YYYY-MM-DD" format
    const [year, month, date] = dayDateStr.split('-').map(Number);
    
    // Extract time from slot using local time methods
    const hours = slot.getHours();
    const minutes = slot.getMinutes();
    
    // Create date using parsed components to ensure correct date
    const combinedSlot = new Date(year, month - 1, date, hours, minutes, 0, 0);
    
    console.log('WeekView - Creating slot:', {
      day: day.toISOString(),
      dayLocal: dayDateStr,
      dayDateStr,
      parsed: { year, month: month - 1, date },
      slot: slot.toISOString(),
      slotLocal: `${slot.getFullYear()}-${String(slot.getMonth() + 1).padStart(2, '0')}-${String(slot.getDate()).padStart(2, '0')} ${String(slot.getHours()).padStart(2, '0')}:${String(slot.getMinutes()).padStart(2, '0')}`,
      hours,
      minutes,
      combinedSlot: combinedSlot.toISOString(),
      combinedSlotLocal: formatDate(combinedSlot),
      combinedSlotComponents: {
        year: combinedSlot.getFullYear(),
        month: combinedSlot.getMonth() + 1,
        date: combinedSlot.getDate(),
        hours: combinedSlot.getHours(),
        minutes: combinedSlot.getMinutes()
      }
    });
    
    const appointment = appointments.find((apt) => {
      const aptDate = formatDate(apt.time);
      const dayDate = formatDate(day);
      return isSameTimeSlot(apt.time, combinedSlot) && aptDate && dayDate && aptDate === dayDate;
    });
    
    if (appointment) {
      setEditingAppointment(appointment);
      setSelectedSlot(appointment.time);
    } else {
      setEditingAppointment(null);
      setSelectedSlot(combinedSlot);
    }
    
    setIsModalOpen(true);
  };

  const getSlotAppointment = (slot, day) => {
    // Create a combined date for comparison using formatDate to avoid timezone issues
    const dayDateStr = formatDate(day);
    const [year, month, date] = dayDateStr.split('-').map(Number);
    const combinedSlot = new Date(
      year,
      month - 1,
      date,
      slot.getHours(),
      slot.getMinutes(),
      0,
      0
    );
    
    return appointments.find((apt) => {
      const aptDate = formatDate(apt.time);
      const dayDate = formatDate(day);
      return isSameTimeSlot(apt.time, combinedSlot) && aptDate && dayDate && aptDate === dayDate;
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-2 sm:p-4">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block">
            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {/* Time column header */}
              <div className="sticky left-0 z-10 bg-white border-r-2 border-gray-200 p-1 sm:p-2 font-semibold text-gray-700 text-xs sm:text-sm">
                {t('appointments.time')}
              </div>
              
              {/* Day headers - clickable */}
              {weekDays.map((day) => {
                const isSelected = formatDate(day) === formatDate(currentDate);
                return (
                  <div
                    key={format(day, 'yyyy-MM-dd')}
                    onClick={() => handleDayHeaderClick(day)}
                    className={`
                      p-1 sm:p-2 text-center font-semibold border-b-2 border-gray-200 cursor-pointer transition-colors
                      ${isSelected 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="text-xs sm:text-sm">
                      {getDayName(day)}
                    </div>
                    <div className={`text-[10px] sm:text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                      {format(day, 'd MMM')}
                    </div>
                  </div>
                );
              })}

              {/* Time slots */}
              {timeSlots.map((slot, slotIndex) => (
                <Fragment key={`slot-row-${slotIndex}`}>
                  <div
                    className="sticky left-0 z-10 bg-white border-r-2 border-gray-200 p-1 sm:p-2 text-xs sm:text-sm font-medium text-gray-600"
                  >
                    {formatTime(slot)}
                  </div>
                  {weekDays.map((day) => {
                    const appointment = getSlotAppointment(slot, day);
                    const isBooked = !!appointment;
                    
                    return (
                      <div
                        key={`${format(day, 'yyyy-MM-dd')}-${slotIndex}`}
                        onClick={() => handleSlotClick(slot, day)}
                        className={`
                          p-1 sm:p-2 rounded border-2 min-h-[50px] sm:min-h-[60px] cursor-pointer transition-all
                          ${isBooked 
                            ? 'slot-booked' 
                            : 'slot-available'
                          }
                        `}
                      >
                        {appointment && (
                          <div className="text-[10px] sm:text-xs">
                            <p className="font-medium truncate">{appointment.patientName}</p>
                            <p className="text-gray-600 truncate">
                              {getAppointmentTypeLabel(appointment.appointmentType, selectedMode || 'doctor')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
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

