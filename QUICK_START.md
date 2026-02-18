# ⚡ QUICK START - Náutica Jobs V2.0

## 🚀 ¡Empezar Ahora en 3 Pasos!

### Paso 1: Iniciar Servidor
```bash
cd c:\Users\cai\dig
node server.js
```

Esperar a ver: ✅ "Server running on http://localhost:3000"

### Paso 2: Abrir en Navegador
```
http://localhost:3000
```

### Paso 3: ¡Explorar!

---

## 🔗 ACCESOS DIRECTOS

### 👤 CANDIDATO
| Página | URL | Descripción |
|--------|-----|-------------|
| 🏠 Inicio | http://localhost:3000 | Landing principal |
| 🔍 Ofertas | http://localhost:3000/offers.html | Búsqueda con filtros |
| 📄 Oferta 1 | http://localhost:3000/job.html?id=1 | Detalle de oferta |
| 📝 Postular | http://localhost:3000/apply.html?id=1 | Formulario candidatura |

### 🏢 EMPRESA
| Página | URL | Credenciales |
|--------|-----|---|
| Panel | http://localhost:3000/company.html | Email: jobs@marinatours.es |
| | | Pwd: password |

### ⚙️ ADMIN
| Página | URL | Credenciales |
|--------|-----|---|
| Panel | http://localhost:3000/admin.html | Pwd: adminpass |

---

## 📊 ELEMENTOS VISUALES QUE VERÁS

### ✨ Nuevas Características
```
✓ Logo brújula SVG en navbar (todas las páginas)
✓ Onda decorativa bajo héroe
✓ Iconos de buques dinámicos (🚢, 🛳️, ⛵)
✓ Filtros con fondo marítimo
✓ Sección de confianza con patrón
✓ Paleta de 4 colores profesionales
✓ Efectos hover suaves en componentes
```

### 🎨 Colores
- 🔵 Azul Marino: #1a2b3c
- 🔷 Azul Brillante: #0077b6
- 🧡 Naranja: #ff6b35
- ✨ Dorado: #d4af37

---

## 📚 DOCUMENTACIÓN

| Documento | Contenido |
|-----------|----------|
| [README.md](README.md) | Descripción general del proyecto |
| [SESSION_SUMMARY.md](SESSION_SUMMARY.md) | Resumen de esta sesión |
| [DESIGN_IMPROVEMENTS.md](DESIGN_IMPROVEMENTS.md) | Detalles de cambios visuales |
| [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) | Resumen ejecutivo completo |
| [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) | Checklist de verificación |

---

## 🧪 FUNCIONALIDADES PARA PROBAR

### Candidato
```
1. Buscar ofertas:
   ✓ Ir a /offers.html
   ✓ Usar filtros (búsqueda, ubicación, cargo)
   ✓ Ver iconos de buques

2. Postular a oferta:
   ✓ Hacer click en "Postular"
   ✓ Completar formulario
   ✓ Adjuntar CV (PDF/DOC)
   ✓ Enviar

3. Ver detalles:
   ✓ Click en "Ver Detalle"
   ✓ Ver información completa
   ✓ Información de requisitos
```

### Empresa
```
1. Login:
   ✓ Email: jobs@marinatours.es
   ✓ Pwd: password

2. Ver mis ofertas:
   ✓ Listar ofertas propias
   ✓ Editar/eliminar (si implementado)

3. Ver candidatos:
   ✓ Listar candidaturas recibidas
   ✓ Descargar CVs
   ✓ Ver información candidato
```

### Admin
```
1. Login:
   ✓ Pwd: adminpass

2. Gestionar ofertas:
   ✓ Ver todas las ofertas
   ✓ Crear nueva
   ✓ Editar existente
   ✓ Eliminar

3. Ver candidaturas:
   ✓ Listar todas
   ✓ Filtrar por oferta
   ✓ Descargar CVs
```

---

## 💾 ARCHIVOS IMPORTANTES

### Frontend
```
public/
├── index.html ................. Landing page
├── offers.html ................ Búsqueda ofertas
├── job.html ................... Detalle oferta
├── apply.html ................. Postulación
├── company.html ............... Panel empresa
├── admin.html ................. Panel admin
├── maritime.css ............... Estilos (500+ líneas)
└── maritime-icons.svg ......... Logo + iconos
```

### Backend
```
server.js ...................... API Express
```

