import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { formatDateDisplay, formatTime } from '../utils/timeSlots';
import { useTranslation } from '../i18n/translations';
import { generateReportPDF } from '../utils/pdfGenerator';
import { imageToBase64 } from '../utils/logoBase64';
import PhysicianReport from './PhysicianReport';

export default function PatientReports({ isOpen, onClose, patientId, patientName }) {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && patientId) {
      console.log('PatientReports: useEffect triggered', { isOpen, patientId });
      loadReports();
    } else if (isOpen && !patientId) {
      console.warn('PatientReports: isOpen but no patientId', { isOpen, patientId });
      setError(t('reports.patientIdRequired') || 'Patient ID is required to load reports');
      setLoading(false);
    }
  }, [isOpen, patientId]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalOverflow = document.body.style.overflow;
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore scrolling when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch reports by patient_id if available, otherwise we can't filter by patient
      if (patientId) {
        // Ensure patientId is a number (convert string to number if needed)
        const patientIdNum = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
        console.log('Loading reports for patient ID:', patientIdNum, '(original:', patientId, ')');
        
        const allReports = await reportsAPI.getAll({ patient_id: patientIdNum });
        console.log('Reports fetched:', allReports);
        console.log('Number of reports:', allReports?.length || 0);
        
        setReports(allReports || []);
      } else {
        // If no patientId, we can't fetch reports by patient
        // In a real scenario, you'd search for the patient by name first
        console.warn('No patient ID provided');
        setError(t('reports.patientIdRequired') || 'Patient ID is required to load reports');
        setReports([]);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        patientId: patientId
      });
      setError(err.message || t('reports.failedToLoad'));
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    // Create appointment object from report data
    const appointment = {
      id: report.appointment_id,
      patientName: report.patient_name || patientName,
      firstName: report.first_name || '',
      lastName: report.last_name || '',
      appointmentType: report.appointment_type || '',
      time: report.appointment_time ? new Date(report.appointment_time) : new Date(),
      status: report.appointment_status || 'completed',
      dob: report.dob || null,
    };
    
    setSelectedReport({ ...report, appointment });
    setIsReportModalOpen(true);
  };

  const handleGeneratePDF = async (report) => {
    try {
      // Create appointment object from report data
      const appointment = {
        id: report.appointment_id,
        patientName: report.patient_name || patientName,
        appointmentType: report.appointment_type || '',
        time: report.appointment_time ? new Date(report.appointment_time) : new Date(),
        dob: report.dob || null,
      };

      const reportData = {
        patient_name: report.patient_name,
        date_of_birth: report.date_of_birth || null,
        reason_for_visit: report.reason_for_visit,
        chief_complaint: report.chief_complaint,
        history_of_present_illness: report.history_of_present_illness,
        physical_examination: report.physical_examination,
        diagnosis: report.diagnosis,
        treatment_plan: report.treatment_plan,
        medications_prescribed: report.medications_prescribed,
        follow_up_instructions: report.follow_up_instructions,
        additional_notes: report.additional_notes,
      };

      // Load logo if available
      let logoBase64 = null;
      try {
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
      alert(t('reports.failedToGeneratePDF') || 'Failed to generate PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                {t('reports.patientReports')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {patientName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none p-1"
              aria-label={t('common.close')}
            >
              ×
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">{t('common.loading')}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">{t('reports.noReports')}</p>
                  {patientId && (
                    <p className="text-sm text-gray-400 mt-2">
                      Patient ID: {patientId}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    // Handle different date formats from the API
                    let appointmentDate = null;
                    if (report.appointment_time) {
                      appointmentDate = new Date(report.appointment_time);
                    } else if (report.appointment_date) {
                      // If we have appointment_date, combine with start_time if available
                      const dateStr = report.appointment_date;
                      const timeStr = report.start_time || '00:00:00';
                      appointmentDate = new Date(`${dateStr}T${timeStr}`);
                    }
                    
                    return (
                      <div
                        key={report.id || report.appointment_id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {appointmentDate && !isNaN(appointmentDate.getTime()) ? (
                                <span className="text-sm sm:text-base font-medium text-gray-800">
                                  {formatDateDisplay(appointmentDate, t)} {formatTime(appointmentDate)}
                                </span>
                              ) : (
                                <span className="text-sm sm:text-base font-medium text-gray-800">
                                  {report.appointment_date || 'N/A'}
                                </span>
                              )}
                            </div>
                            {report.appointment_type && (
                              <p className="text-sm text-gray-600 mb-2">
                                {t('reports.appointmentType')}: {report.appointment_type}
                              </p>
                            )}
                            {report.diagnosis && (
                              <p className="text-sm text-gray-700 line-clamp-2">
                                <span className="font-medium">{t('reports.diagnosis')}:</span> {report.diagnosis}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleViewReport(report)}
                              className="btn-primary text-sm sm:text-base px-3 sm:px-4 py-2"
                            >
                              {t('reports.viewReport')}
                            </button>
                            <button
                              onClick={() => handleGeneratePDF(report)}
                              className="btn-secondary bg-green-100 text-green-700 hover:bg-green-200 text-sm sm:text-base px-3 sm:px-4 py-2"
                            >
                              📄 {t('reports.saveAsPDF')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedReport && (
        <PhysicianReport
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedReport(null);
          }}
          appointment={selectedReport.appointment}
        />
      )}
    </>
  );
}

