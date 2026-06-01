import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Directorio raíz de la bóveda
const VAULT_DIR = path.join(__dirname, 'organizer_vault');
const METADATA_PATH = path.join(VAULT_DIR, 'metadata.json');

// Carpetas prestablecidas por defecto
const DEFAULT_FOLDERS = [
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

// Documentos precargados por defecto (escribiremos archivos reales para ellos)
const DEFAULT_DOCUMENTS = [
  {
    id: 'doc-1',
    originalName: 'factura_mensual_servidores_aws_mayo.pdf',
    size: '184.2 KB',
    type: 'application/pdf',
    extension: 'pdf',
    assignedFolderId: 'finanzas',
    confidence: 96,
    reasoning: 'La IA ha catalogado este documento con alta confianza (96%) al identificar el término "factura" en el nombre del archivo y la extensión PDF, asociándolo con el procesamiento y control de gastos de servidores de Amazon Web Services.',
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

// Inicializar base de datos y directorio físico
function initVault() {
  console.log(`[DocuAI Backend] Inicializando bóveda física en: ${VAULT_DIR}`);
  
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }

  // Crear carpetas iniciales en disco
  DEFAULT_FOLDERS.forEach(folder => {
    const folderPath = path.join(VAULT_DIR, folder.id);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`[DocuAI Backend] Carpeta física creada: ${folderPath}`);
    }
  });

  // Inicializar metadatos
  if (!fs.existsSync(METADATA_PATH)) {
    const initialMeta = {
      folders: DEFAULT_FOLDERS,
      documents: DEFAULT_DOCUMENTS
    };
    fs.writeFileSync(METADATA_PATH, JSON.stringify(initialMeta, null, 2), 'utf-8');
    console.log(`[DocuAI Backend] Base de datos metadata.json inicializada.`);

    // Crear archivos mock reales para ilustrar la funcionalidad inmediatamente
    try {
      // 1. Factura
      fs.writeFileSync(
        path.join(VAULT_DIR, 'finanzas', 'factura_mensual_servidores_aws_mayo.pdf'),
        '%PDF-1.4\n% MOCK PDF\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(MOCK: Amazon Web Services - Factura Mayo 2026 - Total: 184.20 USD) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\n0000000130 00000 n\n0000000223 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n393\n%%EOF',
        'binary'
      );
      // 2. NDA
      fs.writeFileSync(
        path.join(VAULT_DIR, 'legal', 'contrato_confidencialidad_nda_gemini.docx'),
        'MOCK DOCX: Acuerdo de Confidencialidad Recíproco (NDA) para transferencia de tecnologías de Inteligencia Artificial entre partes firmantes.',
        'utf-8'
      );
      // 3. CV
      fs.writeFileSync(
        path.join(VAULT_DIR, 'recursos_humanos', 'cv_desarrollador_senior_react.pdf'),
        '%PDF-1.4\n% MOCK CV\nBT\n/F1 12 Tf\n72 712 Td\n(MOCK CV: Desarrollador Frontend Senior - React, TypeScript y CSS Premium) Tj\nET\n%%EOF',
        'binary'
      );
      console.log(`[DocuAI Backend] Archivos iniciales físicos creados en disco.`);
    } catch (e) {
      console.error('[DocuAI Backend] Error escribiendo archivos iniciales:', e);
    }
  } else {
    // Si la metadata existe, nos aseguramos de que los directorios físicos existan en disco
    try {
      const data = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      data.folders.forEach(folder => {
        const folderPath = path.join(VAULT_DIR, folder.id);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      });
    } catch (e) {
      console.error('[DocuAI Backend] Error al leer/actualizar carpetas físicas desde metadata.json:', e);
    }
  }
}

initVault();

// Utilidades para leer y escribir metadatos
function readMetadata() {
  try {
    const content = fs.readFileSync(METADATA_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('[DocuAI Backend] Error leyendo metadata.json, usando valores por defecto:', e);
    return { folders: [], documents: [] };
  }
}

function writeMetadata(data) {
  try {
    fs.writeFileSync(METADATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[DocuAI Backend] Error guardando metadata.json:', e);
    return false;
  }
}

// Configuración de Multer para Carga Física de Archivos en carpetas específicas
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderId = req.params.folderId;
    const destFolder = path.join(VAULT_DIR, folderId);
    
    // Si la carpeta física no existe por alguna razón, la creamos
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    
    cb(null, destFolder);
  },
  filename: function (req, file, cb) {
    // Para evitar caracteres extraños o duplicados conflictivos,
    // usamos el nombre original, pero si existe en la carpeta podemos renombrarlo con timestamp.
    const folderId = req.params.folderId;
    const originalName = file.originalname;
    const filePath = path.join(VAULT_DIR, folderId, originalName);
    
    if (fs.existsSync(filePath)) {
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      cb(null, `${base}_${Date.now()}${ext}`);
    } else {
      cb(null, originalName);
    }
  }
});

