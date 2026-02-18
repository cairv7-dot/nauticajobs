const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');

// Cargar variables de entorno
require('dotenv').config();

let nodemailer;
try{ nodemailer = require('nodemailer'); }catch(e){ nodemailer = null }

// Importar bot de Telegram (si está configurado)
let telegramBot;
try { telegramBot = require('./telegram-bot'); } catch(e) { telegramBot = null; }

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const offersFile = path.join(dataDir, 'offers.json');
const contactsFile = path.join(dataDir, 'contacts.json');
const adminFile = path.join(dataDir, 'admin.json');
const usersFile = path.join(dataDir, 'users.json');
const applicationsFile = path.join(dataDir, 'applications.json');
const companiesFile = path.join(dataDir, 'companies.json');
const talentFile = path.join(dataDir, 'talent.json');

const uploadsDir = path.join(__dirname, 'uploads');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const adminTokens = new Map(); // token -> expiry

function genToken(){ return crypto.randomBytes(24).toString('hex'); }

function readJSON(file, cb){
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) return cb(null, []);
    try{ cb(null, JSON.parse(data)); }catch(e){ cb(e); }
  });
}

function writeJSON(file, arr, cb){
  fs.writeFile(file, JSON.stringify(arr, null, 2), cb);
}

function ensureDataDir(){
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(offersFile)) fs.writeFileSync(offersFile, '[]');
  if (!fs.existsSync(contactsFile)) fs.writeFileSync(contactsFile, '[]');
  if (!fs.existsSync(adminFile)) fs.writeFileSync(adminFile, JSON.stringify({ password: 'adminpass' }, null, 2));
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
  if (!fs.existsSync(applicationsFile)) fs.writeFileSync(applicationsFile, '[]');
  if (!fs.existsSync(companiesFile)) fs.writeFileSync(companiesFile, '[]');
  if (!fs.existsSync(talentFile)) fs.writeFileSync(talentFile, '[]');

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

ensureDataDir();

// serve uploaded CVs publicly (demo). In production add auth checks.
app.use('/uploads', express.static(uploadsDir));

function requireAdmin(req, res, next){
  const token = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const exp = adminTokens.get(token);
  if (!exp || exp < Date.now()) return res.status(401).json({ error: 'Token inválido o expirado' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Falta password' });
  fs.readFile(adminFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error leyendo configuración' });
    const cfg = JSON.parse(data);
    if (password !== cfg.password) return res.status(401).json({ error: 'Password incorrecto' });
    const token = genToken();
    adminTokens.set(token, Date.now() + (60*60*1000)); // 1h
    res.json({ token });
  });
});

// User registration/login (simple)
app.post('/api/register', async (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  readJSON(usersFile, (err, users) => {
    if (err) return res.status(500).json({ error: 'Error leyendo usuarios' });
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Usuario ya existe' });
    const hash = bcrypt.hashSync(password, 8);
    const id = users.reduce((m,u)=>Math.max(m,u.id||0),0)+1;
    const user = { id, email, password: hash, name: name||'', role: role||'candidate', createdAt: new Date().toISOString() };
    users.push(user);
    writeJSON(usersFile, users, (e) => { if (e) return res.status(500).json({ error: 'No se pudo guardar usuario' }); res.json({ ok:true }); });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  readJSON(usersFile, (err, users) => {
    if (err) return res.status(500).json({ error: 'Error leyendo usuarios' });
    const u = users.find(x=>x.email===email);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Password incorrecto' });
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, email: u.email, name: u.name, role: u.role } });
  });
});

// Company login
app.post('/api/company/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  readJSON(companiesFile, (err, companies) => {
    if (err) return res.status(500).json({ error: 'Error leyendo empresas' });
    const c = companies.find(x=>x.email===email);
    if (!c) return res.status(404).json({ error: 'Empresa no encontrada' });
    if (!bcrypt.compareSync(password, c.password)) return res.status(401).json({ error: 'Password incorrecto' });
    const token = jwt.sign({ id: c.id, email: c.email, type: 'company' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, company: { id: c.id, email: c.email, name: c.name, description: c.description } });
  });
});

function verifyJWT(req, res, next){
  const token = req.headers['x-auth-token'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  }catch(e){ res.status(401).json({ error: 'Token inválido o expirado' }); }
}


app.get('/api/offers', (req, res) => {
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'No se pudieron leer las ofertas' });
    res.json(offers);
  });
});

app.get('/api/offers/:id', (req, res) => {
  const id = Number(req.params.id);
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    const o = offers.find(x => x.id === id);
    if (!o) return res.status(404).json({ error: 'Oferta no encontrada' });
    res.json(o);
  });
});

