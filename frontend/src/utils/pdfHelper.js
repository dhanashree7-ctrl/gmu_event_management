
export const addLogoToPdf = (doc) => {
  return new Promise((resolve) => {
    // We use a base64 encoded PNG or draw an inline SVG to the canvas.
    // For simplicity and reliability, we'll draw "GMU" text on a maroon background 
    // to simulate the logo directly onto a canvas, then export to PNG Data URL.
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      
      // Draw background
      ctx.fillStyle = '#701a1e';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(0, 0, 120, 50, 8) : ctx.fillRect(0, 0, 120, 50);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#FDD06F';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('GMU', 25, 35);
      
      const dataURL = canvas.toDataURL('image/png');
      
      // Add image to jsPDF doc (x, y, width, height)
      doc.addImage(dataURL, 'PNG', 14, 5, 30, 12.5);
    } catch (err) {
      console.error('Failed to generate logo for PDF', err);
    }
    
    resolve(doc);
  });
};
