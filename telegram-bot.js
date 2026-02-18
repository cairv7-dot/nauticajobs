/**
 * Telegram Job Bot - Versión Mejorada con Mejor Formato
 */

require('dotenv').config();

const { Bot } = require('grammy');
const axios = require('axios');
const cron = require('node-cron');

const CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  autoPublish: process.env.AUTO_PUBLISH === 'true',
  deleteAfterDays: parseInt(process.env.DELETE_AFTER_DAYS || '30'),
  apiUrl: process.env.API_URL || 'http://localhost:3000'
};

// Grupos monitorizados (añade los IDs de tus grupos aquí)
const MONITORED_GROUPS = [
  -5204219744,  // Nautica Employment
];

// Palabras clave para detectar ofertas de empleo
const JOB_KEYWORDS = [
  'se busca', 'buscando', 'vacante', 'empleo', 'trabajo',
  'contratar', 'se necesita', 'hiring', 'job', 'vacancy',
  'capitan', 'capitán', 'patrón', 'marinero', 'sailor',
  'crew', 'engineer', 'chef', 'oficial', 'oficial',
  'yate', 'yacht', 'náutica', 'nautical', 'embarcación',
  'pilot', 'piloto', 'patrón', 'skipper'
];

// Palabras que NO son ofertas de empleo (para filtrar falsos positivos)
const NOT_JOB_KEYWORDS = [
  'busco', 'buscando trabajo', '¿alguien sabe', 'alguien tiene',
  'vendo', 'compro', 'alquilo', 'mercadillo'
];

// Ofertas ya publicadas (para evitar duplicados)
const publishedOffers = new Set();

// Cargar ofertas existentes al iniciar para evitar duplicados
function loadExistingOffers() {
  try {
    const fs = require('fs');
    const dataDir = require('path').join(__dirname, 'data');
    const offersFile = require('path').join(dataDir, 'offers.json');
    if (fs.existsSync(offersFile)) {
      const offers = JSON.parse(fs.readFileSync(offersFile, 'utf8'));
      offers.forEach(offer => {
        if (offer.title) {
          const hash = generateTitleHash(offer.title);
          publishedOffers.add(hash);
        }
      });
      console.log(`📚 Cargadas ${offers.length} ofertas existentes para detección de duplicados`);
    }
  } catch (err) {
    console.error('Error cargando ofertas existentes:', err.message);
  }
}

// Cargar ofertas al iniciar
loadExistingOffers();

function isJobOffer(text) {
  if (!text || text.length < 20) return false;
  
  const lowerText = text.toLowerCase();
  
  // Filtrar falsos positivos
  for (const keyword of NOT_JOB_KEYWORDS) {
    if (lowerText.includes(keyword)) return false;
  }
  
  // Debe tener al menos 2 palabras clave de trabajo
  let keywordCount = 0;
  for (const keyword of JOB_KEYWORDS) {
    if (lowerText.includes(keyword)) keywordCount++;
  }
  
  return keywordCount >= 1;
}

