# Especificación de Diseño: Náutica Jobs - Tema Claro & Fresco

## 🎨 Nuevo Diseño Implementado (Febrero 2026)

### 1. **Paleta de Colores - Tema Claro**
✅ **Colores Principales**
- Azul cielo: #87CEEB
- Cian suave: #7FDBFF  
- Blanco espuma de mar: #F0F8FF
- Blanco puro: #FFFFFF
- Azul marino oscuro: #001F3F (títulos y acentos)
- Azul marino claro: #1A3A5C

✅ **Acentos en Rosa (solo para CTAs)**
- Rosa vibrante: #FF6B9D
- Rosa suave: #FF85A2
- Rosa coral: #FF8FAB

---

### 2. **Tipografía Moderna**
✅ **Google Fonts**
- **Outfit**: Títulos modernos y limpios (bold 700-800)
  - H1 Hero: 3-5rem, weight 800
  - H2 Secciones: 2-3rem, weight 800
  - H3 Tarjetas: 20-22px, weight 600
- **DM Sans**: Cuerpo de texto legible
  - Letter-spacing: 0.02em - 0.05em
  - Color: #001F3F (gris carbón)
  - Peso: 300-600

---

### 3. **Hero Section - Pantalla Completa**
✅ **Composición**
- Imagen de fondo a toda pantalla con overlay oscuro sutil
- Altura mínima: 100vh (pantalla completa)
- Padding: 120px 24px
- Texto centrado con título en blanco

✅ **Imágenes de Fondo**
- Yacht: /yacht.png (hero principal)
- Ofertas: /offers-bg.png
- Talentos: /talent-bg.webp
- Empresas: /company-bg.png

---

### 4. **Boxes Translúcidos (CTA)**
✅ **Tarjetas CTA**
- Fondo: rgba(255, 255, 255, 0.75) - 75% transparente
- Backdrop-filter: blur(16px) - efecto vidro esmerilado
- Border-radius: 24px
- Border: 1px solid rgba(255, 255, 255, 0.6)
- Hover: translateY(-12px) + scale(1.02)
- Sombra suave

✅ **Posicionamiento**
- Flotando sobre el hero (margin-top negativo)
- Integrados visualmente con el fondo

---

### 5. **Tarjetas de Contenido**
✅ **Job Cards & Talent Cards**
- Fondo translúcido: rgba(255, 255, 255, 0.8)
- Backdrop-filter: blur(12px)
- Border-radius: 20px
- Esquinas redondeadas modernas
- Hover con elevación y sombra

---

### 6. **Botones CTA - Rosa**
✅ **Estilo**
- Gradiente rosa: #FF6B9D → #FF8FAB
- Border-radius: 50px (pill shape)
- Box-shadow: rgba(255, 107, 157, 0.35)
- Hover: translateY(-3px) + scale(1.02)
- Texto en mayúsculas para CTAs principales

---

### 7. **Filtros Modernos**
✅ **Estilo**
- Fondo translúcido con blur
- Border-radius: 20px
- Inputs y selects con border azul cielo
- Focus con shadow rosa
- Diseño en grid responsive

---

### 8. **Efectos Visuales**
✅ **Sombras**
- --shadow-soft: 0 4px 24px rgba(0, 31, 63, 0.08)
- --shadow-medium: 0 8px 32px rgba(0, 31, 63, 0.12)
- --shadow-hover: 0 16px 48px rgba(0, 31, 63, 0.18)

✅ **Animaciones**
- Transiciones: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
- Hover states suaves
- Fade-in para elementos

✅ **Scrollbar personalizada**
- Track: var(--seafoam-white)
- Thumb: gradiente cyan

---

### 9. **Navbar**
✅ **Estilo**
- Fondo translúcido con blur: rgba(255, 255, 255, 0.85)
- Backdrop-filter: blur(20px)
- Border-bottom sutil
- Links con línea inferior rosa en hover

---

### 10. **Footer**
✅ **Estilo**
- Gradiente navy: #001F3F → #1A3A5C
- Texto en blanco
- Links con hover rosa

---

## 📱 Responsive Design

### Desktop (1024px+)
- 3-4 columnas en grids
- Navbar completo
- Hero pantalla completa

### Tablet (768px - 1024px)
- 2 columnas en grids
- Navbar comprimido

### Mobile (480px - 768px)
- 1 columna en grids
- Navbar simplificado
- Padding reducidos

---

## 🎯 Elementos Clave del Nuevo Diseño

### Gradientes
```css
/* Botones CTA */
linear-gradient(135deg, #FF6B9D 0%, #FF8FAB 100%)

/* Backgrounds */
linear-gradient(135deg, #F0F8FF 0%, #FFFFFF 50%, #E8F4F8 100%)
```

### Efecto Vidrio (Glassmorphism)
```css
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.6);
```

---

## ✨ Estado Final

La plataforma Náutica Jobs ahora presenta:
- ✅ **Tema Claro & Fresco**: Colores azul cielo, cian y blanco espuma
- ✅ **Hero Pantalla Completa**: Imagen de fondo a toda pantalla
- ✅ **Boxes Translúcidos**: Efecto glassmorphism moderno
- ✅ **Tipografía Moderna**: Outfit + DM Sans
- ✅ **Rosa para CTAs**: Solo en botones de llamada a la acción
- ✅ **Diseño Minimalista**: Esquinas redondeadas, sombras suaves
- ✅ **Efecto "Cool"**: Animaciones suaves, feel premium y profesional

---

**Última actualización**: Febrero 16, 2026
**Versión**: Modern Light Theme v2.0
