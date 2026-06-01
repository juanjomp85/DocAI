/**
 * Motor de IA local para clasificación y análisis semántico de documentos.
 * Utiliza algoritmos de concordancia de tokens, ponderación de metadatos,
 * lematización/stemming en español, extracción de texto de binarios y
 * un bucle de aprendizaje continuo (feedback loop) basado en el historial de documentos previos.
 */

// Diccionario de sinónimos y palabras clave asociadas para enriquecer el análisis
const SYNONYMS_MAP = {
  identidad: [
    'dni', 'nie', 'nif', 'pasaporte', 'passport', 'id', 'identidad', 'identificacion', 
    'personal', 'licencia', 'carnet', 'visado', 'tarjeta', 'certificado', 'conductor', 
    'anverso', 'reverso', 'documento', 'documentacion', 'empadronamiento', 'social', 
    'seguridad', 'credenzial', 'credencial', 'usuario', 'firma', 'identificaciones'
  ],
  infantil: [
    'libro', 'libros', 'infantil', 'infantiles', 'cuento', 'cuentos', 'niño', 'niños', 
    'niña', 'niñas', 'ilustrado', 'fabula', 'juego', 'juguete', 'colorear', 'historieta', 
    'comic', 'pintar', 'colegio', 'escuela', 'primaria'
  ],
  factura: [
    'invoice', 'pago', 'recibo', 'cuenta', 'bill', 'compra', 'gasto', 'ticket', 
    'transaccion', 'iva', 'irpf', 'fiscal', 'nominas', 'nomina', 'salario', 'sueldo', 
    'remuneracion', 'honorarios', 'presupuesto', 'presupuestos', 'finanzas', 'contabilidad'
  ],
  contrato: [
    'agreement', 'legal', 'firma', 'terminos', 'condiciones', 'convenio', 'nda', 
    'alianza', 'socio', 'arrendamiento', 'pacto', 'acuerdo', 'estatutos', 'poderes',
    'contratos', 'juridico', 'clausula', 'compromiso'
  ],
  cv: [
    'curriculum', 'resume', 'empleo', 'candidato', 'perfil', 'experiencia', 'reclutamiento', 
    'talento', 'carta', 'habilidades', 'portfolio', 'estudios', 'universidad', 'trabajo',
    'postulante', 'seleccion', 'vitas', 'vitae', 'cv'
  ],
  manual: [
    'guia', 'instrucciones', 'soporte', 'ayuda', 'tutorial', 'documentacion', 'tecnico', 
    'how-to', 'configuracion', 'pasos', 'servidor', 'instalacion', 'mantenimiento',
    'manuales', 'guias', 'soporte', 'tecnologia', 'sistema'
  ],
  imagen: [
    'foto', 'screenshot', 'captura', 'diseño', 'grafico', 'render', 'logo', 'banner', 
    'jpg', 'png', 'svg', 'jpeg', 'grafica', 'ilustración', 'imagen', 'imagenes'
  ],
  codigo: [
    'code', 'script', 'programacion', 'desarrollo', 'js', 'py', 'html', 'css', 
    'json', 'yaml', 'git', 'xml', 'sql', 'db'
  ]
};

/**
 * Normaliza una cadena de texto (quita acentos, minúsculas, caracteres especiales)
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos
    .replace(/[^a-z0-9\s]/g, ' ')   // Reemplaza especiales por espacio
    .trim();
}

/**
 * Stemmer básico para español (lematización simple de plurales y géneros)
 * Permite que "facturas" coincida con "factura", "contratos" con "contrato", etc.
 */
function stemSpanish(word) {
  if (!word || word.length <= 3) return word;
  return word
    .replace(/(a|o|e)s$/, '') // Quita plurales: -as, -os, -es, -s
    .replace(/(a|o|e)$/, '');  // Quita vocales temáticas/género: -a, -o, -e
}

/**
 * Tokeniza un texto en palabras significativas
 */