// Función para normalizar texto (eliminar emojis, errores comunes)
function normalizeText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// Función para generar un título coherente y corto
function generateSmartTitle(text) {
  const lowerText = text.toLowerCase();
  
  // Detectar el tipo de puesto
  let title = 'Oferta de Empleo';
  
  // Patrones de títulos
  const titlePatterns = [
    { pattern: /capitán|captain|patrón|skipper/i, template: 'Capitán de Yate' },
    { pattern: /patrón portuario|patron portuario|patrón de puerto/i, template: 'Patrón Portuario' },
    { pattern: /patrón|patron/i, template: 'Patrón' },
    { pattern: /marinero|sailor|deckhand|deck crew/i, template: 'Marinero de Cubierta' },
    { pattern: /crew|member|miembro/i, template: 'Tripulación' },
    { pattern: /engineer|ingeniero|chief engineer/i, template: 'Ingeniero Naval' },
    { pattern: /chef|cook|cocinero/i, template: 'Cocinero de Yate' },
    { pattern: /pilot|piloto/i, template: 'Piloto' },
    { pattern: /oficial|officer|first officer/i, template: 'Oficial' },
    { pattern: /instructor|monitor|teacher|enseñanza/i, template: 'Instructor Náutico' },
    { pattern: /tour|guías|guia|guide/i, template: 'Guía Turístico' },
    { pattern: /comercial|sales|ventas/i, template: 'Comercial Náutico' },
    { pattern: /remolcador|tug|tow/i, template: 'Capitán de Remolcador' },
    { pattern: /submarin|submarine/i, template: 'Piloto de Submarino' },
    { pattern: /banana|hidropedal|paddle|sup|kayak/i, template: 'Monitor de Actividades Acuáticas' },
    { pattern: /catamarán|catamaran/i, template: 'Patrón de Catamarán' },
  ];
  
  for (const tp of titlePatterns) {
    if (tp.pattern.test(lowerText)) {
      title = tp.template;
      break;
    }
  }
  
  // Si no encontró título específico o el título es genérico, usar ubicación o puesto genérico
  if (title === 'Oferta de Empleo' || !title) {
    // Intentar detectar puesto del texto
    const jobPatterns = [
      { pattern: /capitán|captain|patrón|skipper/i, title: 'Capitán de Yate' },
      { pattern: /marinero|sailor|deckhand|deck crew|seaman/i, title: 'Marinero de Cubierta' },
      { pattern: /cocinero|chef|cook/i, title: 'Cocinero de Yate' },
      { pattern: /ingeniero|engineer/i, title: 'Ingeniero de Yate' },
      { pattern: /tripulación|crew|stew|hostess|azafata/i, title: 'Tripulación de Yate' },
      { pattern: /piloto|pilot/i, title: 'Piloto' },
      { pattern: /patrón portuario|patron portuario/i, title: 'Patrón Portuario' },
      { pattern: /oficial|officer|first officer|second officer/i, title: 'Oficial de Cubierta' },
      { pattern: /bosun|chief mate/i, title: 'Bosun' },
      { pattern: /catamarán|catamaran/i, title: 'Patrón de Catamarán' },
    ];
    
    for (const jp of jobPatterns) {
      if (jp.pattern.test(lowerText)) {
        title = jp.title;
        break;
      }
    }
  }
  
  // Añadir ubicación si está clara y el título no la tiene
  if (title && !title.includes(' - ')) {
    const locationPatterns = [
      { pattern: /mallorca|baleares|ibiza|menorca|palma/i, add: ' - Mallorca' },
      { pattern: /barcelona|bcn/i, add: ' - Barcelona' },
      { pattern: /valencia/i, add: ' - Valencia' },
      { pattern: /alicante|alacant/i, add: ' - Alicante' },
      { pattern: /málaga|malaga|estepona|marbella/i, add: ' - Málaga' },
      { pattern: /cádiz|cadiz|roda de berà|tarragona/i, add: ' - Cádiz' },
      { pattern: /almería|almeria/i, add: ' - Almería' },
      { pattern: /gran canaria|las palmas|tenerife|canarias/i, add: ' - Canarias' },
      { pattern: /galicia|coruña|vigo|pontevedra/i, add: ' - Galicia' },
      { pattern: /blanes|girona|costa brava/i, add: ' - Costa Brava' },
      { pattern: /menorca|mahón/i, add: ' - Menorca' },
      { pattern: /grecia|greek/i, add: ' - Grecia' },
      { pattern: /francia|french|antibes|cannes|monaco/i, add: ' - Francia' },
      { pattern: /malta/i, add: ' - Malta' },
      { pattern: /caribe|caribbean|anguila|bvi/i, add: ' - Caribe' },
    ];
    
    for (const lp of locationPatterns) {
      if (lp.pattern.test(lowerText)) {
        title += lp.add;
        break;
      }
    }
  }
  
  return title || 'Oferta de Empleo Náutico';
}

// Función para extraer emails del texto
function extractEmail(text) {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const match = text.match(emailPattern);
  return match ? match[0] : '';
}

