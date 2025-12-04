# 🎨 Cómo Crear los Iconos para Teams

Necesitas crear 2 iconos PNG:

## 1. color.png (192x192 px)

### Opción A: Usar Canva (Más fácil)

1. Ve a https://www.canva.com
2. Crea un diseño de **192 x 192 px**
3. Usa el degradado verde: `#10b981` → `#059669`
4. Agrega un ícono de casa/edificio blanco en el centro
5. Agrega texto "OBSERVATORIO" abajo
6. Descarga como PNG
7. Renombra a `color.png` y muévelo a la carpeta `teams/`

### Opción B: Usar la plantilla SVG

1. Abre `icon-template.svg` en un navegador
2. Click derecho → Guardar imagen como PNG
3. Renombra a `color.png`
4. Mueve a la carpeta `teams/`

### Opción C: Usar una herramienta online

**Convertir SVG a PNG:**
1. Ve a https://svgtopng.com/
2. Sube `icon-template.svg`
3. Establece tamaño: 192x192
4. Descarga y renombra a `color.png`

**O usa Photopea (Photoshop gratis online):**
1. Ve a https://www.photopea.com
2. Nuevo proyecto: 192x192 px
3. Fondo: Degradado verde (#10b981 → #059669)
4. Agrega ícono blanco de casa/edificio
5. Exporta como PNG
6. Renombra a `color.png`

## 2. outline.png (32x32 px)

### Especificaciones:
- Tamaño: 32x32 px
- Fondo: Transparente
- Dibujo: Blanco (#FFFFFF)
- Debe ser simple (outline/silueta)

### Opción A: Usar Canva

1. Crea diseño de **32 x 32 px**
2. Fondo: Transparente
3. Agrega ícono simple de casa en blanco
4. Descarga como PNG
5. Renombra a `outline.png`

### Opción B: Usar icon-finder

1. Ve a https://www.flaticon.com/free-icons/house
2. Busca "house outline"
3. Descarga PNG de 32x32
4. Abre en Photopea
5. Cambia color a blanco
6. Fondo transparente
7. Exporta como PNG
8. Renombra a `outline.png`

### Opción C: Crear manualmente

```html
<!-- Guarda esto como outline.html y ábrelo en el navegador -->
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="transparent"/>
  <path d="M16,6 L28,14 L28,28 L4,28 L4,14 Z"
        fill="none"
        stroke="white"
        stroke-width="2"/>
  <path d="M16,3 L30,14"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"/>
  <path d="M16,3 L2,14"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"/>
</svg>
<!-- Click derecho → Guardar como PNG → Renombrar a outline.png -->
```

## ✅ Verificación

Una vez creados los iconos:

1. **color.png**
   - [ ] Tamaño exacto: 192x192 px
   - [ ] Formato: PNG
   - [ ] Tiene color de fondo
   - [ ] Se ve el logo/ícono claramente

2. **outline.png**
   - [ ] Tamaño exacto: 32x32 px
   - [ ] Formato: PNG
   - [ ] Fondo transparente
   - [ ] Dibujo en blanco

3. Ambos iconos están en la carpeta `teams/`

## 🚀 Siguiente Paso

Una vez tengas ambos iconos:

```bash
cd teams
node build-package.js https://TU-URL-PUBLICA.com
```

Esto generará `ObservatorioInmobiliario.zip` listo para subir a Teams.

## 📸 Ejemplos de Referencia

Busca inspiración en estas apps de Teams:
- Planner (ícono de tablero)
- OneNote (ícono de libreta)
- Forms (ícono de formulario)

El estilo debe ser:
- Minimalista
- Profesional
- Con colores corporativos (#10b981 - verde)
- Fácilmente reconocible a tamaño pequeño