function tokenize(text) {
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 1); // Aceptamos palabras de 2 o más letras (ej: cv, id, js, py, db, irpf)
}

/**
 * Comprueba si un texto contiene una palabra específica.
 * Si la palabra es muy corta (longitud <= 3 como DNI, CV, ID), utiliza límites de palabra estricta (\b)
 * para evitar falsos positivos con subcadenas (ej. "dni" en "independiente").
 */
function hasWordMatch(textNorm, wordNorm) {
  if (!textNorm || !wordNorm) return false;
  if (wordNorm.length > 3) {
    return textNorm.includes(wordNorm);
  } else {
    const regex = new RegExp(`\\b${wordNorm}\\b`, 'i');
    return regex.test(textNorm);
  }
}

/**
 * Obtiene el grupo completo de sinónimos (cluster semántico) para una palabra/token.
 * Busca coincidencias tanto con la clave del cluster como con sus sinónimos.
 */
function getSemanticCluster(token) {
  const stemToken = stemSpanish(token);
  for (const [key, synonyms] of Object.entries(SYNONYMS_MAP)) {
    const cluster = [key, ...synonyms];
    const isMember = cluster.some(word => word === token || stemSpanish(word) === stemToken);
    if (isMember) {
      return cluster;
    }
  }
  return null;
}

/**
 * Analiza un archivo de forma asíncrona
 * @param {File} file Objeto de tipo File de la API de HTML5
 * @param {Array} folders Lista de carpetas configuradas
 * @param {Array} existingDocuments Documentos ya archivados en el sistema (bucle de aprendizaje continuo)
 * @returns {Promise<Object>} Resultado del análisis de la IA
 */