const upload = multer({ storage: storage });

// Servir la bóveda de archivos físicamente de forma estática para visualización integrada
app.use('/api/files', express.static(VAULT_DIR));

// === ENDPOINTS DE LA API ===

// 1. Estado del Backend y Ruta de la Bóveda
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    vaultPath: VAULT_DIR,
    os: process.platform,
    version: '1.4.0-desktop'
  });
});

// 2. Listar Carpetas
app.get('/api/folders', (req, res) => {
  const metadata = readMetadata();
  res.json(metadata.folders);
});

// 3. Crear Carpeta Física
app.post('/api/folders', (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre de la carpeta es requerido.' });
  }

  // Generar ID limpio
  let id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
  const metadata = readMetadata();
  
  // Evitar ID duplicado
  const exists = metadata.folders.some(f => f.id === id);
  if (exists) {
    id = `${id}_${Date.now()}`;
  }

  // Crear directorio físico en disco
  const folderPath = path.join(VAULT_DIR, id);
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    
    const newFolder = { id, name, description, icon, color };
    metadata.folders.push(newFolder);
    writeMetadata(metadata);
    
    console.log(`[DocuAI Backend] Carpeta física creada exitosamente: ${folderPath}`);
    res.status(201).json(newFolder);
  } catch (err) {
    console.error('[DocuAI Backend] Error creando carpeta física:', err);
    res.status(500).json({ error: 'No se pudo crear la carpeta física en disco.' });
  }
});

// 4. Modificar Carpeta Física (Renombrado e icono)
app.put('/api/folders/:id', (req, res) => {
  const folderId = req.params.id;
  const { name, description, icon, color } = req.body;

  const metadata = readMetadata();
  const folderIndex = metadata.folders.findIndex(f => f.id === folderId);

  if (folderIndex === -1) {
    return res.status(404).json({ error: 'Carpeta no encontrada.' });
  }

  const oldFolder = metadata.folders[folderIndex];
  
  // Actualizar metadatos
  const updatedFolder = {
    ...oldFolder,
    name: name || oldFolder.name,
    description: description || oldFolder.description,
    icon: icon || oldFolder.icon,
    color: color || oldFolder.color
  };

  metadata.folders[folderIndex] = updatedFolder;
  writeMetadata(metadata);

  console.log(`[DocuAI Backend] Carpeta editada en metadatos: "${updatedFolder.name}"`);
  res.json(updatedFolder);
});

// 5. Eliminar Carpeta Física (Cascada a otra carpeta o limpieza)
app.delete('/api/folders/:id', (req, res) => {
  const folderId = req.params.id;
  const metadata = readMetadata();
  
  const folderIndex = metadata.folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    return res.status(404).json({ error: 'Carpeta no encontrada.' });
  }

  const folderName = metadata.folders[folderIndex].name;
  
  // Buscar un buzón de destino alternativo
  const fallbackFolder = metadata.folders.find(f => f.id !== folderId);
  
  const folderPath = path.join(VAULT_DIR, folderId);
  
  try {
    if (fallbackFolder) {
      const fallbackPath = path.join(VAULT_DIR, fallbackFolder.id);
      
      // Mover archivos físicos al fallback
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        files.forEach(file => {
          if (file === 'metadata.json') return;
          const oldFilePath = path.join(folderPath, file);
          const newFilePath = path.join(fallbackPath, file);
          fs.renameSync(oldFilePath, newFilePath);
        });
        
        // Remover el directorio antiguo ya vacío
        fs.rmdirSync(folderPath);
      }

      // Reasignar los documentos en metadata
      metadata.documents = metadata.documents.map(doc => {
        if (doc.assignedFolderId === folderId) {
          return { ...doc, assignedFolderId: fallbackFolder.id };
        }
        return doc;
      });
      
      console.log(`[DocuAI Backend] Carpeta "${folderName}" eliminada. Archivos movidos a "${fallbackFolder.name}".`);
    } else {
      // Si es la última carpeta, borrar físicamente todo
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
      metadata.documents = metadata.documents.filter(doc => doc.assignedFolderId !== folderId);
      console.log(`[DocuAI Backend] Carpeta "${folderName}" y todos sus archivos eliminados por completo.`);
    }

    // Filtrar de la lista de carpetas
    metadata.folders.splice(folderIndex, 1);
    writeMetadata(metadata);

    res.json({ message: `Carpeta ${folderName} eliminada exitosamente.` });
  } catch (err) {
    console.error('[DocuAI Backend] Error eliminando carpeta física:', err);
    res.status(500).json({ error: 'Error interno al intentar eliminar la carpeta física.' });
  }
});

