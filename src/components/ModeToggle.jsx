import { useAppStore } from '../store/useAppStore';

export default function ModeToggle() {
  const { selectedMode, setSelectedMode } = useAppStore();

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setSelectedMode('doctor')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          selectedMode === 'doctor'
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        🏥 Doctor
      </button>
      <button
        onClick={() => setSelectedMode('esthetician')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
          selectedMode === 'esthetician'
            ? 'bg-primary text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        💆 Esthetician
      </button>
    </div>
  );
}