export async function analyzeDocument(file, folders, existingDocuments = []) {
  return new Promise((resolve) => {
    // Simulamos un retraso de procesamiento para dar un efecto de escaneo IA premium
    setTimeout(async () => {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type || '';
      const fileExt = fileName.split('.').pop().toLowerCase();
      
      let fileTextContent = '';
      
      // Si es un archivo binario estructurado (como PDF o DOCX), intentamos extraer el texto embebido
      if (fileExt === 'pdf' || ['docx', 'xlsx', 'pptx'].includes(fileExt)) {
        try {
          fileTextContent = await readBinaryFileAsText(file);
        } catch (e) {
          console.error("Error extrayendo texto del archivo binario:", e);
        }
      } else if (fileType.startsWith('text/') || ['txt', 'md', 'json', 'csv', 'js', 'html', 'css'].includes(fileExt)) {
        try {
          fileTextContent = await readFileContent(file);
        } catch (e) {
          console.error("Error leyendo contenido del archivo de texto:", e);
        }
      }

      // 1. Tokenizamos nombre, extensión y contenido extraído
      const nameTokens = tokenize(fileName.substring(0, fileName.lastIndexOf('.')) || fileName);
      const contentTokens = tokenize(fileTextContent.substring(0, 5000)); // Analizamos los primeros 5000 caracteres
      
      // Para aprendizaje, llevamos control de qué documentos del historial han aportado coincidencia
      let matchedHistoryDocs = [];

      // 2. Evaluamos coincidencia para cada carpeta
      const scores = folders.map(folder => {
        let score = 0;
        const folderNameNorm = normalizeText(folder.name);
        const folderDescNorm = normalizeText(folder.description);
        
        // Ponderación de coincidencia en el nombre del archivo
        nameTokens.forEach(token => {
          const stemToken = stemSpanish(token);
          
          // Coincidencia directa/léxica utilizando la comprobación robusta de límites de palabra
          const hasDirectMatch = hasWordMatch(folderNameNorm, token) || 
                                 hasWordMatch(folderDescNorm, token) || 
                                 hasWordMatch(folderNameNorm, stemToken) || 
                                 hasWordMatch(folderDescNorm, stemToken);
          
          if (hasDirectMatch) {
            score += 60; // Peso muy alto si está directamente en el nombre o descripción
          }
          
          // Coincidencia semántica con su cluster de sinónimos completo
          const cluster = getSemanticCluster(token);
          if (cluster) {
            const hasSemanticMatch = cluster.some(clusterWord => {
              const stemClusterWord = stemSpanish(clusterWord);
              return hasWordMatch(folderNameNorm, clusterWord) || 
                     hasWordMatch(folderDescNorm, clusterWord) ||
                     hasWordMatch(folderNameNorm, stemClusterWord) || 
                     hasWordMatch(folderDescNorm, stemClusterWord);
            });
            
            if (hasSemanticMatch) {
              score += 45; // Peso muy alto por coincidencia de contexto semántico
            }
          }
        });

        // Ponderación de coincidencia en la extensión de archivo típica
        const extMap = {
          pdf: ['factura', 'contrato', 'manual', 'legal', 'cv', 'identificacion', 'documento'],
          docx: ['contrato', 'legal', 'cv', 'carta', 'informe'],
          xlsx: ['factura', 'finanzas', 'gastos', 'presupuesto', 'cuentas', 'excel'],
          csv: ['finanzas', 'gastos', 'datos'],
          png: ['imagen', 'captura', 'diseño', 'foto', 'identificacion', 'dni', 'credencial'],
          jpg: ['imagen', 'captura', 'diseño', 'foto', 'identificacion', 'dni', 'credencial'],
          jpeg: ['imagen', 'captura', 'diseño', 'foto', 'identificacion', 'dni', 'credencial'],
          txt: ['cv', 'manual', 'nota', 'codigo'],
          md: ['manual', 'documentacion', 'leeme', 'guia', 'codigo']
        };

        if (extMap[fileExt]) {
          extMap[fileExt].forEach(assocWord => {
            if (folderNameNorm.includes(assocWord) || folderDescNorm.includes(assocWord)) {
              score += 15; // Aporte por tipo de archivo
            }
          });
        }

        // Ponderación por contenido del archivo (si está disponible)
        if (contentTokens.length > 0) {
          let contentMatches = 0;
          
          contentTokens.forEach(token => {
            const stemToken = stemSpanish(token);
            
            // Coincidencia léxica en contenido
            const hasContentMatch = hasWordMatch(folderNameNorm, token) || 
                                    hasWordMatch(folderDescNorm, token) || 
                                    hasWordMatch(folderNameNorm, stemToken) || 
                                    hasWordMatch(folderDescNorm, stemToken);
            
            if (hasContentMatch) {
              contentMatches++;
            }
            
            // Coincidencia por sinónimos del contenido
            const cluster = getSemanticCluster(token);
            if (cluster) {
              const hasSemanticMatch = cluster.some(clusterWord => {
                const stemClusterWord = stemSpanish(clusterWord);
                return hasWordMatch(folderNameNorm, clusterWord) || 
                       hasWordMatch(folderDescNorm, clusterWord) ||
                       hasWordMatch(folderNameNorm, stemClusterWord) || 
                       hasWordMatch(folderDescNorm, stemClusterWord);
              });
              
              if (hasSemanticMatch) {
                contentMatches += 0.8;
              }
            }
          });
          
          // Escalamos el puntaje del contenido
          score += Math.min(contentMatches * 5, 50);
        }

        // 4. BUCLE DE APRENDIZAJE CONTINUO (FEEDBACK LOOP)
        // Analizamos similitudes con el contenido y metadatos de documentos ya archivados históricamente en esta carpeta
        let historyMatches = 0;
        const folderDocs = existingDocuments.filter(doc => doc.assignedFolderId === folder.id);
        
        folderDocs.forEach(histDoc => {
          // Extraemos tokens del nombre histórico y de sus tags
          const histNameTokens = tokenize(histDoc.originalName.substring(0, histDoc.originalName.lastIndexOf('.')) || histDoc.originalName);
          const histTagsTokens = histDoc.tags ? histDoc.tags.map(t => normalizeText(t)) : [];
          const histAllTokens = [...histNameTokens, ...histTagsTokens];
          
          let localMatchCount = 0;
          
          // Buscamos intersecciones léxicas o stemmed con el nuevo documento
          nameTokens.forEach(token => {
            const stemToken = stemSpanish(token);
            const matches = histAllTokens.some(hToken => {
              return hToken === token || stemSpanish(hToken) === stemToken;
            });
            if (matches) {
              localMatchCount++;
            }
          });

          // Si el archivo cargado tiene contenido, cruzamos con el historial
          if (contentTokens.length > 0) {
            contentTokens.slice(0, 50).forEach(token => { // Muestra de control rápido
              const stemToken = stemSpanish(token);
              const matches = histAllTokens.some(hToken => {
                return hToken === token || stemSpanish(hToken) === stemToken;
              });
              if (matches) {
                localMatchCount += 0.5;
              }
            });
          }
          
          if (localMatchCount > 0) {
            historyMatches += localMatchCount;
            // Guardamos referencia del documento que sirvió de base de aprendizaje
            matchedHistoryDocs.push({
              folderId: folder.id,
              docName: histDoc.originalName
            });
          }
        });

        if (historyMatches > 0) {
          // Cada coincidencia con el historial aporta 12 puntos, con un límite máximo de 45 puntos
          const bonus = Math.min(Math.round(historyMatches * 12), 45);
          score += bonus;
        }

        return {
          folderId: folder.id,
          folderName: folder.name,
          score: score
        };
      });

      // Ordenar por puntaje descendente
      scores.sort((a, b) => b.score - a.score);
      
      // Decidir carpeta destino
      let bestMatch = scores[0];
      let confidence = 0;
      
      // Mapear confianza
      if (bestMatch && bestMatch.score > 0) {
        // Normalizar score a porcentaje
        confidence = Math.min(Math.round(30 + (bestMatch.score * 0.8)), 99);
      } else {
        // Si no hay ninguna coincidencia (todos tienen 0 puntos), buscamos una carpeta comodín
        const fallbackFolder = folders.find(f => {
          const nameNorm = normalizeText(f.name);
          return nameNorm.includes('document') || nameNorm.includes('otro') || nameNorm.includes('general') || nameNorm.includes('vario');
        }) || folders[0];
        
        bestMatch = { folderId: fallbackFolder?.id || 'default', folderName: fallbackFolder?.name || 'Otros', score: 0 };
        confidence = 45; // Confianza de sospecha por fallback
      }

      // Filtrar los documentos de aprendizaje que corresponden ÚNICAMENTE a la carpeta ganadora
      const uniqueMatchedDocs = Array.from(
        new Set(
          matchedHistoryDocs
            .filter(item => item.folderId === bestMatch.folderId)
            .map(item => item.docName)
        )
      ).slice(0, 2);

      // Mostrar logs detallados en la consola del navegador para depuración
      console.log(`[DocuAI Analyzer] Analizando archivo: "${fileName}" (ext: .${fileExt})`);
      scores.forEach(s => {
        const isWinner = s.folderId === bestMatch.folderId;
        console.log(`  -> Carpeta: "${s.folderName}" | Puntuación acumulada: ${s.score} ${isWinner ? '★ GANADORA' : ''}`);
      });
      if (uniqueMatchedDocs.length > 0) {
        console.log(`  -> [Aprendizaje] Coincidencias en historial con:`, uniqueMatchedDocs);
      }

      // Extraer tags significativos
      const combinedTokens = [...nameTokens, ...contentTokens.slice(0, 15)];
      const uniqueTags = Array.from(new Set(combinedTokens))
        .filter(t => t.length > 2 && !['pdf', 'docx', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'zip', 'xml', 'xmlns', 'http', 'html'].includes(t))
        .slice(0, 5)
        .map(t => t.charAt(0).toUpperCase() + t.slice(1));
      
      // Si no hay tags, agregamos el formato y un tag genérico
      if (uniqueTags.length === 0) {
        uniqueTags.push(fileExt.toUpperCase());
        uniqueTags.push("Documento");
      } else {
        uniqueTags.unshift(fileExt.toUpperCase());
      }

      // Redactar justificación de IA en español enriquecida
      const reasoning = generateReasoning(fileName, bestMatch.folderName, confidence, nameTokens, fileExt, fileTextContent, uniqueMatchedDocs);
      
      // Generar mini resumen
      const summary = generateSummary(fileName, fileExt, fileTextContent);

      resolve({
        proposedFolderId: bestMatch.folderId,
        confidence: confidence,
        reasoning: reasoning,
        tags: uniqueTags,
        summary: summary,
        originalName: fileName,
        size: formatBytes(fileSize),
        type: fileType,
        extension: fileExt,
        analyzedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        learnedFromDocs: uniqueMatchedDocs // Enviamos el aprendizaje
      });
    }, 1800); // 1.8 segundos de retraso dramático para simular la "inteligencia"
  });
}