// 6. Listar Documentos
app.get('/api/documents', (req, res) => {
  const metadata = readMetadata();
  res.json(metadata.documents);
});

// 7. Subir Documento Físicamente con Metadatos IA
app.post('/api/documents/upload/:folderId', upload.single('file'), (req, res) => {
  const folderId = req.params.folderId;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'No se ha proporcionado ningún archivo para subir.' });
  }

  // Capturar metadatos del cuerpo de la petición (enviados por el cliente desde el análisis IA)
  const {
    id,
    confidence,
    reasoning,
    summary,
    tags,
    userOverridden
  } = req.body;

  const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
  const docId = id || `doc-${Date.now()}`;
  const fileExt = path.extname(file.originalname).substring(1).toLowerCase();

  // Helper para formatear tamaño de archivo
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const newDoc = {
    id: docId,
    originalName: file.filename, // Usamos el nombre con el que se guardó en disco realmente
    size: formatBytes(file.size),
    type: file.mimetype,
    extension: fileExt,
    assignedFolderId: folderId,
    confidence: parseInt(confidence) || 95,
    reasoning: reasoning || 'Clasificado y guardado en disco mediante el motor inteligente local.',
    summary: summary || 'Documento físico digitalizado y resguardado de forma segura.',
    tags: parsedTags,
    analyzedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    userOverridden: userOverridden === 'true' || userOverridden === true
  };

  const metadata = readMetadata();
  metadata.documents.unshift(newDoc);
  writeMetadata(metadata);

  console.log(`[DocuAI Backend] Archivo guardado físicamente: organizer_vault/${folderId}/${file.filename}`);
  res.status(201).json(newDoc);
});

// 8. Eliminar Documento Físico
app.delete('/api/documents/:id', (req, res) => {
  const docId = req.params.id;
  const metadata = readMetadata();
  
  const docIndex = metadata.documents.findIndex(d => d.id === docId);
  if (docIndex === -1) {
    return res.status(404).json({ error: 'Documento no encontrado en metadatos.' });
  }

  const doc = metadata.documents[docIndex];
  const filePath = path.join(VAULT_DIR, doc.assignedFolderId, doc.originalName);

  try {
    // Borrar físicamente si el archivo existe en disco
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[DocuAI Backend] Archivo eliminado físicamente del disco: ${filePath}`);
    } else {
      console.warn(`[DocuAI Backend] El archivo físico no existía en disco: ${filePath}`);
    }

    // Quitar de metadatos
    metadata.documents.splice(docIndex, 1);
    writeMetadata(metadata);

    res.json({ message: `Documento ${doc.originalName} eliminado exitosamente.` });
  } catch (err) {
    console.error('[DocuAI Backend] Error eliminando archivo físico:', err);
    res.status(500).json({ error: 'No se pudo eliminar el archivo del sistema.' });
  }
});

// 9. Integración macOS Finder - Abrir Carpeta Física Específica
app.post('/api/system/open-folder', (req, res) => {
  const { folderId } = req.body;
  
  // Validar folderId para prevenir cualquier exploit de terminal por inyección de comandos
  if (folderId && !/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    return res.status(400).json({ error: 'ID de carpeta inválido o inseguro.' });
  }

  // Si no se provee folderId, abrimos la raíz de la bóveda
  const targetPath = folderId 
    ? path.join(VAULT_DIR, folderId)
    : VAULT_DIR;

  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'La carpeta física indicada no existe.' });
  }

  console.log(`[DocuAI System] Abriendo carpeta en Finder macOS: ${targetPath}`);

  // En macOS, usamos el comando nativo "open"
  exec(`open "${targetPath}"`, (error) => {
    if (error) {
      console.error('[DocuAI System] Error abriendo Finder:', error);
      return res.status(500).json({ error: 'No se pudo abrir el directorio en macOS Finder.' });
    }
    res.json({ success: true, message: 'Finder abierto exitosamente.' });
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ========================================================`);
  console.log(`🔥 DocuAI Backend Server iniciado en: http://localhost:${PORT}`);
  console.log(`📁 Bóveda física local activa: ${VAULT_DIR}`);
  console.log(`🖥️  SO detectado: ${process.platform} (macOS Finder listo)`);
  console.log(`======================================================== \n`);
});
