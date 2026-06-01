import React, { useState } from 'react';

// Colores prestablecidos para las carpetas
const COLOR_PRESETS = [
  { name: 'Indigo', value: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
  { name: 'Emerald', value: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Amber', value: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Violet', value: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  { name: 'Rose', value: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
  { name: 'Sky', value: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.4)' }
];

// Emojis sugeridos para iconos de carpeta
const EMOJI_PRESETS = ['💼', '📄', '⚖️', '🛠️', '⚙️', '📈', '🏠', '🎓', '🏥', '🔑', '✈️', '🎨'];

export default function FolderConfig({ folders, onAddFolder, onUpdateFolder, onDeleteFolder, onLoadTemplate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  
  // Estado del formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#6366f1');

  // Abre el modal para crear
  const handleOpenCreate = () => {
    setEditingFolder(null);
    setName('');
    setDescription('');
    setIcon('💼');
    setColor('#6366f1');
    setIsModalOpen(true);
  };

  // Abre el modal para editar
  const handleOpenEdit = (folder) => {
    setEditingFolder(folder);
    setName(folder.name);
    setDescription(folder.description);
    setIcon(folder.icon || '📁');
    setColor(folder.color || '#6366f1');
    setIsModalOpen(true);
  };

  // Enviar el formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    const folderData = {
      name: name.trim(),
      description: description.trim(),
      icon,
      color
    };

    if (editingFolder) {
      onUpdateFolder(editingFolder.id, folderData);
    } else {
      onAddFolder(folderData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="ai-result-grid">
      <div className="card-header" style={{ marginBottom: '8px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '24px' }}>Estructura de Carpetas Inteligente</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Define las categorías y sus descripciones operativas. La IA usará estas descripciones semánticas para organizar tus archivos automáticamente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onLoadTemplate('empresa')}>
            Cargar Plantilla Empresa
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Nueva Carpeta
          </button>
        </div>
      </div>

      <div className="folder-grid">
        {folders.map((folder) => {
          const colorObj = COLOR_PRESETS.find(c => c.value === folder.color) || COLOR_PRESETS[0];
          return (
            <div key={folder.id} className="folder-card" style={{ borderLeft: `4px solid ${folder.color}` }}>
              <div className="folder-card-top">
                <div className="folder-card-meta">
                  <div 
                    className="folder-card-icon" 
                    style={{ 
                      backgroundColor: `${folder.color}15`, 
                      color: folder.color,
                      border: `1px solid ${folder.color}35`,
                      boxShadow: `0 0 10px ${folder.color}20`
                    }}
                  >
                    {folder.icon || '📁'}
                  </div>
                  <div className="folder-card-name">{folder.name}</div>
                </div>
              </div>

              <div className="folder-card-desc">
                {folder.description}
              </div>

              <div className="folder-card-actions">
                <button className="folder-card-action-btn" onClick={() => handleOpenEdit(folder)}>
                  Editar
                </button>
                {folders.length > 1 && (
                  <button className="folder-card-action-btn delete" onClick={() => onDeleteFolder(folder.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de edición / creación */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {editingFolder ? 'Editar Carpeta Destino' : 'Crear Nueva Carpeta'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Carpeta</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Finanzas, Contratos, etc."
                  required
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label>Descripción Semántica (Crítica para el análisis IA)</label>
                <textarea 
                  className="form-control" 
                  rows="3"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe con precisión qué archivos deben almacenarse aquí. Ej: Recibos, facturas, comprobantes de IVA, presupuestos o gastos de la empresa."
                  required
                />
              </div>

              <div className="form-group">
                <label>Icono / Emoji identificativo</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {EMOJI_PRESETS.map(emoji => (
                    <button 
                      key={emoji}
                      type="button"
                      className={`color-option ${icon === emoji ? 'selected' : ''}`}
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        border: icon === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        borderRadius: '6px'
                      }}
                      onClick={() => setIcon(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Color de Etiqueta</label>
                <div className="color-picker-row">
                  {COLOR_PRESETS.map((preset) => (
                    <div 
                      key={preset.value}
                      className={`color-option ${color === preset.value ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: preset.value,
                        boxShadow: color === preset.value ? `0 0 12px ${preset.value}` : 'none'
                      }}
                      onClick={() => setColor(preset.value)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFolder ? 'Guardar Cambios' : 'Crear Carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