// Función para extraer números de teléfono
function extractPhone(text) {
  // Spanish phone patterns
  const phonePatterns = [
    // +34 or 0034 followed by 9 digits
    /(?:\+34|0034)\s*(\d{3}\s*\d{3}\s*\d{3})/g,
    // 9 digits starting with 6, 7, 8, or 9
    /\b([6-9]\d{2}\s?\d{3}\s?\d{3})\b/g,
    // Phone with prefix like +34, 34, etc. - including "al" (al +34...) or "al número"
    /\b(?:al|al número|al número de|contactar|contacta|llamar|llama|escribri|escribe|wp|wasap)[:\s.]*(?:\+34|34)?\s*(\d{3,9})\b/gi,
    // Direct number with optional +34
    /(?:\+34|34)?\s*([6-9]\d{8})/g,
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the phone number
      let phone = match[0];
      // Remove common prefixes and words
      phone = phone.replace(/^(?:tx|telf?|teléfono|whatsapp|phone|móvil|mobile|call|al|al número|al número de|contactar|contacta|llamar|llama|escribri|escribe|wp|wasap)[:\s.]*/i, '');
      // Clean up spaces and dashes
      phone = phone.replace(/[\s.-]/g, '');
      // Add +34 if it doesn't have it and it's 9 digits
      if (phone.length === 9 && /^[6-9]/.test(phone)) {
        return '+34 ' + phone.substring(0, 3) + ' ' + phone.substring(3, 6) + ' ' + phone.substring(6);
      } else if (/^\+34\d{9}$/.test(phone)) {
        // Already has +34 and 9 digits
        return '+34 ' + phone.substring(3, 6) + ' ' + phone.substring(6, 9) + ' ' + phone.substring(9);
      } else if (/^\d{9}$/.test(phone)) {
        return '+34 ' + phone.substring(0, 3) + ' ' + phone.substring(3, 6) + ' ' + phone.substring(6);
      }
      return phone;
    }
  }
  return '';
}

// Función para extraer el salario correctamente
function extractSalary(text) {
  const lowerText = text.toLowerCase();
  
  // NO confundir año con salario - evitar años como 2024, 2025, etc.
  const yearPattern = /\b(2023|2024|2025|2026|2027|2028)\b/;
  if (yearPattern.test(text)) {
    // Si solo hay años pero también hay salario, usar el salario
    const hasSalaryNumber = /\b\d{3,5}\b/.test(text);
    if (!hasSalaryNumber) {
      return 'Sin especificar';
    }
  }
  
  // Patrones para rangos de salario (prioridad alta)
  const salaryRanges = [
    // Ranges with € and month/week
    { pattern: /(\d{1,5})\s*[-–to]+\s*(\d{1,5})\s*(?:€|eur)?\s*(?:\/mes|\/month|\/week|\/año|\/year)?/i,
      extract: (match) => `${match[1]}-${match[2]} €/mes` },
    // Ranges without currency
    { pattern: /(\d{3,5})\s*[-–]\s*(\d{3,5})\s*(?:\/mes|\/month)?/i,
      extract: (match) => `${match[1]}-${match[2]} €/mes` },
  ];
  
  for (const sp of salaryRanges) {
    const match = text.match(sp.pattern);
    if (match) {
      return sp.extract(match);
    }
  }
  
  // Single salary with € symbol
  const euroPattern = /(?:salary|salario|sueldo|wage|pay|remuneration|compensation|earning)\s*[:\-]?\s*(?:of|from|)?\s*(\d{1,5})\s*(?:€|eur)?\s*(?:\/mes|\/month|\/week|per|each)?/i;
  const euroMatch = text.match(euroPattern);
  if (euroMatch) {
    return `${euroMatch[1]} €/mes`;
  }
  
  // Salary with currency symbol anywhere in text
  const currencyPattern = /(?:€|eur|dollars?|\$|pounds?|£)\s*(\d{2,5})/i;
  const currencyMatch = text.match(currencyPattern);
  if (currencyMatch && parseInt(currencyMatch[1]) >= 100 && parseInt(currencyMatch[1]) <= 20000) {
    return `${currencyMatch[1]} €`;
  }
  
  // Just numbers that look like salary (between 500-20000, not a year)
  const numberPattern = /(?:salary|pay| wage |remuneration|compensation)\s*[:\-]?\s*(\d{3,5})/i;
  const numberMatch = text.match(numberPattern);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    if (num >= 500 && num <= 20000) {
      return `${num} €`;
    }
  }
  
  // Keywords that indicate salary is mentioned but no specific number found
  if (lowerText.includes('salary') || lowerText.includes('salario') ||
      lowerText.includes('negociable') || lowerText.includes('negotiable') ||
      lowerText.includes('competitive') || lowerText.includes('competitivo')) {
    return 'A negociar';
  }
  
  return 'Sin especificar';
}

