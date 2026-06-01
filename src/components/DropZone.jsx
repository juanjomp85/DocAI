import React, { useState, useRef } from 'react';
import { analyzeDocument } from '../services/aiEngine';

export default function DropZone({ folders, documents = [], onAnalysisComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Manejo de drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Procesamiento con fases animadas para el "espectáculo de IA"
  const processFile = async (file) => {
    setIsScanning(true);
    setScanProgress(10);
    setScanPhase('Leyendo archivo y metadatos...');

    // Animación de la barra de progreso
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        // Variación aleatoria para que parezca real
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    // Cambiar fases dinámicamente
    setTimeout(() => {
      setScanPhase('Invocando motor semántico de IA...');
    }, 600);

    setTimeout(() => {
      setScanPhase('Calculando nivel de coincidencia de carpetas...');
    }, 1200);

    try {
      const result = await analyzeDocument(file, folders, documents);
      clearInterval(progressInterval);
      setScanProgress(100);
      setScanPhase('¡Análisis completado con éxito!');

      setTimeout(() => {
        setIsScanning(false);
        onAnalysisComplete({ ...result, fileObject: file });
      }, 300);
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      setIsScanning(false);
      alert('Error en el escaneo del archivo.');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '32px' }}>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <h2 className="card-title">Carga Documental Inteligente</h2>
      </div>
      
      <div 
        className={`dropzone-container ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="file-input" 
          multiple={false}
          onChange={handleChange}
        />

        {/* Línea de escaneo láser (sólo visible durante escaneo) */}
        {isScanning && <div className="scan-line" />}

        {/* Estado normal */}
        {!isScanning && (
          <>
            <div className="drop-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3 className="dropzone-title">Arrastra tu archivo aquí</h3>
            <p className="dropzone-desc">
              Soporta PDF, DOCX, TXT, Excel, imágenes u otros formatos. La IA lo inspeccionará y propondrá su ubicación ideal.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: '20px', pointerEvents: 'none' }}>
              o examinar archivos locales
            </button>
          </>
        )}

        {/* Pantalla de escaneo IA */}
        {isScanning && (
          <div className="scanning-overlay">
            <div className="spinner" />
            <div className="scan-phase-text">{scanPhase}</div>
            <div className="scan-progress-bar">
              <div 
                className="scan-progress-fill" 
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div style={{ color: 'var(--text-dark)', fontSize: '12px' }}>
              Analizando vectores semánticos...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