/**
 * Lee el contenido de texto de un archivo
 */
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Lector binario inteligente para archivos PDF / DOCX
 * Escanea secuencias ASCII imprimibles en los binarios para extraer texto útil para el motor heurístico sin librerías externas.
 */
function readBinaryFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      const arr = new Uint8Array(buffer);
      let text = '';
      const len = Math.min(arr.length, 45000); // Escanea los primeros 45KB del archivo por rendimiento
      
      for (let i = 0; i < len; i++) {
        const char = arr[i];
        // Filtra caracteres ASCII imprimibles habituales y saltos de línea/retornos
        if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
          text += String.fromCharCode(char);
        } else if (char > 127) {
          text += ' '; // Remplaza caracteres binarios de control por espacios
        }
      }
      resolve(text);
    };
    reader.onerror = () => resolve('');
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Formatea bytes a KB, MB
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Genera una explicación semántica y contextual del veredicto de la IA
 */
function generateReasoning(fileName, folderName, confidence, nameTokens, fileExt, contentText, uniqueMatchedDocs = []) {
  const lowerName = fileName.toLowerCase();
  
  let keyWordFound = '';
  for (const [key, synonyms] of Object.entries(SYNONYMS_MAP)) {
    if (synonyms.some(syn => lowerName.includes(syn)) || lowerName.includes(key)) {
      keyWordFound = key;
      break;
    }
  }

  let textSource = '';
  if (keyWordFound) {
    textSource = `el término clave "${keyWordFound}" identificado en el nombre del archivo`;
  } else {
    textSource = `el patrón de nombre "${fileName}" y la extensión de archivo .${fileExt}`;
  }

  if (contentText && contentText.length > 50) {
    textSource += `, sumado a palabras de alta coincidencia semántica analizadas en el interior del documento (como términos afines en plural/singular detectados en las descripciones de carpetas)`;
  }

  let historyText = '';
  if (uniqueMatchedDocs && uniqueMatchedDocs.length > 0) {
    historyText = `<br/><br/>💡 **Aprendizaje por Historial:** La IA ha detectado similitud directa con patrones de documentos que ya has guardado en esta carpeta previamente (en particular con *"<sup>${uniqueMatchedDocs.join(', ')}</sup>"*), lo que refuerza la consistencia organizacional de tu bóveda.`;
  }

  if (confidence > 85) {
    return `La IA ha clasificado este documento en **${folderName}** con alta confianza (${confidence}%) debido a una coincidencia directa con ${textSource}. La semántica del archivo se alinea perfectamente con la descripción y el propósito operativo establecido para esta carpeta.${historyText}`;
  } else if (confidence > 65) {
    return `Se ha asignado a **${folderName}** (Confianza: ${confidence}%) puesto que ${textSource} sugiere fuertemente esta categoría. Se han extraído patrones comunes que corresponden al almacenamiento típico de esta sección.${historyText}`;
  } else {
    return `La IA ha ubicado tentativamente el archivo en **${folderName}** (Confianza sugerida: ${confidence}%). No se han encontrado disparadores de coincidencia directa de alto peso, pero de acuerdo con el nombre y la extensión .${fileExt}, es el destino con mayor probabilidad semántica. Puedes reubicarlo manualmente si lo deseas.${historyText}`;
  }
}

