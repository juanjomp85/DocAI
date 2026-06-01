import React, { useState } from 'react';

export default function DocumentVault({ folders, documents, onDeleteDocument, onShowNotification }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [expandedReasoning, setExpandedReasoning] = useState({});

  // Alterna expansión de carpeta
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Alterna visualización del razonamiento IA del documento
  const toggleReasoning = (docId, e) => {
    e.stopPropagation();
    setExpandedReasoning(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  // Acción de descarga real desde el backend
  const handleDownload = (doc, e) => {
    e.stopPropagation();
    const fileUrl = `/api/files/${doc.assignedFolderId}/${doc.originalName}`;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = doc.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    onShowNotification(`Descargando copia física de: ${doc.originalName}`);
  };

  // Apertura de archivo física en pestaña nativa del navegador
  const handleView = (doc, e) => {
    e.stopPropagation();
    const fileUrl = `/api/files/${doc.assignedFolderId}/${doc.originalName}`;
    window.open(fileUrl, '_blank');
    onShowNotification(`Visualizando archivo: ${doc.originalName}`);
  };

  // Filtrado de documentos
  const filteredDocs = documents.filter(doc => {
    const q = searchQuery.toLowerCase();
    const folder = folders.find(f => f.id === doc.assignedFolderId);
    return (
      doc.originalName.toLowerCase().includes(q) ||
      doc.tags.some(tag => tag.toLowerCase().includes(q)) ||
      (folder && folder.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="glass-card">
      <div className="vault-header">
        <div>
          <h2 className="card-title">Bóveda de Documentos Clasificados</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Explora e interactúa con tus documentos organizados de forma autónoma por la IA.
          </p>
        </div>

        {/* Buscador inteligente */}
        <div className="search-input-wrapper">
          <svg className="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por nombre, etiquetas o carpeta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-folder-msg" style={{ padding: '60px 0' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" style={{ width: '48px', height: '48px', color: 'var(--text-dark)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0121.75 21H2.25A2.25 2.25 0 010 18.75v-4.5A2.25 2.25 0 012.25 13.5zm0-9h18A2.25 2.25 0 0122.5 6.75v4.5A2.25 2.25 0 0120.25 13.5H3.75A2.25 2.25 0 011.5 11.25v-4.5A2.25 2.25 0 013.75 4.5z" />
          </svg>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Bóveda documental vacía</span>
          <span style={{ fontSize: '13px', maxWidth: '300px' }}>Arrastra un archivo en la sección de carga superior para iniciar la clasificación con inteligencia artificial.</span>
        </div>
      ) : (
        <div className="vault-accordion">
          {folders.map(folder => {
            // Filtrar documentos pertenecientes a esta carpeta
            const folderDocs = filteredDocs.filter(doc => doc.assignedFolderId === folder.id);
            const isExpanded = expandedFolders[folder.id] || searchQuery.length > 0; // Se expande automáticamente al buscar

            return (
              <div 
                key={folder.id} 
                className={`vault-folder-group ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Cabecera del acordeón */}
                <div 
                  className="vault-folder-header"
                  onClick={() => toggleFolder(folder.id)}
                  style={{ borderLeft: `4px solid ${folder.color}` }}
                >
                  <div className="vault-folder-info">
                    <div 
                      className="folder-indicator-icon" 
                      style={{ 
                        backgroundColor: `${folder.color}15`, 
                        color: folder.color,
                        border: `1px solid ${folder.color}25`
                      }}
                    >
                      {folder.icon}
                    </div>
                    <div>
                      <div className="vault-folder-title">{folder.name}</div>
                      <div className="vault-folder-description">{folder.description}</div>
                    </div>
                  </div>

                  <div className="vault-folder-meta" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ 
                        padding: '4px 10px', 
                        fontSize: '11px', 
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'white',
                        marginRight: '8px'
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch('/api/system/open-folder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ folderId: folder.id })
                          });
                          if (res.ok) {
                            onShowNotification(`Abriendo carpeta "${folder.name}" en Finder`);
                          } else {
                            onShowNotification(`No se pudo abrir en Finder`);
                          }
                        } catch (err) {
                          console.error(err);
                          onShowNotification(`Error al abrir Finder`);
                        }
                      }}
                      title="Abrir directorio real en Finder de macOS"
                    >
                      <span>📂 Finder</span>
                    </button>

                    <span className="folder-badge" style={{ backgroundColor: `${folder.color}25`, color: '#fff' }}>
                      {folderDocs.length} {folderDocs.length === 1 ? 'archivo' : 'archivos'}
                    </span>
                    <svg className="chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={() => toggleFolder(folder.id)}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Contenido desplegable */}
                {isExpanded && (
                  <div className="vault-folder-content">
                    {folderDocs.length === 0 ? (
                      <div className="empty-folder-msg">
                        <span>No hay documentos archivados en {folder.name}</span>
                      </div>
                    ) : (
                      folderDocs.map(doc => {
                        const isReasoningOpen = expandedReasoning[doc.id];
                        return (
                          <div key={doc.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="doc-list-row">
                              <div className="doc-icon">📄</div>
                              <div className="doc-details">
                                <span className="doc-name">{doc.originalName}</span>
                                <div className="doc-subtitle-row">
                                  <span>{doc.size}</span>
                                  <span className="bullet-separator">•</span>
                                  <span className="doc-date">Procesado a las {doc.analyzedAt}</span>
                                  <span className="bullet-separator">•</span>
                                  <span className="doc-ai-badge">IA Criterio</span>
                                  {doc.userOverridden && (
                                    <span className="doc-ai-badge" style={{ background: 'var(--color-warning-bg)', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--color-warning)' }}>
                                      Corregido por usuario
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="doc-actions">
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px' }}
                                  onClick={(e) => toggleReasoning(doc.id, e)}
                                >
                                  {isReasoningOpen ? 'Ocultar Análisis' : 'Explicación IA'}
                                </button>
                                <button 
                                  className="doc-action-btn"
                                  onClick={(e) => handleView(doc, e)}
                                  title="Ver archivo"
                                >
                                  👁️
                                </button>
                                <button 
                                  className="doc-action-btn"
                                  onClick={(e) => handleDownload(doc, e)}
                                  title="Descargar copia"
                                >
                                  ⬇️
                                </button>
                                <button 
                                  className="doc-action-btn delete-file"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDocument(doc.id);
                                  }}
                                  title="Eliminar de la bóveda"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Detalle expandido del razonamiento IA */}
                            {isReasoningOpen && (
                              <div className="doc-explanation-card" style={{ borderLeftColor: folder.color }}>
                                <div style={{ fontWeight: 600, color: 'white', marginBottom: '6px', fontSize: '12.5px' }}>
                                  Análisis Semántico y Justificación:
                                </div>
                                <div 
                                  style={{ marginBottom: '10px' }} 
                                  dangerouslySetInnerHTML={{ __html: doc.reasoning }} 
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                  {doc.tags.map((tag, idx) => (
                                    <span 
                                      key={idx} 
                                      className="tag" 
                                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', fontSize: '10.5px' }}
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
