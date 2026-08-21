import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { API_BASE } from "../config/api";
import theme from "../theme";

export default function QRScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("camera"); // 'camera' or 'upload'
  const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, student_name: string, event_title: string }
  const [isScanning, setIsScanning] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Event selection state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    // Fetch published events on mount
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_published_events.php`);
        const json = await res.json();
        if (json.success) {
          // Filter to show only events happening today, or all published events
          // For safety, let's just show all published events
          setEvents(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load events for scanner", err);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    // Only initialize scanner if we are actively scanning
    if (!isScanning) return;

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    const onScanSuccess = async (decodedText) => {
      // Pause scanning immediately once we get a result to prevent duplicate api calls
      if (processing) return;
      
      scanner.clear();
      setIsScanning(false);
      setProcessing(true);
      await processQRCode(decodedText);
    };

    const onScanFailure = (error) => {
      // Handle parse errors (can be ignored as they happen continuously until a qr code is found)
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup when component unmounts
    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [isScanning, processing, activeTab]);

  const processQRCode = async (decodedText) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/process_checkin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: decodedText, event_id: selectedEventId }),
      });
      const json = await res.json();
      
      if (json.success) {
        setScanResult({
          success: true,
          message: json.message || `Check-In Successful`,
          student_name: json.student_name,
          event_title: json.event_title
        });
      } else {
        setScanResult({
          success: false,
          message: json.message
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: "Network error. Please try again."
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanResult(null);
    setProcessing(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      await processQRCode(decodedText);
    } catch (err) {
      setScanResult({
        success: false,
        message: "Could not read QR code from image."
      });
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    if (activeTab === 'camera') {
      setIsScanning(true);
    } else {
      setIsScanning(false);
      // clear the file input so they can upload the same file again if they want
      const fileInput = document.getElementById('qr-upload-input');
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.header}>Event Check-In Scanner</h2>
        <button 
          style={styles.closeBtn} 
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              window.close();
            }
          }}
        >
           Close Scanner
        </button>
      </div>
      
      {!scanResult && !processing && (
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
            Select Event to Scan For <span style={{ color: '#C62828' }}>*</span>
          </label>
          <select 
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              // reset scanner when switching events
              setIsScanning(false);
              setActiveTab('camera');
            }}
            style={{
              width: '100%', padding: '10px 15px', borderRadius: '8px',
              border: '2px solid #ddd', fontSize: '1rem', outline: 'none'
            }}
          >
            <option value="">-- Choose an Event --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.event_title} ({ev.date})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {!scanResult && !processing && selectedEventId && (
        <div style={styles.tabContainer}>
          <button 
            style={s(styles.tabBtn, activeTab === 'camera' && styles.tabActive)} 
            onClick={() => { setActiveTab('camera'); setIsScanning(true); }}
          >
            Live Camera
          </button>
          <button 
            style={s(styles.tabBtn, activeTab === 'upload' && styles.tabActive)} 
            onClick={() => { setActiveTab('upload'); setIsScanning(false); }}
          >
            Upload QR Image
          </button>
        </div>
      )}

      {activeTab === 'camera' && isScanning && !scanResult && !processing && (
        <div style={styles.scannerContainer}>
          <div id="qr-reader" style={styles.reader}></div>
          <p style={styles.instructions}>Point camera at the student's digital ticket.</p>
        </div>
      )}

      {activeTab === 'upload' && !scanResult && !processing && (
        <div style={styles.uploadContainer}>
          <p style={styles.instructions}>Upload a screenshot of the QR digital ticket.</p>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload}
            style={styles.fileInput}
            id="qr-upload-input"
          />
          <label htmlFor="qr-upload-input" style={styles.uploadLabel}>
            Choose Image
          </label>
        </div>
      )}

      {/* Hidden element must always be in DOM so html5-qrcode can use it */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>

      {processing && (
        <div style={styles.feedbackContainer}>
          <div style={styles.spinner}></div>
          <h3 style={styles.processingText}>Processing Ticket...</h3>
        </div>
      )}

      {scanResult && !processing && (
        <div style={scanResult.success ? styles.successBox : styles.errorBox}>
          <div style={styles.icon}>{scanResult.success ? "" : ""}</div>
          <h1 style={styles.mainMessage}>{scanResult.message}</h1>
          {scanResult.student_name && (
            <h2 style={styles.subMessage}>{scanResult.student_name}</h2>
          )}
          {scanResult.event_title && (
            <p style={styles.eventMessage}>{scanResult.event_title}</p>
          )}
          
          <button style={styles.nextButton} onClick={resetScanner}>
            Scan Next Ticket
          </button>
        </div>
      )}
    </div>
  );
}

// ── Utility ──────────────────────────────────────────────────────────────────// --- Styles ---
const s = (...styles) => Object.assign({}, ...styles);

const styles = {
  container: {
    minHeight: "100vh",
    background: "#121212",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 1rem",
    fontFamily: "'Inter', sans-serif",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: "400px",
    marginBottom: "1rem"
  },
  header: {
    color: "#FFFFFF",
    fontSize: "1.75rem",
    fontWeight: "600",
    margin: 0,
    textShadow: "0 2px 4px rgba(0,0,0,0.3)"
  },
  closeBtn: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    transition: "background 0.2s"
  },
  tabContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    background: '#fff',
    padding: '0.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: theme.colors.midGray,
    transition: '0.2s',
    fontSize: '0.9rem'
  },
  tabActive: {
    background: theme.colors.maroon,
    color: theme.colors.gold
  },
  scannerContainer: {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    padding: "1rem",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  reader: {
    width: "100%",
    borderRadius: "12px",
    overflow: "hidden"
  },
  uploadContainer: {
    width: "100%",
    maxWidth: "400px",
    background: "#fff",
    padding: "3rem 2rem",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },
  fileInput: {
    display: "none"
  },
  uploadLabel: {
    marginTop: "1.5rem",
    background: theme.colors.maroon,
    color: theme.colors.gold,
    padding: "0.8rem 2rem",
    borderRadius: "24px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "inline-block",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.1s"
  },
  instructions: {
    marginTop: "1.5rem",
    color: theme.colors.midGray,
    fontSize: "1rem",
    textAlign: "center"
  },
  feedbackContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    width: "100%",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "5px solid rgba(0,0,0,0.1)",
    borderTop: `5px solid ${theme.colors.maroon}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "2rem"
  },
  processingText: {
    color: theme.colors.charcoal,
    fontSize: "1.25rem",
  },
  successBox: {
    width: "100%",
    maxWidth: "400px",
    background: "#E8F5E9",
    border: "2px solid #4CAF50",
    borderRadius: "16px",
    padding: "3rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(76, 175, 80, 0.2)",
    animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  errorBox: {
    width: "100%",
    maxWidth: "400px",
    background: "#FFEBEE",
    border: "2px solid #F44336",
    borderRadius: "16px",
    padding: "3rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 10px 25px rgba(244, 67, 54, 0.2)",
    animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  icon: {
    fontSize: "4rem",
    marginBottom: "1rem"
  },
  mainMessage: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: "0.5rem"
  },
  subMessage: {
    fontSize: "1.75rem",
    fontWeight: "800",
    textAlign: "center",
    color: "#111",
    marginBottom: "0.5rem"
  },
  eventMessage: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
    marginBottom: "2.5rem"
  },
  nextButton: {
    background: theme.colors.maroon,
    color: theme.colors.gold,
    border: "none",
    borderRadius: "30px",
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    marginTop: "auto"
  }
};
