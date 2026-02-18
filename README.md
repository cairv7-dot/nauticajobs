# 🌊 Náutica Jobs - Plataforma de Empleo Marítimo

Portal de empleo náutico profesional con backend Express, frontend HTML/CSS/JS y diseño "Maritime-Premium".

## ✨ Características Principales

- **Búsqueda de Ofertas**: Filtros avanzados para candidatos (ubicación, tipo de contrato, buque, cargo)
- **Galería de Talento**: Acceso público sin restricciones a base de profesionales certificados
- **Panel de Empresa**: Gestión completa de ofertas y candidatos
- **Admin Dashboard**: CRUD completo de ofertas
- **Diseño Maritime-Premium**: Sistema de colores marítimo con logo SVG profesional
- **Autenticación JWT**: Segura y escalable
- **Carga de CVs**: Sistema seguro con descarga protegida

## 🎨 Diseño Visual

### Paleta de Colores
- **Azul Marino**: #1a2b3c (primario)
- **Azul Brillante**: #0077b6 (acentos)
- **Naranja Seguridad**: #ff6b35 (CTAs)
- **Dorado Galón**: #d4af37 (detalles premium)

### Elementos Visuales
- Logo Brújula SVG animado en navbar
- Ondas decorativas en secciones hero
- Iconos de buques según tipo (🚢 contenedor, 🛳️ crucero, ⛵ yate)
- Patrón de onda en área de filtros
- Sección de confianza con fondo marítimo
- Diseño responsive para móvil/tablet/desktop

## Inicio rápido

```bash
npm install
npm start
```

Luego abrir en navegador:
- **Inicio**: http://localhost:3000
- **Buscar Ofertas**: http://localhost:3000/offers.html
- **Buscar Talento**: http://localhost:3000/talent.html
- **Panel de empresa**: http://localhost:3000/company.html
- **Admin**: http://localhost:3000/admin.html

## Accesos de demostración

### Admin (gestión de ofertas)
- URL: http://localhost:3000/admin.html
- Contraseña: `adminpass`

### Panel Empresa
- URL: http://localhost:3000/company.html
- Email: `jobs@marinatours.es`
- Contraseña: `password`


## Flujos principales

1. **Candidato** busca ofertas en `/offers.html` -> postula desde `/apply.html?id=<id>` (adjunta CV)
2. **Reclutador/Empresa** accede a `/talent.html` sin login -> ve galería de profesionales verificados con filtros
3. **Empresa Contratante** accede a `/company.html` -> publica ofertas, gestiona candidaturas, descarga CVs
4. **Admin** accede a `/admin.html` -> CRUD completo de ofertas y visualización de candidaturas

## Endpoints API

### Públicos
- `GET /api/offers` - listar todas las ofertas
- `GET /api/offers/:id` - detalle de oferta
- `GET /api/talent` - listar todos los profesionales (búsqueda de talento)
- `GET /api/talent/:id` - detalle de profesional
- `POST /api/apply` - enviar candidatura (multipart, campos: name, email, jobId, message, cv)
- `POST /api/contact` - formulario de contacto (JSON)

### Autenticación
- `POST /api/register` - registro de usuario (email, password, name, role)
- `POST /api/login` - login candidato (devuelve JWT)
- `POST /api/company/login` - login empresa (devuelve JWT)
- `POST /api/admin/login` - login admin (token simple, 1h)

### Protegidos (requieren JWT o token admin)
- `GET /api/offers` - listar ofertas (admin)
- `POST /api/offers` - crear oferta (admin)
- `PUT /api/offers/:id` - actualizar oferta (admin)
- `DELETE /api/offers/:id` - eliminar oferta (admin)
- `GET /api/applications` - listar candidaturas (admin)
- `GET /api/company/offers` - mis ofertas (empresa)
- `GET /api/company/applications` - mis candidaturas (empresa)
- `GET /downloads/:filename` - descargar CV (protegido JWT)

## Stack tecnológico

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + Vanilla JS
- **Seguridad**: JWT (jsonwebtoken), bcryptjs
- **Upload**: Multer (CV)
- **Email**: Nodemailer (opcional SMTP)
- **Storage**: Archivos JSON + uploads/

## Variables de entorno (opcionales)

```
JWT_SECRET=tu_secreto_jwt
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=usuario@ejemplo.com
SMTP_PASS=contraseña
SMTP_FROM=info@ejemplo.com
CONTACT_TO=contacto@empresa.com
```

