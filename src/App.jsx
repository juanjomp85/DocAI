import React, { useState } from 'react';
import FolderConfig from './components/FolderConfig';
import DropZone from './components/DropZone';
import AiAnalysisPanel from './components/AiAnalysisPanel';
import DocumentVault from './components/DocumentVault';

// Carpetas prestablecidas iniciales (Plantilla Empresa)
const INITIAL_FOLDERS = [
  {
    id: 'finanzas',
    name: 'Finanzas y Recibos',
    description: 'Facturas de proveedores, recibos de compras, gastos de representación, impuestos de IVA/IRPF, presupuestos aprobados y balances contables.',
    icon: '💼',
    color: '#f59e0b'
  },
  {
    id: 'legal',
    name: 'Legal y Contratos',
    description: 'Contratos comerciales, acuerdos de confidencialidad (NDA), términos de servicio, escrituras de constitución y documentos notariales de validez jurídica.',
    icon: '⚖️',
    color: '#a855f7'
  },
  {
    id: 'recursos_humanos',
    name: 'Recursos Humanos',
    description: 'Curriculums de candidatos, nóminas salariales de la plantilla, contratos de trabajo firmados, justificantes médicos y cartas de recomendación.',
    icon: '📄',
    color: '#f43f5e'
  },
  {
    id: 'soporte_tecnico',
    name: 'Manuales y Soporte',
    description: 'Documentación técnica de arquitectura web, guías rápidas de usuario, tutoriales instructivos, guías de servidores e instructivos de mantenimiento.',
    icon: '⚙️',
    color: '#10b981'
  }
];

