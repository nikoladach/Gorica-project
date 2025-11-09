import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { formatDateDisplay, formatTime } from '../utils/timeSlots';
import { useTranslation } from '../i18n/translations';
import { generateReportPDF } from '../utils/pdfGenerator';
import { imageToBase64 } from '../utils/logoBase64';

export default function PhysicianReport({ isOpen, onClose, appointment }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  
  // Form fields
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [medicationsPrescribed, setMedicationsPrescribed] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (isOpen && appointment) {
      // Pre-fill with appointment data
      setPatientName(appointment.patientName || `${appointment.firstName || ''} ${appointment.lastName || ''}`.trim());
      // Pre-fill date of birth from patient data if available
      if (appointment.dob) {
        // Format date for input (YYYY-MM-DD)
        const dobDate = new Date(appointment.dob);
        const formattedDob = dobDate.toISOString().split('T')[0];
        setDateOfBirth(formattedDob);
      } else {
        setDateOfBirth('');
      }
      setReasonForVisit(appointment.appointmentType || '');
      setChiefComplaint(appointment.notes || '');
      
      // Load existing report if available
      loadReport();
    }
  }, [isOpen, appointment]);

  const loadReport = async () => {
    if (!appointment?.id) return;
    
    setLoading(true);
    setError('');
    try {
      const existingReport = await reportsAPI.getByAppointmentId(appointment.id);
      setReport(existingReport);
      
      // Pre-fill form with existing report data
      setPatientName(existingReport.patient_name || appointment.patientName || '');
      // Pre-fill date of birth from report or patient data
      if (existingReport.date_of_birth) {
        const dobDate = new Date(existingReport.date_of_birth);
        const formattedDob = dobDate.toISOString().split('T')[0];
        setDateOfBirth(formattedDob);
      } else if (appointment.dob) {
        const dobDate = new Date(appointment.dob);
        const formattedDob = dobDate.toISOString().split('T')[0];
        setDateOfBirth(formattedDob);
      } else {
        setDateOfBirth('');
      }
      setReasonForVisit(existingReport.reason_for_visit || appointment.appointmentType || '');
      setChiefComplaint(existingReport.chief_complaint || appointment.notes || '');
      setHistoryOfPresentIllness(existingReport.history_of_present_illness || '');
      setPhysicalExamination(existingReport.physical_examination || '');
      setDiagnosis(existingReport.diagnosis || '');
      setTreatmentPlan(existingReport.treatment_plan || '');
      setMedicationsPrescribed(existingReport.medications_prescribed || '');
      setFollowUpInstructions(existingReport.follow_up_instructions || '');
      setAdditionalNotes(existingReport.additional_notes || '');
    } catch (err) {
      // Report doesn't exist yet, that's okay
      if (err.message && !err.message.includes('404')) {
        console.error('Error loading report:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointment?.id) {
      setError(t('reports.appointmentRequired'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const reportData = {
        appointment_id: appointment.id,
        patient_name: patientName,
        date_of_birth: dateOfBirth || null,
        reason_for_visit: reasonForVisit,
        chief_complaint: chiefComplaint,
        history_of_present_illness: historyOfPresentIllness,
        physical_examination: physicalExamination,
        diagnosis: diagnosis,
        treatment_plan: treatmentPlan,
        medications_prescribed: medicationsPrescribed,
        follow_up_instructions: followUpInstructions,
        additional_notes: additionalNotes,
      };

      await reportsAPI.upsertByAppointmentId(appointment.id, reportData);
      
      // Reload report to get updated data
      await loadReport();
      
      // Show success message (you could add a toast notification here)
      alert(t('reports.savedSuccessfully'));
    } catch (err) {
      setError(err.message || t('reports.failedToSave'));
      console.error('Error saving report:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const reportData = {
        patient_name: patientName,
        date_of_birth: dateOfBirth || null,
        reason_for_visit: reasonForVisit,
        chief_complaint: chiefComplaint,
        history_of_present_illness: historyOfPresentIllness,
        physical_examination: physicalExamination,
        diagnosis: diagnosis,
        treatment_plan: treatmentPlan,
        medications_prescribed: medicationsPrescribed,
        follow_up_instructions: followUpInstructions,
        additional_notes: additionalNotes,
      };

      // Load logo if available
      let logoBase64 = null;
      try {
        // Try to load logo from public folder - try multiple possible filenames
        const logoPaths = [
          '/dr gorica pic .png',
          '/logo.png',
          '/dr-gorica-pic.png',
          '/dr_gorica_pic.png'
        ];
        
        for (const logoPath of logoPaths) {
          try {
            logoBase64 = await imageToBase64(logoPath);
            if (logoBase64) break;
          } catch (err) {
            continue;
          }
        }
      } catch (logoErr) {
        console.log('Logo not found, continuing without logo');
      }

      await generateReportPDF(reportData, appointment, t, logoBase64);
      alert(t('reports.pdfGenerated'));
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(t('reports.failedToGeneratePDF') || 'Failed to generate PDF');
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {t('reports.physicianReport')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none p-1"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        {/* Appointment Info */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">{t('reports.appointmentInfo')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div>
              <span className="font-medium">{t('reports.patientName')}:</span> {appointment.patientName || `${appointment.firstName || ''} ${appointment.lastName || ''}`.trim()}
            </div>
            <div>
              <span className="font-medium">{t('reports.date')}:</span> {formatDateDisplay(appointment.time, t)}
            </div>
            <div>
              <span className="font-medium">{t('reports.time')}:</span> {formatTime(appointment.time)}
            </div>
            {appointment.appointmentType && (
              <div>
                <span className="font-medium">{t('reports.appointmentType')}:</span> {appointment.appointmentType}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="mb-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">{t('common.loading')}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.patientName')} *
            </label>
            <input
              type="text"
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.dateOfBirth')}
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="reasonForVisit" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.reasonForVisit')}
            </label>
            <input
              type="text"
              id="reasonForVisit"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.chiefComplaint')}
            </label>
            <textarea
              id="chiefComplaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="historyOfPresentIllness" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.historyOfPresentIllness')}
            </label>
            <textarea
              id="historyOfPresentIllness"
              value={historyOfPresentIllness}
              onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
              rows={4}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="physicalExamination" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.physicalExamination')}
            </label>
            <textarea
              id="physicalExamination"
              value={physicalExamination}
              onChange={(e) => setPhysicalExamination(e.target.value)}
              rows={4}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.diagnosis')}
            </label>
            <textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="treatmentPlan" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.treatmentPlan')}
            </label>
            <textarea
              id="treatmentPlan"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              rows={4}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="medicationsPrescribed" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.medicationsPrescribed')}
            </label>
            <textarea
              id="medicationsPrescribed"
              value={medicationsPrescribed}
              onChange={(e) => setMedicationsPrescribed(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="followUpInstructions" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.followUpInstructions')}
            </label>
            <textarea
              id="followUpInstructions"
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reports.additionalNotes')}
            </label>
            <textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={saving || loading}
              className="btn-secondary bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              📄 {t('reports.saveAsPDF')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {t('common.close')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

