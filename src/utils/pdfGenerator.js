import jsPDF from 'jspdf';
import { renderCyrillicText, renderCyrillicTextWrapped } from './cyrillicFont.js';

// Font size constant - all text will be size 12
const FONT_SIZE = 12;

/**
 * Generates a PDF from physician report data with Cyrillic support
 * @param {Object} reportData - The report data object
 * @param {Object} appointment - The appointment object
 * @param {Function} t - Translation function
 * @param {String} logoBase64 - Optional base64 encoded logo image
 */
export async function generateReportPDF(reportData, appointment, t, logoBase64 = null) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Reduced from 20 to save space
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Add logo at top left if provided
  let logoHeight = 0;
  if (logoBase64) {
    try {
      // Create an image element to get actual dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Calculate dimensions maintaining aspect ratio
            // Logo should be visible but not too large - max 50mm width, 20mm height (reduced for compact layout)
            const maxLogoWidth = 50;
            const maxLogoHeight = 20;
            let logoWidth = img.width;
            logoHeight = img.height;
            const aspectRatio = logoWidth / logoHeight;
            
            // Scale down if needed while maintaining aspect ratio
            if (logoWidth > maxLogoWidth) {
              logoWidth = maxLogoWidth;
              logoHeight = logoWidth / aspectRatio;
            }
            if (logoHeight > maxLogoHeight) {
              logoHeight = maxLogoHeight;
              logoWidth = logoHeight * aspectRatio;
            }
            
            // Add logo at top left corner
            doc.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight);
            resolve();
          } catch (err) {
            console.error('Error adding logo to PDF:', err);
            reject(err);
          }
        };
        img.onerror = (err) => {
          console.error('Error loading logo image:', err);
          resolve(); // Continue without logo
        };
        img.src = logoBase64;
      });
    } catch (err) {
      console.error('Error processing logo:', err);
      // Continue without logo if there's an error
    }
  }
  
  // Adjust yPosition to account for logo if present
  if (logoHeight > 0) {
    yPosition = Math.max(margin + logoHeight + 2, margin + 25);
  }

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight = 20) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add Cyrillic text with word wrapping
  // Renders Cyrillic text as images using canvas
  const addWrappedText = (text, x, y, maxWidth, fontSize = FONT_SIZE, fontStyle = 'normal', textColor = '#000000') => {
    if (!text) return 0;
    
    // Convert maxWidth from mm to pixels (approximate: 1mm ≈ 3.78px at 96 DPI)
    const maxWidthPx = maxWidth * 3.78;
    
    // Render text with word wrapping
    const textImages = renderCyrillicTextWrapped(text, maxWidthPx, fontSize, 'Arial', fontStyle, textColor);
    
    let currentY = y;
    let totalHeight = 0;
    
    for (const textImage of textImages) {
      if (textImage && textImage.dataURL) {
        // Convert image dimensions from pixels to mm (approximate)
        const imgWidth = textImage.width / 3.78;
        const imgHeight = textImage.height / 3.78;
        
        doc.addImage(textImage.dataURL, 'PNG', x, currentY, imgWidth, imgHeight);
        currentY += imgHeight;
        totalHeight += imgHeight;
      }
    }
    
    return totalHeight || (fontSize * 0.3); // Reduced line height for compact spacing
  };

  // Helper function to add a section
  const addSection = (titleKey, content, isRequired = false) => {
    checkPageBreak(15);
    yPosition += 2; // Reduced from 5
    
    // Section title - use Macedonian translation, render as Cyrillic
    const title = t(`reports.${titleKey}`) || titleKey;
    const titleText = title + (isRequired ? ' *' : '');
    const titleImage = renderCyrillicText(titleText, FONT_SIZE, 'Arial', 'bold', '#000000');
    
    if (titleImage && titleImage.dataURL) {
      const titleWidth = titleImage.width / 3.78; // Convert to mm
      const titleHeight = titleImage.height / 3.78;
      doc.addImage(titleImage.dataURL, 'PNG', margin, yPosition, titleWidth, titleHeight);
      yPosition += titleHeight + 1; // Reduced from 3
    } else {
      yPosition += FONT_SIZE * 0.3; // Reduced from 0.4
    }

    // Section content - render Cyrillic text
    if (content && content.trim()) {
      const contentHeight = addWrappedText(content, margin, yPosition, maxWidth, FONT_SIZE, 'normal', '#323232');
      yPosition += contentHeight + 2; // Reduced from 5
    } else {
      const notSpecifiedText = t('reports.notSpecified');
      const notSpecifiedImage = renderCyrillicText(notSpecifiedText, FONT_SIZE, 'Arial', 'italic', '#969696');
      if (notSpecifiedImage && notSpecifiedImage.dataURL) {
        const notSpecWidth = notSpecifiedImage.width / 3.78;
        const notSpecHeight = notSpecifiedImage.height / 3.78;
        doc.addImage(notSpecifiedImage.dataURL, 'PNG', margin, yPosition, notSpecWidth, notSpecHeight);
        yPosition += notSpecHeight + 1; // Reduced from 3
      } else {
        yPosition += FONT_SIZE * 0.3; // Reduced from 0.4
      }
    }
  };

  // Header - use Macedonian translation, render as Cyrillic
  // Position header to the right of logo, or at margin if no logo
  const headerX = (logoBase64 && logoHeight > 0) ? margin + 55 : margin; // Reduced from 65
  const headerY = logoBase64 && logoHeight > 0 ? margin + (logoHeight / 2) + 2 : yPosition; // Reduced from 5
  const headerText = t('reports.physicianReport');
  const headerImage = renderCyrillicText(headerText, FONT_SIZE + 4, 'Arial', 'bold', '#000000'); // Reduced from +6 to +4
  
  if (headerImage && headerImage.dataURL) {
    const headerWidth = headerImage.width / 3.78;
    const headerHeight = headerImage.height / 3.78;
    doc.addImage(headerImage.dataURL, 'PNG', headerX, headerY, headerWidth, headerHeight);
  }
  
  // Update yPosition to be below logo and header
  if (logoBase64 && logoHeight > 0) {
    yPosition = Math.max(headerY + (headerImage?.height || 0) / 3.78 + 2, margin + logoHeight + 5);
  } else {
    yPosition = headerY + (headerImage?.height || 0) / 3.78 + 5;
  }

  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5; // Reduced from 10

  // Appointment Information Section - render as Cyrillic
  const appointmentInfoTitle = t('reports.appointmentInfo');
  const appointmentInfoTitleImage = renderCyrillicText(appointmentInfoTitle, FONT_SIZE, 'Arial', 'bold', '#000000'); // Reduced from +2 to same size
  
  if (appointmentInfoTitleImage && appointmentInfoTitleImage.dataURL) {
    const titleWidth = appointmentInfoTitleImage.width / 3.78;
    const titleHeight = appointmentInfoTitleImage.height / 3.78;
    doc.addImage(appointmentInfoTitleImage.dataURL, 'PNG', margin, yPosition, titleWidth, titleHeight);
    yPosition += titleHeight + 2; // Reduced from 5
  } else {
    yPosition += FONT_SIZE * 0.3 + 2; // Reduced from 0.4 + 5
  }

  // Format date and time - use English format (will be transliterated if needed)
  let formattedDate = 'N/A';
  let formattedTime = 'N/A';
  if (appointment?.time) {
    try {
      const date = new Date(appointment.time);
      formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
      formattedTime = date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      // Fallback to ISO format
      formattedDate = new Date(appointment.time).toLocaleDateString();
      formattedTime = new Date(appointment.time).toLocaleTimeString();
    }
  }

  // Use Cyrillic text directly (no transliteration)
  const patientName = reportData.patient_name || appointment?.patientName || 'N/A';
  const appointmentType = appointment?.appointmentType || 'N/A';
  
  // Format date of birth
  let formattedDateOfBirth = 'N/A';
  if (reportData.date_of_birth) {
    try {
      const dobDate = new Date(reportData.date_of_birth);
      formattedDateOfBirth = dobDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      formattedDateOfBirth = reportData.date_of_birth;
    }
  } else if (appointment?.dob) {
    try {
      const dobDate = new Date(appointment.dob);
      formattedDateOfBirth = dobDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      formattedDateOfBirth = appointment.dob;
    }
  }

  const appointmentInfo = [
    { label: t('reports.patientName'), value: patientName },
    { label: t('reports.dateOfBirth'), value: formattedDateOfBirth },
    { label: t('reports.date'), value: formattedDate },
    { label: t('reports.time'), value: formattedTime },
    { label: t('reports.appointmentType'), value: appointmentType },
  ];

  // Render appointment info with Cyrillic text
  appointmentInfo.forEach((info, index) => {
    checkPageBreak(12);
    
    // Render label
    const labelText = info.label + ':';
    const labelImage = renderCyrillicText(labelText, FONT_SIZE, 'Arial', 'bold', '#000000');
    if (labelImage && labelImage.dataURL) {
      const labelWidth = labelImage.width / 3.78;
      const labelHeight = labelImage.height / 3.78;
      doc.addImage(labelImage.dataURL, 'PNG', margin, yPosition, labelWidth, labelHeight);
    }
    
    // Render value
    const valueImage = renderCyrillicText(info.value, FONT_SIZE, 'Arial', 'normal', '#323232');
    if (valueImage && valueImage.dataURL) {
      const valueWidth = valueImage.width / 3.78;
      const valueHeight = valueImage.height / 3.78;
      doc.addImage(valueImage.dataURL, 'PNG', margin + 60, yPosition, valueWidth, valueHeight);
    }
    
    yPosition += Math.max(
      (labelImage?.height || 0) / 3.78,
      (valueImage?.height || 0) / 3.78,
      FONT_SIZE * 0.3 // Reduced from 0.4
    ) + 1; // Reduced from 3
  });

  yPosition += 3; // Reduced from 5
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5; // Reduced from 10

  // Report Sections - use Macedonian labels transliterated to Latin
  addSection('reasonForVisit', reportData.reason_for_visit);
  addSection('chiefComplaint', reportData.chief_complaint);
  addSection('historyOfPresentIllness', reportData.history_of_present_illness);
  addSection('physicalExamination', reportData.physical_examination);
  addSection('diagnosis', reportData.diagnosis);
  addSection('treatmentPlan', reportData.treatment_plan);
  addSection('medicationsPrescribed', reportData.medications_prescribed);
  addSection('followUpInstructions', reportData.follow_up_instructions);
  addSection('additionalNotes', reportData.additional_notes);

  // Add doctor name and signature placeholder on the last page (bottom right corner)
  const totalPages = doc.internal.pages.length - 1;
  doc.setPage(totalPages);
  
  // Doctor name in Cyrillic: "Д-р Горица Дачевска"
  const doctorName = 'Д-р Горица Дачевска';
  const doctorNameImage = renderCyrillicText(doctorName, FONT_SIZE, 'Arial', 'normal', '#000000');
  
  // Position signature area at bottom right (above footer)
  // Calculate position: leave space for footer (10mm) + some spacing
  const footerAreaHeight = 15; // Space reserved for footer
  const signatureLineLength = 60; // 60mm line for signature
  const spacingBetweenLineAndName = 3; // Space between signature line and name
  
  if (doctorNameImage && doctorNameImage.dataURL) {
    const nameWidth = doctorNameImage.width / 3.78;
    const nameHeight = doctorNameImage.height / 3.78;
    
    // Calculate Y position: name should be just above footer
    const nameY = pageHeight - footerAreaHeight;
    
    // Signature line should be above the name
    const signatureLineY = nameY - nameHeight - spacingBetweenLineAndName;
    
    // Calculate X position: align to right (signature line and name should be right-aligned)
    const signatureLineX = pageWidth - margin - signatureLineLength;
    const nameX = pageWidth - margin - nameWidth;
    
    // Add signature line (horizontal line for signature) - right aligned
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(signatureLineX, signatureLineY, pageWidth - margin, signatureLineY);
    
    // Add doctor name below signature line - right aligned
    doc.addImage(doctorNameImage.dataURL, 'PNG', nameX, nameY - nameHeight, nameWidth, nameHeight);
  }

  // Footer - use smaller font for footer (8pt)
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Page number
    const pageText = `Page ${i} of ${totalPages}`;
    const pageImage = renderCyrillicText(pageText, 8, 'Arial', 'normal', '#969696');
    if (pageImage && pageImage.dataURL) {
      const pageWidth_mm = pageImage.width / 3.78;
      const pageHeight_mm = pageImage.height / 3.78;
      doc.addImage(pageImage.dataURL, 'PNG', pageWidth - margin - pageWidth_mm, pageHeight - 10, pageWidth_mm, pageHeight_mm);
    }
    
    // Generated date
    const generatedDate = new Date().toLocaleDateString();
    const generatedText = `Generated: ${generatedDate}`;
    const generatedImage = renderCyrillicText(generatedText, 8, 'Arial', 'normal', '#969696');
    if (generatedImage && generatedImage.dataURL) {
      const genWidth = generatedImage.width / 3.78;
      const genHeight = generatedImage.height / 3.78;
      doc.addImage(generatedImage.dataURL, 'PNG', margin, pageHeight - 10, genWidth, genHeight);
    }
  }

  // Generate filename - use transliterated patient name for filename (for file system compatibility)
  // Note: We still transliterate for filename since file systems may not support Cyrillic
  const patientNameForFile = (reportData.patient_name || appointment?.patientName || 'Report')
    .replace(/[А-Яа-я]/g, '') // Remove Cyrillic characters
    .replace(/[^a-z0-9]/gi, '_'); // Replace non-alphanumeric with underscore
  const date = appointment?.time ? new Date(appointment.time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const filename = `Izveshtaj_${patientNameForFile || 'Report'}_${date}.pdf`;

  // Save the PDF
  doc.save(filename);
}