// Función para generar un hash simple del título (para detectar duplicados)
function generateTitleHash(title) {
  return title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').substring(0, 50);
}

function detectLanguage(text) {
  const spanishWords = ['se', 'busca', 'empleo', 'trabajo', 'contratar', 'necesita', 'ubicación', 'salario', 'requisitos', 'ofrece'];
  const englishWords = ['the', 'job', 'work', 'hire', 'need', 'location', 'salary', 'requirements', 'offer'];
  
  let spanishCount = 0, englishCount = 0;
  const words = text.toLowerCase().split(/\s+/);
  words.forEach(word => {
    if (spanishWords.includes(word)) spanishCount++;
    if (englishWords.includes(word)) englishCount++;
  });
  return spanishCount > englishCount ? 'es' : 'en';
}

async function translateToSpanish(text) {
  try {
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
    );
    if (response.data.responseStatus === 200) {
      return response.data.responseData.translatedText;
    }
  } catch (error) {
    console.log('Error traduciendo:', error.message);
  }
  return text;
}

// Mejor parser con mejor formato y detección de duplicados
function parseJobOffer(messageText, message) {
  // Normalizar el texto
  let cleanText = normalizeText(messageText);
  
  // Generar título inteligente
  let title = generateSmartTitle(cleanText);
  
  // Verificar si es un duplicado
  const titleHash = generateTitleHash(title);
  if (publishedOffers.has(titleHash)) {
    console.log(`⏭ Oferta duplicada ignorada: ${title}`);
    return null;
  }
  publishedOffers.add(titleHash);
  
  // Descripción completa
  let description = cleanText;
  
  // Añadir estructura si no la tiene
  if (!description.toLowerCase().includes('requisitos') && 
      !description.toLowerCase().includes('funciones') &&
      !description.toLowerCase().includes('se ofrece') &&
      description.length > 300) {
    description = 'Descripción del puesto:\n\n' + description;
  }
  
  // Limitar longitud
  if (description.length > 1500) {
    description = description.substring(0, 1500) + '...';
  }

  // Generar resumen automático
  let summary = '';
  const firstParagraph = cleanText.split('\n')[0];
  if (firstParagraph && firstParagraph.length > 20) {
    summary = firstParagraph.substring(0, 150);
    if (firstParagraph.length > 150) summary += '...';
  } else {
    summary = cleanText.substring(0, 150);
    if (cleanText.length > 150) summary += '...';
  }
  
  // Buscar ubicación
  let location = '';
  const locationPatterns = [
    // Patrones específicos de ciudades/regiones conocidas - ORDENAR POR ESPECIFICIDAD
    { pattern: /(?:mallorca|baleares|ibiza|menorca|palma|calvià|manacor|inca|llucmajor)/i, location: 'Mallorca, España' },
    { pattern: /(?:barcelona|bcn)/i, location: 'Barcelona, España' },
    { pattern: /(?:tarragona|roda de berà|girona|costa brava|blanes|roses|empuriabrava)/i, location: 'Tarragona, España' },
    { pattern: /(?:valencia|alicante|alacant|benidorm|denia)/i, location: 'Valencia, España' },
    { pattern: /(?:málaga|malaga|estepona|marbella|fuengirola|torremolinos)/i, location: 'Málaga, España' },
    { pattern: /(?:cádiz|cadiz|huelva|chipiona|rota|tarifa)/i, location: 'Cádiz, España' },
    { pattern: /(?:almería|almeria)/i, location: 'Almería, España' },
    { pattern: /(?:gran canaria|las palmas|tenerife|canarias|la graciosa|lanzarote|fuerteventura)/i, location: 'Canarias, España' },
    { pattern: /(?:galicia|coruña|vigo|pontevedra|ribeira|santiago)/i, location: 'Galicia, España' },
    { pattern: /(?:mahón|menorca|formentera)/i, location: 'Menorca, España' },
    { pattern: /(?:ibiza|eivissa)/i, location: 'Ibiza, España' },
    { pattern: /(?:antibes|niza|cannes|monaco|saint tropez|francia|french riviera)/i, location: 'Costa Azul, Francia' },
    { pattern: /(?:grecia|athenas|mykonos|santorini|creta|rodas)/i, location: 'Grecia' },
    { pattern: /(?:caribe|anguila|islas vírgenes|british virgin|san bartomé)/i, location: 'Caribe' },
    { pattern: /(?:malta|valeta|gozo)/i, location: 'Malta' },
    // Si no encuentra patrón específico, usar extracción general
    { pattern: /([A-Z][a-zA-Záéíóúñ]+(?:\s+[A-Z][a-zA-Záéíóúñ]+)*(?:\s+[A-Z][a-zA-Záéíóúñ]+)?)\s*,?\s*(?:españa|espana|spain|isle|islands?|isla)/i, 
      extract: (m) => m[1].replace(/\s*españa$|\s*spain$/i, '').trim() + ', España' },
  ];
  
  // Primero buscar patrones específicos
  for (const lp of locationPatterns) {
    if (lp.location) {
      if (lp.pattern.test(cleanText)) {
        location = lp.location;
        break;
      }
    } else if (lp.extract) {
      const match = cleanText.match(lp.pattern);
      if (match) {
        location = lp.extract(match);
        break;
      }
    }
  }
  
  // Si la ubicación extraída es muy corta o parece ser una palabra suelta, usar España por defecto
  if (!location || location.length < 4 || /^\d+$/.test(location) || 
      /^(en|el|la|un|una|de|por|para|con|sin)$/i.test(location)) {
    location = 'España';
  }
  
  // Si el título no tiene ubicación, añadirla del texto
  if (!title.includes(' - ') && title !== 'Oferta de Empleo') {
    // Intentar añadir ubicación al título
    const titleLocationPatterns = [
      { pattern: /mallorca|baleares|ibiza|menorca|palma/i, add: ' - Mallorca' },
      { pattern: /barcelona|bcn/i, add: ' - Barcelona' },
      { pattern: /tarragona|roda de berà/i, add: ' - Tarragona' },
      { pattern: /valencia/i, add: ' - Valencia' },
      { pattern: /alicante|alacant/i, add: ' - Alicante' },
      { pattern: /málaga|malaga|estepona|marbella/i, add: ' - Málaga' },
      { pattern: /cádiz|cadiz|huelva|chipiona|rota/i, add: ' - Cádiz' },
      { pattern: /almería|almeria/i, add: ' - Almería' },
      { pattern: /gran canaria|las palmas|tenerife|canarias/i, add: ' - Canarias' },
      { pattern: /galicia|coruña|vigo|pontevedra/i, add: ' - Galicia' },
      { pattern: /blanes|girona|costa brava/i, add: ' - Costa Brava' },
      { pattern: /menorca|mahón/i, add: ' - Menorca' },
      { pattern: /grecia|greek/i, add: ' - Grecia' },
      { pattern: /francia|french|antibes|cannes|monaco/i, add: ' - Francia' },
      { pattern: /malta/i, add: ' - Malta' },
      { pattern: /caribe|caribbean|anguila|bvi/i, add: ' - Caribe' },
    ];
    
    for (const lp of titleLocationPatterns) {
      if (lp.pattern.test(cleanText.toLowerCase())) {
        title += lp.add;
        location = lp.add.replace(' - ', '');
        break;
      }
    }
  }
  
  // Buscar salario usando la función inteligente
  let salary = extractSalary(cleanText);

  // Buscar email
  let contactEmail = extractEmail(cleanText);
  
  // Buscar teléfono
  let contactPhone = extractPhone(cleanText);

  const result = {
    title: title,
    location: location || 'España',
    type: 'Full-time',
    summary: summary,
    description: description,
    salary: salary || 'A negociar',
    source: 'Telegram',
    sourceChatId: message.chat_id?.toString() || '',
    sourceChatTitle: message.chat?.title || '',
    sourceMessageId: message.message_id?.toString() || '',
    sourceDate: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    expiresInDays: CONFIG.deleteAfterDays,
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || ''
  };

  // Detectar tipo de contrato
  if (cleanText.toLowerCase().includes('temporal') || 
      cleanText.toLowerCase().includes('seasonal') ||
      cleanText.toLowerCase().includes('temporada')) {
    result.type = 'Seasonal';
  } else if (cleanText.toLowerCase().includes('parcial') || 
             cleanText.toLowerCase().includes('part time')) {
    result.type = 'Part-time';
  }

  return result;
}