app.post('/api/offers', requireAdmin, (req, res) => {
  const { title, location, type, description, salary, source, sourceChatId, sourceMessageId, sourceDate, expiresAt, contactEmail, contactPhone, companyName } = req.body;
  if (!title || !location) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    const id = offers.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;
    const offer = { 
      id, 
      title, 
      location, 
      type: type||'', 
      description: description||'', 
      salary: salary||'',
      // Campos adicionales para ofertas de Telegram
      source: source || 'Manual',
      sourceChatId: sourceChatId || null,
      sourceMessageId: sourceMessageId || null,
      sourceDate: sourceDate || new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      // Información de contacto
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      companyName: companyName || ''
    };
    offers.push(offer);
    writeJSON(offersFile, offers, (err2) => {
      if (err2) return res.status(500).json({ error: 'No se pudo guardar la oferta' });
      res.status(201).json(offer);
    });
  });
});

// File upload (CV) config
const storage = multer.diskStorage({ destination: (req,file,cb)=>cb(null, uploadsDir), filename: (req,file,cb)=>{ const unique = Date.now() + '-' + Math.round(Math.random()*1e9); cb(null, unique + '-' + file.originalname.replace(/[^a-z0-9.\-_]/gi,'_')); } });
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Apply to a job (multipart/form-data, field 'cv')
app.post('/api/apply', upload.single('cv'), (req, res) => {
  const { name, email, message, jobId } = req.body || {};
  if (!name || !email || !jobId) return res.status(400).json({ error: 'name, email y jobId son obligatorios' });
  const cvFile = req.file ? path.relative(__dirname, req.file.path) : null;
  readJSON(applicationsFile, (err, list) => {
    if (err) return res.status(500).json({ error: 'Error leyendo aplicaciones' });
    const id = list.reduce((m,a)=>Math.max(m,a.id||0),0)+1;
    const appEntry = { id, jobId: Number(jobId), name, email, message: message||'', cv: cvFile, createdAt: new Date().toISOString() };
    list.push(appEntry);
    writeJSON(applicationsFile, list, (e) => { if (e) return res.status(500).json({ error: 'No se pudo guardar aplicación' }); res.json({ ok:true, application: appEntry }); });
  });
});

// Admin: list applications
app.get('/api/applications', requireAdmin, (req, res) => {
  readJSON(applicationsFile, (err, list) => {
    if (err) return res.status(500).json({ error: 'Error leyendo aplicaciones' });
    res.json(list);
  });
});

app.get('/api/applications/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  readJSON(applicationsFile, (err, list) => {
    if (err) return res.status(500).json({ error: 'Error leyendo aplicaciones' });
    const a = list.find(x => x.id === id);
    if (!a) return res.status(404).json({ error: 'Aplicación no encontrada' });
    res.json(a);
  });
});

app.put('/api/offers/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    const idx = offers.findIndex(x => x.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Oferta no encontrada' });
    const updated = { ...offers[idx], ...req.body, id };
    offers[idx] = updated;
    writeJSON(offersFile, offers, (err2) => {
      if (err2) return res.status(500).json({ error: 'No se pudo actualizar la oferta' });
      res.json(updated);
    });
  });
});

app.delete('/api/offers/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    const filtered = offers.filter(x => x.id !== id);
    if (filtered.length === offers.length) return res.status(404).json({ error: 'Oferta no encontrada' });
    writeJSON(offersFile, filtered, (err2) => {
      if (err2) return res.status(500).json({ error: 'No se pudo eliminar la oferta' });
      res.json({ ok: true });
    });
  });
});

// Endpoint para que el bot de Telegram publique ofertas (usa token especial)
app.post('/api/telegram/publish', (req, res) => {
  const telegramToken = req.headers['x-telegram-token'];
  const expectedToken = process.env.TELEGRAM_BOT_TOKEN;
  
  // Verificar token de Telegram
  if (telegramToken !== expectedToken) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  const { title, location, type, description, salary, source, sourceChatId, sourceMessageId, expiresInDays, contactEmail, contactPhone, companyName } = req.body;
  if (!title || !location) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    
    const id = offers.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    const offer = {
      id,
      title,
      location,
      type: type || '',
      description: description || '',
      salary: salary || '',
      source: source || 'Telegram',
      sourceChatId: sourceChatId || null,
      sourceMessageId: sourceMessageId || null,
      sourceDate: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      expiresAt,
      // Información de contacto
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      companyName: companyName || ''
    };
    
    offers.push(offer);
    writeJSON(offersFile, offers, (err2) => {
      if (err2) return res.status(500).json({ error: 'No se pudo guardar la oferta' });
      console.log(`📢 Oferta publicada desde Telegram: ${title}`);
      res.status(201).json(offer);
    });
  });
});

