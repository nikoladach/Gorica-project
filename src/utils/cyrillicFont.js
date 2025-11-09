// Cyrillic font support for jsPDF
// Render Cyrillic text using canvas and add as image to PDF
// Uses Arial font which supports Cyrillic characters

/**
 * Render Cyrillic text as an image using canvas
 * @param {string} text - Text to render (can contain Cyrillic characters)
 * @param {number} fontSize - Font size in pixels (default: 12)
 * @param {string} fontFamily - Font family (default: 'Arial')
 * @param {string} fontStyle - Font style: 'normal', 'bold', 'italic' (default: 'normal')
 * @param {string} textColor - Text color (default: '#000000')
 * @returns {string} Base64 data URL of the rendered text image
 */
export function renderCyrillicText(text, fontSize = 12, fontFamily = 'Arial', fontStyle = 'normal', textColor = '#000000') {
  if (!text || typeof text !== 'string') return null;
  
  // Create a canvas to render Cyrillic text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set font with proper style
  const fontWeight = fontStyle === 'bold' ? 'bold' : 'normal';
  const fontStyleStr = fontStyle === 'italic' ? 'italic' : 'normal';
  ctx.font = `${fontWeight} ${fontStyleStr} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';
  
  // Measure text
  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = fontSize;
  
  // Set canvas size with minimal padding for compact spacing
  canvas.width = textWidth + 6; // Reduced from 10
  canvas.height = textHeight + 6; // Reduced from 10
  
  // Redraw with proper dimensions
  ctx.font = `${fontWeight} ${fontStyleStr} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';
  ctx.fillText(text, 3, 3); // Reduced padding from 5, 5
  
  return {
    dataURL: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Render Cyrillic text with word wrapping
 * @param {string} text - Text to render
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} fontSize - Font size (default: 12)
 * @param {string} fontFamily - Font family (default: 'Arial')
 * @param {string} fontStyle - Font style (default: 'normal')
 * @param {string} textColor - Text color (default: '#000000')
 * @returns {Array} Array of text image objects with dataURL, width, and height
 */
export function renderCyrillicTextWrapped(text, maxWidth, fontSize = 12, fontFamily = 'Arial', fontStyle = 'normal', textColor = '#000000') {
  if (!text || typeof text !== 'string') return [];
  
  // Create a temporary canvas to measure text
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  const fontWeight = fontStyle === 'bold' ? 'bold' : 'normal';
  const fontStyleStr = fontStyle === 'italic' ? 'italic' : 'normal';
  measureCtx.font = `${fontWeight} ${fontStyleStr} ${fontSize}px ${fontFamily}`;
  
  // Split text into words and wrap lines
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = measureCtx.measureText(testLine).width;
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Render each line
  return lines.map(line => renderCyrillicText(line, fontSize, fontFamily, fontStyle, textColor));
}