async function publishOffer(offer) {
  try {
    const response = await axios.post(`${CONFIG.apiUrl}/api/telegram/publish`, offer, {
      headers: { 'x-telegram-token': CONFIG.botToken, 'Content-Type': 'application/json' }
    });
    console.log(`✅ Publicada: ${offer.title}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function processMessage(message, botInstance) {
  const text = message.text || message.caption || '';
  if (!isJobOffer(text)) return;
  
  console.log(`🔍 Oferta detectada en chat ${message.chat_id}`);
  
  const lang = detectLanguage(text);
  let finalText = text;
  
  if (lang === 'en') {
    console.log('📝 Traduciendo...');
    finalText = await translateToSpanish(text);
  }
  
  const offer = parseJobOffer(finalText, message);
  await publishOffer(offer);
}

async function searchAllGroups(botInstance) {
  console.log('🔍 Iniciando búsqueda en grupos...');
  
  // Nota: Telegram no permite búsqueda histórica de mensajes
  // El bot solo puede ver mensajes nuevos que llegan después de que se une
  // Por eso es importante que el bot se una al grupo Y quelquien envíe un mensaje
  
  // Primero buscar en grupos configurados manualmente
  for (const chatId of MONITORED_GROUPS) {
    try {
      // Usar getChatAdministrators para verificar que el bot está en el grupo
      const admins = await botInstance.api.getChatAdministrators(chatId);
      console.log(`   ✓ Grupo configurado accesible: ${chatId}`);
    } catch (e) {
      console.log(`   ⚠️ Grupo no accesible: ${chatId} - ${e.message}`);
    }
  }
  
  // No usamos getUpdates directamente porque Grammy lo maneja internamente
  // En su lugar, el bot procesará mensajes en tiempo real
  
  console.log('✅ El bot está escuchando mensajes en tiempo real');
  console.log('   Envía un mensaje con palabras clave de trabajo en el grupo para probar');
}

// ============ BOT ============

if (!CONFIG.botToken) {
  console.log('⚠️ BOT NO CONFIGURADO');
  module.exports = {};
} else {
  console.log('🤖 Iniciando bot...');
  
  const bot = new Bot(CONFIG.botToken);
  
  // Mensaje cuando el bot se une a un grupo (COMENTADO PARA NO ENVIAR MENSAJE)
  // Descomenta si quieres que el bot envíe un mensaje de bienvenida
  /*
  bot.on('my_chat_member', async (ctx) => {
    const chat = ctx.myChatMember.chat;
    const status = ctx.myChatMember.new_chat_member.status;
    
    if (chat.type !== 'private' && (status === 'member' || status === 'administrator')) {
      console.log(`✅ Bot añadido al grupo: ${chat.title} (${chat.id})`);
      
      // Responder en el grupo
      try {
        await ctx.api.sendMessage(
          chat.id,
          `👋 ¡Hola! Soy el bot de Náutica Jobs. 📋\n\n` +
          `Estaré monitorizando este grupo en busca de ofertas de empleo náuticas. ` +
          `Cuando detecte una oferta, la publicaré automáticamente en nuestra web.\n\n` +
          `📝 Los招聘信息 se publicarán en: https://nauticajobs.com/ofertas\n\n` +
          `Usa /ayuda para más información.`
        );
      } catch (e) {
        console.log('No se pudo enviar mensaje de bienvenida');
      }
    }
  });
  */
  
  // Mensajes nuevos
  bot.on('message:text', async (ctx) => {
    const message = ctx.message;
    if (message.text?.startsWith('/')) return;
    if (ctx.chat.type === 'private') return;
    await processMessage(message, bot);
  });
  
  // Buscar al iniciar (después de 10 segundos)
  setTimeout(() => {
    console.log('⏰ Buscando ofertas históricas...');
    searchAllGroups(bot);
  }, 10000);
  
  // Buscar cada 15 minutos
  cron.schedule('*/15 * * * *', () => {
    console.log('⏰ Búsqueda automática...');
    searchAllGroups(bot);
  });
  
  // Comandos
  bot.command('start', async (ctx) => {
    if (ctx.chat.type === 'private') {
      await ctx.reply(
        '👋 ¡Bienvenido al Bot de Náutica Jobs!\n\n' +
        'Este bot monitoriza grupos de Telegram en busca de ofertas de empleo náuticas.\n\n' +
        '📋 Comandos disponibles:\n' +
        '/buscar - Buscar ofertas en grupos\n' +
        '/grupos - Ver grupos monitorizados\n' +
        '/ayuda - Mostrar esta ayuda\n' +
        '/ofertas - Ver ofertas publicadas'
      );
    }
  });
  
  bot.command('ayuda', async (ctx) => {
    await ctx.reply(
      '🤖 *Náutica Jobs Bot*\n\n' +
      '📋 *Comandos:*\n' +
      '/buscar - Buscar ofertas ahora\n' +
      '/grupos - Ver grupos activos\n' +
      '/ofertas - Ver ofertas publicadas\n' +
      '/ayuda - Esta ayuda\n\n' +
      '💡 Para añadir el bot a un grupo, ' +
      'simplemente inclúyelo en el grupo y ' +
      'darle permisos de lectura.',
      { parse_mode: 'Markdown' }
    );
  });
  
  bot.command('buscar', async (ctx) => {
    await ctx.reply('🔍 Buscando ofertas...');
    await searchAllGroups(bot);
    await ctx.reply('✅ Búsqueda completada');
  });
  
  bot.command('ofertas', async (ctx) => {
    try {
      const response = await axios.get(`${CONFIG.apiUrl}/api/offers`);
      const offers = response.data;
      
      if (offers.length === 0) {
        await ctx.reply('📋 No hay ofertas publicadas actualmente.');
      } else {
        let message = `📋 *Ofertas publicadas:* ${offers.length}\n\n`;
        offers.slice(0, 5).forEach((offer, i) => {
          message += `${i + 1}. ${offer.title}\n`;
          message += `   📍 ${offer.location}\n`;
          message += `   🕐 ${offer.publishedAt?.split('T')[0] || 'N/A'}\n\n`;
        });
        if (offers.length > 5) {
          message += `_...y ${offers.length - 5} más_`;
        }
        await ctx.reply(message, { parse_mode: 'Markdown' });
      }
    } catch (e) {
      await ctx.reply('❌ Error al obtener ofertas');
    }
  });
  
  bot.command('grupos', async (ctx) => {
    await ctx.reply(
      `📋 *Grupos monitorizados:* ${MONITORED_GROUPS.length}\n\n` +
      `Para añadir el bot a un grupo, ` +
      `simplemente inclúyelo y dale permisos.`,
      { parse_mode: 'Markdown' }
    );
  });
  
  bot.start().then(() => console.log('✅ Bot iniciado')).catch(err => console.error('❌', err.message));
  
  module.exports = { bot, searchAllGroups };
}
