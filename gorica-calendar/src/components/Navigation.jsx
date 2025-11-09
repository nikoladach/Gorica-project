import { useAppStore } from '../store/useAppStore';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { formatDateDisplay, formatDate, formatDateInput, parseDateInput } from '../utils/timeSlots';
import { useTranslation } from '../i18n/translations';
import { useState, useEffect, useRef } from 'react';

export default function Navigation() {
  const { currentView, setCurrentView, currentDate, setCurrentDate, goToToday, setGlobalSearchQuery } = useAppStore();
  const { t } = useTranslation();
  const [dateInputValue, setDateInputValue] = useState(formatDateInput(currentDate));
  const [dateInputValueISO, setDateInputValueISO] = useState(formatDate(currentDate));
  const hiddenDateInputRef = useRef(null);

  // Sync input value when currentDate changes from outside (e.g., "Today" button)
  useEffect(() => {
    setDateInputValue(formatDateInput(currentDate));
    setDateInputValueISO(formatDate(currentDate));
  }, [currentDate]);

  const navigateDate = (direction) => {
    let newDate;
    switch (currentView) {
      case 'day':
        newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
        break;
      case 'week':
        newDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
    setDateInputValue(formatDateInput(newDate));
    setDateInputValueISO(formatDate(newDate));
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-3 md:p-4">
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Top row: Date navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            <button
              onClick={goToToday}
              className="btn-secondary text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              {t('calendar.today')}
            </button>
            
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <button
                onClick={() => navigateDate('prev')}
                className="
                  flex items-center justify-center
                  w-9 h-9 sm:w-10 sm:h-10
                  bg-primary text-white
                  border-2 border-primary
                  rounded-lg
                  font-bold text-base sm:text-lg
                  shadow-md hover:shadow-lg
                  hover:bg-primary-dark
                  active:scale-95
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                "
                aria-label={t('appointments.previous')}
              >
                ←
              </button>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={dateInputValue}
                  placeholder="ДД/ММ/ГГГГ"
                  readOnly
                  className="px-2 sm:px-3 py-2 pr-8 sm:pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-24 sm:w-32 text-sm cursor-pointer pointer-events-none"
                />
                <input
                  ref={hiddenDateInputRef}
                  type="date"
                  value={dateInputValueISO}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setDateInputValueISO(inputValue);
                    
                    // Date input returns YYYY-MM-DD format, parse it directly
                    if (inputValue) {
                      const parsedDate = new Date(inputValue);
                      if (!isNaN(parsedDate.getTime())) {
                        setCurrentDate(parsedDate);
                        setDateInputValue(formatDateInput(parsedDate));
                      }
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ zIndex: 1 }}
                />
                <svg
                  className="absolute right-2 sm:right-3 w-4 h-4 text-gray-400 pointer-events-none z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="
                  flex items-center justify-center
                  w-9 h-9 sm:w-10 sm:h-10
                  bg-primary text-white
                  border-2 border-primary
                  rounded-lg
                  font-bold text-base sm:text-lg
                  shadow-md hover:shadow-lg
                  hover:bg-primary-dark
                  active:scale-95
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                "
                aria-label={t('appointments.next')}
              >
                →
              </button>
            </div>

            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 hidden sm:block flex-1 text-center sm:text-left">
              {formatDateDisplay(currentDate, t)}
            </h2>
          </div>
        </div>

        {/* Bottom row: View switcher */}
        <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setCurrentView('day');
              setGlobalSearchQuery(''); // Clear search when switching to calendar view
            }}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentView === 'day'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('nav.dayView')}
          </button>
          <button
            onClick={() => {
              setCurrentView('week');
              setGlobalSearchQuery(''); // Clear search when switching to calendar view
            }}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentView === 'week'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('nav.weekView')}
          </button>
          <button
            onClick={() => {
              setCurrentView('month');
              setGlobalSearchQuery(''); // Clear search when switching to calendar view
            }}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
              currentView === 'month'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('nav.monthView')}
          </button>
        </div>

        {/* Mobile date display */}
        <h2 className="text-sm font-semibold text-gray-800 sm:hidden text-center">
          {formatDateDisplay(currentDate, t)}
        </h2>
      </div>
    </div>
  );
}