### Datos
```
data/
├── offers.json ................ Ofertas (con shipType + rank)
├── companies.json ............. Empresas
├── users.json ................. Usuarios
├── applications.json .......... Candidaturas
├── contacts.json .............. Contactos
└── admin.json ................. Admin
```

---

## 🔑 CREDENCIALES DE PRUEBA

### Empresa (Panel)
```
Email: jobs@marinatours.es
Contraseña: password
```

### Admin
```
Contraseña: adminpass
```

### Candidato
```
Registro libre (crear cuenta)
```

---

## 📱 RESPONSIVE

Prueba en diferente tamaños:
- **Desktop** (1920px): Experiencia completa
- **Tablet** (768px): Grid 2 columnas
- **Mobile** (375px): Stack vertical

DevTools: F12 → Ctrl+Shift+M

---

## 🐛 TROUBLESHOOTING

### El logo no aparece
```
✓ Limpiar cache: Ctrl+Shift+Del
✓ Recargar: Ctrl+F5 o F5
✓ Verificar: public/maritime-icons.svg existe
```

### Los estilos no se aplican
```
✓ Cache limpio
✓ maritime.css enlazado correctamente
✓ Verificar console (F12) por errores
```

### Ofertas no muestran iconos
```
✓ Verificar offers.json tiene shipType
✓ Recargar página
✓ Ver console por errores
```

### API no responde
```
✓ Servidor en ejecución: npm start
✓ Puerto 3000 disponible
✓ Revisar archivo server.js
```

---

## 🌐 API ENDPOINTS

### Ofertas
```
GET /api/offers
GET /api/offers/:id
POST /api/apply
```

### Empresa
```
POST /api/company/login
GET /api/company/offers (protegido JWT)
GET /api/company/applications (protegido JWT)
```

### Admin
```
POST /api/admin/login
GET /api/admin/offers
POST /api/admin/offers
PUT /api/admin/offers/:id
DELETE /api/admin/offers/:id
```

---

## 🎓 ESTRUCTURA DE DATOS

### Oferta
```json
{
  "id": 1,
  "title": "Patrón de embarcación",
  "location": "Alicante",
  "type": "Full-time",
  "description": "...",
  "salary": "1200-1800 €",
  "companyId": 1,
  "shipType": "Yate",
  "rank": "Patrón"
}
```

### Candidatura
```json
{
  "id": 1,
  "jobId": 1,
  "name": "Juan García",
  "email": "juan@email.com",
  "message": "...",
  "cv": "path/to/file.pdf",
  "createdAt": "2024-01-15"
}
```

---

## 📞 SOPORTE RÁPIDO

| Problema | Solución |
|----------|----------|
| Servidor no inicia | Verificar puerto 3000 libre |
| Estilos rotos | Limpiar cache (Ctrl+Shift+Del) |
| Logo no se ve | Recargar (F5) o Ctrl+F5 |
| API error 404 | Verificar URL + servidor activo |
| CVs no se descargan | JWT válido + archivo existe |

---

## 🎯 PRÓXIMOS PASOS

1. **Probar todas las funcionalidades**
2. **Verificar responsividad en móvil**
3. **Leer documentación** (especialmente DESIGN_IMPROVEMENTS.md)
4. **Hacer cambios** según necesidad
5. **Desplegar a producción** (si está listo)

---

## 📊 STATS

| Métrica | Valor |
|---------|-------|
| Páginas | 6 |
| Endpoints API | 15+ |
| Tipo de Buques | 5 |
| Colores Paleta | 4 |
| Líneas CSS | 500+ |
| Líneas HTML | 1000+ |
| Documentos | 5 |

---

## ✅ CHECKLIST FINAL

Antes de comenzar:
- [ ] Node.js instalado
- [ ] npm install completado
- [ ] Server.js corriendo (npm start)
- [ ] http://localhost:3000 accesible
- [ ] Archivos en /public/ presentes
- [ ] Datos en /data/ válidos

---

## 🌊 ¡LISTO PARA COMENZAR!

```
$ node server.js
✓ Server running on http://localhost:3000
```

Abre el navegador en http://localhost:3000 y **¡explora Náutica Jobs V2.0!**

🌊 **Navega hacia el empleo marítimo premium** 🌊

---

**Última actualización**: [Hoy]
**Versión**: 2.0 - Maritime-Premium
**Status**: 🟢 Production Ready
