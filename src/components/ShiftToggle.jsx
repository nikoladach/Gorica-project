import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/translations';

export default function ShiftToggle() {
  const { selectedShift, setSelectedShift } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
      <button
        onClick={() => setSelectedShift('morning')}
        className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
          selectedShift === 'morning'
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="hidden sm:inline">{t('calendar.morning')} </span>
        <span className="sm:hidden">{t('calendar.morning').substring(0, 3)}</span>
        <span className="hidden md:inline"> (09:00 - 17:00)</span>
      </button>
      <button
        onClick={() => setSelectedShift('evening')}
        className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
          selectedShift === 'evening'
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="hidden sm:inline">{t('calendar.evening')} </span>
        <span className="sm:hidden">{t('calendar.evening').substring(0, 3)}</span>
        <span className="hidden md:inline"> (14:00 - 21:00)</span>
      </button>
    </div>
  );
}

