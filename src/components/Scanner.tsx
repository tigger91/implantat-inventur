import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useInventoryStore } from '../stores/inventoryStore';
import { parseGS1DataMatrix, isExpired, expiresSoon, formatExpiryDate } from '../utils/gs1Parser';
import { ScanResult } from '../types';

type OverlayType = 'success' | 'error' | 'warning' | null;

interface OverlayData {
  type: OverlayType;
  title: string;
  message: string;
  scanResult?: ScanResult;
  articleData?: {
    bezeichnung: string;
    ref: string;
    lot: string;
    ist: number;
    soll: number;
  };
}

export default function Scanner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayData | null>(null);
  
  const { 
    findArticle, 
    incrementArticleScan, 
    flashlightOn, 
    toggleFlashlight,
    addToScanHistory 
  } = useInventoryStore();

  useEffect(() => {
    initializeScanner();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (flashlightOn && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if ('torch' in capabilities) {
        track.applyConstraints({
          // @ts-ignore - torch is not in standard types yet
          advanced: [{ torch: true }]
        }).catch(err => console.error('Error enabling torch:', err));
      }
    } else if (!flashlightOn && streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      track.applyConstraints({
        // @ts-ignore
        advanced: [{ torch: false }]
      }).catch(err => console.error('Error disabling torch:', err));
    }
  }, [flashlightOn]);

  const initializeScanner = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize barcode reader
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setIsReady(true);
      startScanning();
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('Kamerazugriff verweigert. Bitte aktivieren Sie die Kamera in den iOS-Einstellungen.');
    }
  };

  const startScanning = () => {
    if (!readerRef.current || !videoRef.current) return;

    const scanInterval = setInterval(async () => {
      if (!videoRef.current || !isReady || overlay) return;

      try {
        const result = await readerRef.current!.decodeFromVideoElement(videoRef.current);
        
        if (result) {
          handleScan(result.getText());
          clearInterval(scanInterval);
        }
      } catch (err) {
        if (!(err instanceof NotFoundException)) {
          console.error('Scan error:', err);
        }
      }
    }, 300); // Scan every 300ms

    return () => clearInterval(scanInterval);
  };

  const handleScan = async (rawData: string) => {
    try {
      // Vibrate on scan
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }

      // Play success sound
      playBeep();

      // Parse GS1 DataMatrix
      const scanResult = parseGS1DataMatrix(rawData);
      
      if (!scanResult) {
        showOverlay({
          type: 'error',
          title: '❌ SCANFEHLER',
          message: 'DataMatrix-Code konnte nicht gelesen werden. Bitte erneut versuchen.',
        });
        return;
      }

      // Find article by LOT or REF
      const article = findArticle(scanResult.lot, scanResult.ref);

      if (!article) {
        showOverlay({
          type: 'error',
          title: '❌ ARTIKEL NICHT GEFUNDEN',
          message: 'Artikel nicht in Liste!',
          scanResult
        });
        return;
      }

      // Increment scan count
      await incrementArticleScan(article.id!);

      // Add to scan history
      await addToScanHistory({
        inventoryId: 1, // TODO: Use actual inventory ID
        articleId: article.id!,
        timestamp: new Date(),
        scanData: scanResult
      });

      // Check for warnings
      const warnings: string[] = [];
      
      // Expiry check
      if (scanResult.expiryDate) {
        if (isExpired(scanResult.expiryDate)) {
          warnings.push(`⚠️ ABGELAUFEN: ${formatExpiryDate(scanResult.expiryDate)}`);
        } else if (expiresSoon(scanResult.expiryDate)) {
          warnings.push(`🟡 Läuft bald ab: ${formatExpiryDate(scanResult.expiryDate)}`);
        }
      }

      // Overstock check
      const newIst = article.istScan + 1;
      let overlayType: OverlayType = 'success';
      let title = '✅ ARTIKEL GEFUNDEN';
      
      if (newIst > article.soll) {
        overlayType = 'warning';
        title = '⚠️ SOLL ÜBERSCHRITTEN';
        warnings.push(`ACHTUNG: SOLL bereits überschritten!`);
        if ('vibrate' in navigator) {
          navigator.vibrate(300);
        }
      }

      showOverlay({
        type: overlayType,
        title,
        message: warnings.join('\n'),
        articleData: {
          bezeichnung: article.materialbezeichnung,
          ref: article.materialnummer,
          lot: article.charge,
          ist: newIst,
          soll: article.soll
        },
        scanResult
      });

    } catch (error) {
      console.error('Error handling scan:', error);
      showOverlay({
        type: 'error',
        title: '❌ FEHLER',
        message: 'Fehler beim Verarbeiten des Scans'
      });
    }
  };

  const showOverlay = (data: OverlayData) => {
    setOverlay(data);
    setTimeout(() => {
      setOverlay(null);
      if (isReady) {
        startScanning();
      }
    }, 3000);
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const cleanup = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleBack = () => {
    cleanup();
    navigate('/dashboard');
  };

  const handleManualEntry = () => {
    // TODO: Implement manual entry
    alert('Manuelle Eingabe wird noch implementiert');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-xl font-bold mb-4">Kamerazugriff nicht möglich</h2>
        <p className="text-gray-300 text-center mb-6">{error}</p>
        <button
          onClick={handleBack}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold"
        >
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Video Preview */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scan Frame Overlay */}
      {!overlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-white rounded-lg opacity-50" />
        </div>
      )}

      {/* Instructions */}
      {!overlay && (
        <div className="absolute bottom-32 left-0 right-0 text-center text-white">
          <p className="text-lg font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg inline-block">
            DataMatrix-Code hier platzieren
          </p>
        </div>
      )}

      {/* Scan Result Overlay */}
      {overlay && (
        <div 
          className={`absolute inset-0 flex items-center justify-center p-6 ${
            overlay.type === 'success' ? 'bg-success' :
            overlay.type === 'error' ? 'bg-error' :
            'bg-warning'
          } bg-opacity-95`}
        >
          <div className="text-white text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">{overlay.title}</h2>
            
            {overlay.articleData && (
              <div className="space-y-3">
                <p className="text-xl font-semibold">
                  {overlay.articleData.bezeichnung}
                </p>
                
                <div className="text-lg space-y-1">
                  <p>REF: {overlay.articleData.ref}</p>
                  <p>LOT: {overlay.articleData.lot}</p>
                </div>
                
                <div className="bg-white bg-opacity-20 rounded-lg p-4 mt-4">
                  <div className="flex justify-center items-center space-x-6 text-2xl font-bold">
                    <div>
                      <div className="text-sm font-normal mb-1">IST</div>
                      <div>{overlay.articleData.ist}</div>
                    </div>
                    <div className="text-4xl">/</div>
                    <div>
                      <div className="text-sm font-normal mb-1">SOLL</div>
                      <div>{overlay.articleData.soll}</div>
                    </div>
                    <div className="text-4xl">
                      {overlay.articleData.ist >= overlay.articleData.soll ? '✓' : '○'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {overlay.message && (
              <p className="text-lg mt-4 whitespace-pre-line">{overlay.message}</p>
            )}
            
            {overlay.scanResult && !overlay.articleData && (
              <div className="mt-4 text-sm bg-white bg-opacity-20 rounded-lg p-3">
                <p>REF: {overlay.scanResult.ref || 'N/A'}</p>
                <p>LOT: {overlay.scanResult.lot || 'N/A'}</p>
                <p>GTIN: {overlay.scanResult.gtin || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center pt-safe-top">
        <button
          onClick={handleBack}
          className="bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Bottom Action Buttons */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pb-safe-bottom">
        <button
          onClick={handleManualEntry}
          className="bg-black bg-opacity-50 text-white px-6 py-3 rounded-full hover:bg-opacity-70 transition-colors flex items-center space-x-2"
        >
          <span className="text-xl">⌨️</span>
          <span className="font-semibold">Manual</span>
        </button>
        
        <button
          onClick={toggleFlashlight}
          className={`px-6 py-3 rounded-full hover:bg-opacity-70 transition-colors flex items-center space-x-2 ${
            flashlightOn 
              ? 'bg-warning text-black' 
              : 'bg-black bg-opacity-50 text-white'
          }`}
        >
          <span className="text-xl">🔦</span>
          <span className="font-semibold">Licht</span>
        </button>
      </div>
    </div>
  );
}
