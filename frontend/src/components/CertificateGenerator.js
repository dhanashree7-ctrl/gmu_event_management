import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import theme from '../theme';

const CertificateGenerator = forwardRef((props, ref) => {
  const certificateRef = useRef(null);
  
  const [data, setData] = useState({
    studentName: 'Student Name',
    eventTitle: 'Event Title',
    eventDate: 'Date'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useImperativeHandle(ref, () => ({
    generateCertificate: async (studentName, eventTitle, eventDate) => {
      // Set the dynamic data
      setData({ studentName, eventTitle, eventDate });
      
      // We need a small delay to ensure React has flushed the new state to the DOM
      // before html2canvas takes the snapshot
      setIsGenerating(true);
      
      setTimeout(async () => {
        try {
          const element = certificateRef.current;
          if (!element) return;

          // html2canvas configuration for high quality
          const canvas = await html2canvas(element, {
            scale: 2, // 2x scale for better resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          
          // PDF dimensions for A4 landscape
          // A4 width: 297mm, height: 210mm
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });

          // Add image to PDF
          pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
          
          // Download
          const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          pdf.save(`Certificate-${safeTitle}.pdf`);
          
        } catch (error) {
          console.error("Error generating certificate:", error);
          alert("Failed to generate certificate. Please try again.");
        } finally {
          setIsGenerating(false);
        }
      }, 500); // 500ms delay to allow DOM update
    }
  }));

  // The hidden container wrapping the certificate
  const containerStyle = {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    width: '1122px', // Approx 297mm in pixels at 96dpi
    height: '793px', // Approx 210mm in pixels at 96dpi
    backgroundColor: '#fff',
    overflow: 'hidden',
    zIndex: -9999
  };

  // Certificate styling (premium look)
  const certStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    padding: '40px',
    backgroundColor: '#fff',
    fontFamily: '"Montserrat", "Inter", sans-serif',
    color: '#333'
  };

  const innerBorder = {
    position: 'relative',
    width: '100%',
    height: '100%',
    border: `8px solid ${theme.colors.maroon}`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(253,245,230,0.4) 100%)',
    overflow: 'hidden'
  };

  // Decorative corner accents
  const cornerTopLeft = {
    position: 'absolute',
    top: 0, left: 0,
    width: '150px', height: '150px',
    borderTop: `12px solid ${theme.colors.gold}`,
    borderLeft: `12px solid ${theme.colors.gold}`,
  };

  const cornerBottomRight = {
    position: 'absolute',
    bottom: 0, right: 0,
    width: '150px', height: '150px',
    borderBottom: `12px solid ${theme.colors.gold}`,
    borderRight: `12px solid ${theme.colors.gold}`,
  };

  return (
    <div style={containerStyle}>
      <div ref={certificateRef} style={certStyle}>
        <div style={innerBorder}>
          <div style={cornerTopLeft}></div>
          <div style={cornerBottomRight}></div>

          {/* Crest / Logo Placeholder */}
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            color: theme.colors.maroon
          }}>
            ⚜
          </div>

          <h2 style={{
            margin: 0,
            fontSize: '1.8rem',
            color: '#555',
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
          }}>
            GM University
          </h2>

          <h1 style={{
            margin: '2rem 0',
            fontSize: '4.5rem',
            fontWeight: 800,
            color: theme.colors.maroon,
            fontFamily: '"Playfair Display", serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            Certificate of Participation
          </h1>

          <p style={{
            fontSize: '1.4rem',
            color: '#666',
            marginBottom: '1.5rem',
            fontStyle: 'italic'
          }}>
            This is proudly presented to
          </p>

          <div style={{
            fontSize: '3.5rem',
            fontWeight: 700,
            color: theme.colors.primary,
            borderBottom: `3px solid ${theme.colors.gold}`,
            paddingBottom: '0.5rem',
            marginBottom: '2rem',
            minWidth: '500px',
            textAlign: 'center'
          }}>
            {data.studentName}
          </div>

          <p style={{
            fontSize: '1.3rem',
            color: '#666',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '3rem'
          }}>
            for actively participating and successfully completing the event
            <br />
            <strong style={{ fontSize: '1.8rem', color: '#333', display: 'block', marginTop: '1rem' }}>
              {data.eventTitle}
            </strong>
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 80px',
            marginTop: 'auto',
            boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, borderBottom: '2px solid #333', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                {data.eventDate}
              </div>
              <div style={{ fontSize: '1.1rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, borderBottom: '2px solid #333', paddingBottom: '0.5rem', marginBottom: '0.5rem', minWidth: '200px' }}>
                <span style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '2rem' }}>GMU Official</span>
              </div>
              <div style={{ fontSize: '1.1rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateGenerator;
