// Logo base64 string - replace this with your actual logo base64
// To convert your logo image to base64, you can use:
// 1. Online tool: https://www.base64-image.de/
// 2. Or in browser console: 
//    const canvas = document.createElement('canvas');
//    const ctx = canvas.getContext('2d');
//    const img = new Image();
//    img.onload = () => {
//      canvas.width = img.width;
//      canvas.height = img.height;
//      ctx.drawImage(img, 0, 0);
//      const base64 = canvas.toDataURL('image/png');
//      console.log(base64);
//    };
//    img.src = '/logo.png';

// Placeholder - replace with actual logo base64
export const logoBase64 = null;

// Helper function to convert image to base64
export async function imageToBase64(imagePath) {
  try {
    // In Vite, public folder files are served from root
    // Try multiple paths to find the logo
    const paths = [
      imagePath, // /dr gorica pic .png
      encodeURI(imagePath), // URL encoded version
      `${import.meta.env.BASE_URL}${imagePath.replace(/^\//, '')}`, // With base URL
      `${import.meta.env.BASE_URL}${encodeURI(imagePath.replace(/^\//, ''))}`, // With base URL and encoding
      `${window.location.origin}${imagePath}`, // Full URL
      `${window.location.origin}${encodeURI(imagePath)}`, // Full URL encoded
    ];
    
    let lastError = null;
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    
    // If all paths fail, log and return null
    console.warn('Logo not found at any path:', paths);
    return null;
  } catch (err) {
    console.error('Error converting image to base64:', err);
    return null;
  }
}