/**
 * Genera un resumen ejecutivo simulado basado en el tipo de archivo y contenido
 */
function generateSummary(fileName, fileExt, contentText) {
  const lowerName = fileName.toLowerCase();
  const lowerContent = contentText ? contentText.toLowerCase() : '';
  
  // Buscar palabras clave en el contenido extraído primero, luego en el nombre
  const hasIdentityKeyword = lowerContent.includes('dni') || lowerContent.includes('nie') || lowerContent.includes('pasaporte') || lowerContent.includes('identificacion') || lowerContent.includes('identidad') || lowerName.includes('dni') || lowerName.includes('nie') || lowerName.includes('pasaporte') || lowerName.includes('identificacion') || lowerName.includes('identidad') || lowerName.includes('reverso') || lowerName.includes('anverso');
  const hasFinanceKeyword = lowerContent.includes('factura') || lowerContent.includes('invoice') || lowerContent.includes('pago') || lowerContent.includes('recibo') || lowerContent.includes('gasto') || lowerName.includes('factura') || lowerName.includes('recibo') || fileExt === 'xlsx';
  const hasLegalKeyword = lowerContent.includes('contrato') || lowerContent.includes('acuerdo') || lowerContent.includes('nda') || lowerContent.includes('legal') || lowerName.includes('contrato') || lowerName.includes('nda');
  const hasHRKeyword = lowerContent.includes('curriculum') || lowerContent.includes('cv') || lowerContent.includes('candidato') || lowerContent.includes('nomina') || lowerName.includes('cv') || lowerName.includes('curriculum');
  const hasTechKeyword = lowerContent.includes('manual') || lowerContent.includes('guia') || lowerContent.includes('tutorial') || lowerContent.includes('servidor') || lowerName.includes('manual') || fileExt === 'md';

  if (hasIdentityKeyword) {
    return "Documento de identificación personal o acreditación de identidad (como DNI, pasaporte, NIE o similar) digitalizado para control de credenciales.";
  }

  if (hasFinanceKeyword) {
    return "Documento de carácter financiero o administrativo que parece registrar transacciones de pago, cobros, presupuestos o impuestos correspondientes a un período operativo.";
  }
  
  if (hasLegalKeyword) {
    return "Acuerdo de voluntades o documento de validez jurídica que define compromisos comerciales, laborales o de confidencialidad entre partes contratantes.";
  }
  
  if (hasHRKeyword) {
    return "Hoja de vida profesional (CV) o expediente de personal que detalla la trayectoria académica, experiencia laboral y competencias técnicas evaluadas.";
  }

  if (hasTechKeyword) {
    return "Documento instructivo o técnico enfocado en guiar los pasos de configuración, uso, soporte o documentación de sistemas y procesos.";
  }

  // Si hay contenido real pero no coincide con los anteriores
  if (contentText && contentText.length > 50) {
    const cleanText = contentText
      .replace(/<[^>]*>/g, ' ') // Quitar posibles etiquetas XML
      .replace(/[\r\n\t]+/g, ' ')
      .trim();
    return `Documento escaneado. Primeras líneas identificadas: "${cleanText.substring(0, 110).trim()}..."`;
  }

  return `Archivo de formato .${fileExt.toUpperCase()} clasificado por metadatos para optimizar la organización del espacio documental.`;
}