// Documentos precargados para ilustrar la funcionalidad inmediatamente
const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    originalName: 'factura_mensual_servidores_aws_mayo.pdf',
    size: '184.2 KB',
    type: 'application/pdf',
    extension: 'pdf',
    assignedFolderId: 'finanzas',
    confidence: 96,
    reasoning: 'La IA ha catalogado este documento con alta confianza (96%) al identificar el término "factura" en el nombre del archivo y la extensión PDF, asociándolo inequívocamente con el procesamiento y control de gastos de servidores de Amazon Web Services.',
    summary: 'Documento contable de Amazon Web Services que detalla el cargo mensual de cómputo en la nube e instancias EC2 correspondiente a Mayo de 2026.',
    tags: ['PDF', 'Factura', 'AWS', 'Mayo', 'Servidores'],
    analyzedAt: '10:42',
    userOverridden: false
  },
  {
    id: 'doc-2',
    originalName: 'contrato_confidencialidad_nda_gemini.docx',
    size: '42.5 KB',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
    assignedFolderId: 'legal',
    confidence: 98,
    reasoning: 'Ubicado en la sección Legal por concordancia directa del acrónimo "nda" (Non-Disclosure Agreement) y el término explícito "contrato" en el título. Coincide exactamente con la descripción de compromisos de confidencialidad.',
    summary: 'Acuerdo de confidencialidad recíproco redactado en formato Word que ampara la protección de secretos comerciales y transferencia tecnológica de modelos IA.',
    tags: ['DOCX', 'Contrato', 'NDA', 'Confidencialidad', 'Gemini'],
    analyzedAt: '11:15',
    userOverridden: false
  },
  {
    id: 'doc-3',
    originalName: 'cv_desarrollador_senior_react.pdf',
    size: '1.2 MB',
    type: 'application/pdf',
    extension: 'pdf',
    assignedFolderId: 'recursos_humanos',
    confidence: 94,
    reasoning: 'La IA analizó el nombre e identificó el prefijo "cv" (Curriculum Vitae) y el perfil profesional "desarrollador". El contenido califica para la evaluación interna de talento del departamento de Recursos Humanos.',
    summary: 'Hoja de vida profesional de un Ingeniero de Software especializado en el ecosistema React, TypeScript y diseño arquitectónico CSS avanzado.',
    tags: ['PDF', 'CV', 'Desarrollador', 'React', 'Senior'],
    analyzedAt: '12:01',
    userOverridden: false
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'folders'
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  
  // Sistema de notificaciones
  const [notification, setNotification] = useState('');

  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification('');
    }, 4000);
  };

  // Gestión de carpetas
  const handleAddFolder = (newFolder) => {
    const id = newFolder.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    // Evitar ID duplicado
    const exists = folders.some(f => f.id === id);
    const finalId = exists ? `${id}_${Date.now()}` : id;

    setFolders([...folders, { id: finalId, ...newFolder }]);
    triggerNotification(`Nueva carpeta "${newFolder.name}" configurada con éxito.`);
  };

  const handleUpdateFolder = (id, updatedFolder) => {
    setFolders(folders.map(f => f.id === id ? { ...f, ...updatedFolder } : f));
    triggerNotification(`Carpeta "${updatedFolder.name}" actualizada correctamente.`);
  };

  const handleDeleteFolder = (id) => {
    const folderName = folders.find(f => f.id === id)?.name;
    // Filtrar carpeta eliminada
    setFolders(folders.filter(f => f.id !== id));
    
    // Mover los documentos de la carpeta eliminada a la primera carpeta disponible
    const fallbackFolderId = folders.find(f => f.id !== id)?.id || '';
    if (fallbackFolderId) {
      setDocuments(documents.map(doc => 
        doc.assignedFolderId === id ? { ...doc, assignedFolderId: fallbackFolderId } : doc
      ));
    } else {
      setDocuments(documents.filter(doc => doc.assignedFolderId !== id));
    }
    
    triggerNotification(`Carpeta "${folderName}" eliminada.`);
  };

  // Cargar plantillas de carpetas prediseñadas
  const handleLoadTemplate = (type) => {
    let preset = [];
    if (type === 'empresa') {
      preset = INITIAL_FOLDERS;
    } else if (type === 'autonomo') {
      preset = [
        { id: 'facturas_clientes', name: 'Facturas Emitidas', description: 'Facturas de cobro enviadas a clientes por servicios prestados y horas de consultoría.', icon: '📈', color: '#10b981' },
        { id: 'gastos_deducibles', name: 'Gastos y Compras', description: 'Facturas recibidas de suscripciones, herramientas de software, hardware y gastos deducibles de autónomo.', icon: '💼', color: '#f59e0b' },
        { id: 'proyectos_portafolio', name: 'Portafolio e Imagen', description: 'Propuestas de proyectos de clientes, briefs de marca, logotipos, archivos de diseño y capturas de pantalla de trabajos.', icon: '🎨', color: '#a855f7' }
      ];
    }
    setFolders(preset);
    triggerNotification(`Estructura restablecida con éxito al modelo propuesto.`);
  };

  // Gestión de Documentos
  const handleAnalysisComplete = (result) => {
    setCurrentAnalysis(result);
    triggerNotification(`Análisis IA finalizado. Esperando confirmación de ubicación.`);
  };

  const handleConfirmDocument = (finalDoc) => {
    const newDocId = `doc-${Date.now()}`;
    const newDocument = {
      id: newDocId,
      originalName: finalDoc.originalName,
      size: finalDoc.size,
      type: finalDoc.type,
      extension: finalDoc.extension,
      assignedFolderId: finalDoc.assignedFolderId,
      confidence: finalDoc.confidence,
      reasoning: finalDoc.reasoning,
      summary: finalDoc.summary,
      tags: finalDoc.tags,
      analyzedAt: finalDoc.analyzedAt,
      userOverridden: finalDoc.userOverridden
    };

    setDocuments([newDocument, ...documents]);
    setCurrentAnalysis(null);
    
    const destFolder = folders.find(f => f.id === finalDoc.assignedFolderId);
    triggerNotification(`Documento archivado en "${destFolder?.name || 'Destino'}" de forma segura.`);
  };

  const handleDeleteDocument = (id) => {
    const docName = documents.find(d => d.id === id)?.originalName;
    setDocuments(documents.filter(d => d.id !== id));
    triggerNotification(`"${docName}" removido de la bóveda.`);
  };

  return (
    <div className="app-container">
      {/* Sidebar de la aplicación */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">D</div>
          <span className="brand-title">DocuAI Organizer</span>
        </div>

        <nav>
          <ul className="nav-menu">
            <li 
              className={`nav-item ${activeTab === 'workspace' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('workspace');
                setCurrentAnalysis(null);
              }}
            >
              <span className="nav-icon">📤</span>
              <span>Zona de Carga</span>
            </li>
            <li 
              className={`nav-item ${activeTab === 'folders' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('folders');
                setCurrentAnalysis(null);
              }}
            >
              <span className="nav-icon">⚙️</span>
              <span>Ajustar Carpetas</span>
            </li>
          </ul>
        </nav>

        {/* Resumen dinámico de carpetas en el Sidebar */}
        <div className="sidebar-folders-title">Buzones en tiempo real</div>
        <ul className="sidebar-folder-list">
          {folders.map(folder => {
            const count = documents.filter(d => d.assignedFolderId === folder.id).length;
            return (
              <li 
                key={folder.id} 
                className="sidebar-folder-item"
                onClick={() => {
                  setActiveTab('workspace');
                  triggerNotification(`Filtrando por ${folder.name} en el explorador inferior.`);
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: folder.color }}>{folder.icon}</span>
                  <span>{folder.name}</span>
                </span>
                <span className="folder-badge" style={{ border: `1px solid ${folder.color}35`, color: folder.color }}>
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Área de contenido central */}
      <main className="main-content">
        <header className="header-section">
          <div className="title-area">
            <h1>
              {activeTab === 'workspace' 
                ? 'Gestor Documental Autónomo' 
                : 'Configuración de Reglas Semánticas'
              }
            </h1>
            <p>
              {activeTab === 'workspace'
                ? 'Clasificación de archivos en tiempo real impulsada por procesamiento del lenguaje natural.'
                : 'Personaliza los buzones documentales. La IA se adaptará a tus definiciones dinámicamente.'
              }
            </p>
          </div>
          
          <div style={{ color: 'var(--text-dark)', fontSize: '13px', textAlign: 'right' }}>
            <div>DocuAI Engine v1.4</div>
            <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>En Linea y Cifrado</div>
          </div>
        </header>

        {/* Carga del Workspace */}
        {activeTab === 'workspace' && (
          <div className="workspace-grid">
            {/* Columna Izquierda: Zona de Drop o Resultados de Análisis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {currentAnalysis ? (
                <AiAnalysisPanel 
                  analysisResult={currentAnalysis}
                  folders={folders}
                  onConfirm={handleConfirmDocument}
                  onCancel={() => setCurrentAnalysis(null)}
                />
              ) : (
                <DropZone 
                  folders={folders}
                  documents={documents}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              )}

              {/* Bóveda general siempre visible abajo */}
              <DocumentVault 
                folders={folders}
                documents={documents}
                onDeleteDocument={handleDeleteDocument}
                onShowNotification={triggerNotification}
              />
            </div>

            {/* Columna Derecha: Sidebar de Guías e Información Operativa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card">
                <h3 className="card-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
                  ¿Cómo funciona DocuAI?
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  <p>
                    1. **Configuras**: Creas carpetas y describes detalladamente qué tipo de documentos deben almacenarse en ellas.
                  </p>
                  <p>
                    2. **Sueltas**: Arrastras cualquier documento en la zona de drop. La IA leerá los metadatos y examinará semánticamente el archivo.
                  </p>
                  <p>
                    3. **La IA Clasifica**: Compara la información extraída contra la descripción funcional de cada carpeta y elige el mejor buzón de destino.
                  </p>
                  <p>
                    4. **Confirmas**: Verificas la justificación detallada de la IA y archivas el documento de forma irreversible en su destino.
                  </p>
                </div>
              </div>

              <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <h3 className="card-title" style={{ fontSize: '15px', marginBottom: '8px' }}>
                  Sugerencia de Eficiencia
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Prueba a crear una carpeta llamada "Código Fuente" con descripción "Scripts de Python, HTML, o archivos de configuración JSON". Arrastra un archivo con extensión .json o .js y observa cómo el motor heurístico local detecta el código y lo archiva al instante.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de carpetas */}
        {activeTab === 'folders' && (
          <FolderConfig 
            folders={folders}
            onAddFolder={handleAddFolder}
            onUpdateFolder={handleUpdateFolder}
            onDeleteFolder={handleDeleteFolder}
            onLoadTemplate={handleLoadTemplate}
          />
        )}
      </main>

      {/* Banner flotante de notificaciones del sistema */}
      {notification && (
        <div className="notification-banner">
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
          <span style={{ fontSize: '13.5px', color: 'white', fontWeight: 500 }}>{notification}</span>
        </div>
      )}
    </div>
  );
}
