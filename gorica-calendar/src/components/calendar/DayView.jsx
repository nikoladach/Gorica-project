import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateTimeSlots, formatTime, formatDate, isSameTimeSlot } from '../../utils/timeSlots';
import { getAppointmentTypeLabel } from '../../utils/appointmentTypes';
import { useTranslation } from '../../i18n/translations';
import AppointmentModal from '../AppointmentModal';

export default function DayView() {
  const { currentDate, selectedShift, getFilteredAppointments, selectedMode } = useAppStore();
  const { t } = useTranslation();
  const appointments = getFilteredAppointments();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const timeSlots = generateTimeSlots(currentDate, selectedShift);

  const handleSlotClick = (slot) => {
    const appointment = appointments.find((apt) => isSameTimeSlot(apt.time, slot));
    
    if (appointment) {
      setEditingAppointment(appointment);
    } else {
      setEditingAppointment(null);
    }
    
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const getSlotAppointment = (slot) => {
    return appointments.find((apt) => isSameTimeSlot(apt.time, slot));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-2">
            {timeSlots.map((slot, index) => {
              const appointment = getSlotAppointment(slot);
              const isBooked = !!appointment;
              
              return (
                <div
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  className={`
                    p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${isBooked 
                      ? 'slot-booked' 
                      : 'slot-available'
                    }
                  `}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1">
                      <span className="font-semibold text-gray-700 w-16 sm:w-20 text-sm sm:text-base">
                        {formatTime(slot)}
                      </span>
                      {appointment ? (
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                            {appointment.patientName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {getAppointmentTypeLabel(appointment.appointmentType, selectedMode || 'doctor')}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs sm:text-sm">{t('appointments.available')}</span>
                      )}
                    </div>
                    {appointment && (
                      <span className="px-2 py-1 bg-primary text-white text-xs rounded-full self-start sm:self-auto">
                        {t('appointments.booked')}
                      </span>
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

