import { format, addMinutes, setHours, setMinutes, isValid } from 'date-fns';

export const generateTimeSlots = (date, shift) => {
  const slots = [];
  const startHour = shift === 'morning' ? 9 : 14;
  const endHour = shift === 'morning' ? 17 : 21;
  
  // Use local date components to avoid timezone shifts
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create dates using local time components
  let currentTime = new Date(year, month, day, startHour, 0, 0, 0);
  const endTime = new Date(year, month, day, endHour, 0, 0, 0);
  
  while (currentTime < endTime) {
    slots.push(new Date(currentTime));
    currentTime = addMinutes(currentTime, 15);
  }
  
  return slots;
};

// Helper function to convert various time formats to a Date object
const toDate = (value) => {
  if (!value) return null;
  
  // If it's already a valid Date object
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  
  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // Try parsing as ISO string first
    const isoDate = new Date(value);
    if (isValid(isoDate)) {
      return isoDate;
    }
    
    // Try parsing as time string (HH:mm or HH:mm:ss)
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const date = new Date();
      date.setHours(parseInt(timeMatch[1], 10));
      date.setMinutes(parseInt(timeMatch[2], 10));
      date.setSeconds(timeMatch[3] ? parseInt(timeMatch[3], 10) : 0);
      date.setMilliseconds(0);
      return isValid(date) ? date : null;
    }
  }
  
  return null;
};

export const formatTime = (date) => {
  const validDate = toDate(date);
  if (!validDate) {
    console.warn('Invalid date passed to formatTime:', date);
    return '';
  }
  return format(validDate, 'HH:mm');
};

export const formatDate = (date) => {
  const validDate = toDate(date);
  if (!validDate) {
    console.warn('Invalid date passed to formatDate:', date);
    return '';
  }
  return format(validDate, 'yyyy-MM-dd');
};

export const formatDateDisplay = (date, t = null) => {
  const validDate = toDate(date);
  if (!validDate) {
    console.warn('Invalid date passed to formatDateDisplay:', date);
    return '';
  }
  
  // If translation function is provided, use Macedonian translations
  if (t) {
    const dayOfWeek = validDate.getDay();
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
    
    const dayName = dayNames[dayOfWeek];
    const day = validDate.getDate();
    const monthName = monthNames[validDate.getMonth()];
    const year = validDate.getFullYear();
    
    return `${dayName}, ${day} ${monthName} ${year}`;
  }
  
  // Fallback to English if no translation function provided
  return format(validDate, 'EEEE, d MMMM yyyy');
};

// Format date as DD/MM/YYYY for input fields
export const formatDateInput = (date) => {
  const validDate = toDate(date);
  if (!validDate) {
    return '';
  }
  const day = String(validDate.getDate()).padStart(2, '0');
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  const year = validDate.getFullYear();
  return `${day}/${month}/${year}`;
};

// Parse DD/MM/YYYY format to Date object
export const parseDateInput = (dateString) => {
  if (!dateString) return null;
  
  // Try to parse DD/MM/YYYY format
  const dateMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateMatch[3], 10);
    
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const date = new Date(year, month, day, 12, 0, 0, 0);
      // Verify the date is valid (handles cases like 31/02/2025)
      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  return null;
};

export const isSameTimeSlot = (date1, date2) => {
  const validDate1 = toDate(date1);
  const validDate2 = toDate(date2);
  
  // If either date is invalid, they can't be the same
  if (!validDate1 || !validDate2) {
    return false;
  }
  
  return formatTime(validDate1) === formatTime(validDate2) && 
         formatDate(validDate1) === formatDate(validDate2);
};

