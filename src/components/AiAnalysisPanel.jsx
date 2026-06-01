import React, { useState, useEffect } from 'react';

export default function AiAnalysisPanel({ analysisResult, folders, onConfirm, onCancel }) {
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  // Cada vez que cambia el resultado del análisis, reseteamos el estado local
  useEffect(() => {
    if (analysisResult) {
      setSelectedFolderId(analysisResult.proposedFolderId);
      setIsOverriding(false);
    }
  }, [analysisResult]);

  if (!analysisResult) return null;

  const { originalName, size, reasoning, tags, summary, confidence } = analysisResult;

  // Encontrar carpeta propuesta actual
  const proposedFolder = folders.find(f => f.id === analysisResult.proposedFolderId) || folders[0];
  const activeFolder = folders.find(f => f.id === selectedFolderId) || proposedFolder;

  // Color dinámico de confianza
  let confidenceColor = '#60a5fa'; // Blue
  if (confidence > 85) confidenceColor = '#10b981'; // Green
  else if (confidence < 60) confidenceColor = '#f59e0b'; // Orange

  const handleConfirmPlacement = () => {
    // Si el usuario reasignó la carpeta manualmente, actualizamos el folderId y la confianza a 100% (confirmación del usuario)
    const finalizedResult = {
      ...analysisResult,
      assignedFolderId: selectedFolderId,
      userOverridden: selectedFolderId !== analysisResult.proposedFolderId,
      confidence: selectedFolderId !== analysisResult.proposedFolderId ? 100 : confidence
    };
    onConfirm(finalizedResult);
  };

  return (
    <div className="glass-card" style={{ borderLeft: `5px solid ${confidenceColor}` }}>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <h2 className="card-title">Resultado de Inspección por IA</h2>
        <button 
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dark)',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Descartar
        </button>
      </div>

      <div className="ai-result-grid">
        {/* Metadatos del archivo */}
        <div className="result-card">
          <div className="file-info-row">
            <div className="file-type-icon" style={{ borderColor: activeFolder.color, color: activeFolder.color }}>
              📄
            </div>
            <div className="file-meta">
              <span className="file-name" title={originalName}>{originalName}</span>
              <span className="file-size">{size} • Extensión: .{analysisResult.extension.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Clasificación de la IA */}
        <div 
          className="classification-banner" 
          style={{ 
            background: `${activeFolder.color}12`,
            borderColor: `${activeFolder.color}35`
          }}
        >
          <div className="classification-label">
            <span className="label-title">
              {isOverriding ? 'Ubicación seleccionada' : 'Ubicación propuesta por IA'}
            </span>
            <span className="folder-target" style={{ color: activeFolder.color }}>
              {activeFolder.icon} {activeFolder.name}
            </span>
          </div>
          <div className="confidence-score">
            <span className="score-value" style={{ color: confidenceColor }}>
              {isOverriding ? '100%' : `${confidence}%`}
            </span>
            <div className="score-text">Nivel de Confianza</div>
          </div>
        </div>

        {/* Resumen semántico */}
        {summary && (
          <div className="result-card" style={{ background: 'transparent', padding: '0 8px' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Resumen del Contenido
            </h4>
            <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Explicación de la IA */}
        <div className="ai-reasoning" style={{ borderLeftColor: activeFolder.color }}>
          <h4>Razonamiento de Ubicación</h4>
          <p dangerouslySetInnerHTML={{ __html: reasoning }} />
          
          {/* Etiquetas extraídas */}
          <div className="tag-list">
            {tags.map((tag, idx) => (
              <span key={idx} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Override manual */}
        {isOverriding ? (
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label>Reasignar carpeta de destino:</label>
            <select 
              className="form-control"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              style={{ background: '#131524' }}
            >
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.icon} {folder.name} ({folder.description.substring(0, 50)}...)
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Botones de acción */}
        <div className="btn-actions-row">
          <button className="btn btn-primary" onClick={handleConfirmPlacement}>
            Confirmar y Archivar
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsOverriding(!isOverriding)}
          >
            {isOverriding ? 'Cancelar Reasignación' : 'Cambiar Carpeta'}
          </button>
        </div>
      </div>
    </div>
  );
}
