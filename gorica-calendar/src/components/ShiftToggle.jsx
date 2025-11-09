import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/translations';

export default function ShiftToggle() {
  const { selectedShift, setSelectedShift } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 bg-white rounded-lg p-0.5 sm:p-1 shadow-sm border border-gray-200">
      <button
        onClick={() => setSelectedShift('morning')}
        className={`px-1.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
          selectedShift === 'morning'
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="hidden sm:inline">{t('calendar.morning')}</span>
        <span className="sm:hidden">{t('calendar.morning').substring(0, 3)}</span>
        <span className="hidden md:inline"> (09:00 - 17:00)</span>
      </button>
      <button
        onClick={() => setSelectedShift('evening')}
        className={`px-1.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
          selectedShift === 'evening'
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="hidden sm:inline">{t('calendar.evening')}</span>
        <span className="sm:hidden">{t('calendar.evening').substring(0, 3)}</span>
        <span className="hidden md:inline"> (14:00 - 21:00)</span>
      </button>
    </div>
  );
}