// Endpoint para limpiar ofertas expiradas
app.post('/api/admin/cleanup-expired', requireAdmin, (req, res) => {
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    
    const now = new Date();
    const initialCount = offers.length;
    
    const filtered = offers.filter(o => {
      if (!o.expiresAt) return true; // Mantener ofertas sin expiración
      return new Date(o.expiresAt) > now;
    });
    
    const deletedCount = initialCount - filtered.length;
    
    if (deletedCount === 0) {
      return res.json({ message: 'No hay ofertas expiradas', deleted: 0 });
    }
    
    writeJSON(offersFile, filtered, (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al limpiar ofertas' });
      res.json({ message: `Se eliminaron ${deletedCount} ofertas expiradas`, deleted: deletedCount });
    });
  });
});

// ===== TALENTO (Público) =====
app.get('/api/talent', (req, res) => {
  readJSON(talentFile, (err, talent) => {
    if (err) return res.status(500).json({ error: 'No se pudieron leer los profesionales' });
    res.json(talent);
  });
});

app.get('/api/talent/:id', (req, res) => {
  const id = Number(req.params.id);
  readJSON(talentFile, (err, talent) => {
    if (err) return res.status(500).json({ error: 'Error leyendo profesionales' });
    const p = talent.find(x => x.id === id);
    if (!p) return res.status(404).json({ error: 'Profesional no encontrado' });
    res.json(p);
  });
});

app.post('/api/contact', async (req, res) => {
  const contact = req.body;
  if (!contact || !contact.name || !contact.email || !contact.message) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // If SMTP configured, try to send email, otherwise store locally
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost && nodemailer) {
    try{
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });
      await transporter.sendMail({ from: process.env.SMTP_FROM || contact.email, to: process.env.CONTACT_TO || process.env.SMTP_USER, subject: contact.subject || 'Contacto desde web', text: `${contact.name} <${contact.email}>\n\n${contact.message}` });
      return res.json({ ok: true, sent: true });
    }catch(e){ console.error('SMTP error', e); }
  }

  // fallback: save to contacts file
  readJSON(contactsFile, (err, arr) => {
    const list = (!err && arr) ? arr : [];
    list.push({ ...contact, receivedAt: new Date().toISOString() });
    writeJSON(contactsFile, list, (err2) => {
      if (err2) return res.status(500).json({ error: 'No se pudo guardar el contacto' });
      res.json({ ok: true, sent: false });
    });
  });
});

// Company dashboard: get their offers and applications
app.get('/api/company/offers', verifyJWT, (req, res) => {
  if (req.user.type !== 'company') return res.status(403).json({ error: 'No autorizado' });
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    const myOffers = offers.filter(o => o.companyId === req.user.id);
    res.json(myOffers);
  });
});

app.get('/api/company/applications', verifyJWT, (req, res) => {
  if (req.user.type !== 'company') return res.status(403).json({ error: 'No autorizado' });
  readJSON(offersFile, (err, offers) => {
    if (err) return res.status(500).json({ error: 'Error leyendo ofertas' });
    const myOfferIds = offers.filter(o => o.companyId === req.user.id).map(o => o.id);
    readJSON(applicationsFile, (err2, apps) => {
      if (err2) return res.status(500).json({ error: 'Error leyendo aplicaciones' });
      const myApps = apps.filter(a => myOfferIds.includes(a.jobId));
      res.json(myApps);
    });
  });
});

// Download CV (protected by JWT)
app.get('/downloads/:filename', verifyJWT, (req, res) => {
  const filename = req.params.filename;
  const safePath = path.join(uploadsDir, filename);
  // Verify it's safe
  if (!safePath.startsWith(uploadsDir)) return res.status(403).json({ error: 'Acceso denegado' });
  if (!fs.existsSync(safePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.download(safePath, filename);
});

// ===== TAREAS PROGRAMADAS (CRON) =====
// Función para limpiar ofertas expiradas
function cleanupExpiredOffers() {
  const offersFilePath = path.join(__dirname, 'data', 'offers.json');
  
  fs.readFile(offersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error al leer ofertas para cleanup:', err.message);
      return;
    }
    
    try {
      const offers = JSON.parse(data);
      const now = new Date();
      const initialCount = offers.length;
      
      const filtered = offers.filter(o => {
        if (!o.expiresAt) return true; // Mantener ofertas sin expiración
        return new Date(o.expiresAt) > now;
      });
      
      const deletedCount = initialCount - filtered.length;
      
      if (deletedCount > 0) {
        fs.writeFile(offersFilePath, JSON.stringify(filtered, null, 2), 'utf8', (err2) => {
          if (err2) {
            console.error('❌ Error al escribir ofertas limpiadas:', err2.message);
          } else {
            console.log(`🧹 Cleanup automático: Se eliminaron ${deletedCount} ofertas expiradas`);
          }
        });
      }
    } catch (parseErr) {
      console.error('❌ Error al parsear ofertas:', parseErr.message);
    }
  });
}

// Programar cleanup diario a medianoche
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Ejecutando cleanup automático de ofertas expiradas...');
  cleanupExpiredOffers();
});

// También ejecutar cleanup al iniciar el servidor
cleanupExpiredOffers();

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

