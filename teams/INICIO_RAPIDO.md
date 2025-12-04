# 🚀 Inicio Rápido - Despliegue en Teams

## ✅ Archivos Creados

En la carpeta `teams/` encontrarás:
- `manifest.json` - Configuración de la app para Teams
- `build-package.js` - Script para generar el paquete
- `README_TEAMS.md` - Documentación completa
- `CREAR_ICONOS.md` - Guía para crear iconos
- `icon-template.svg` - Plantilla para el ícono

Además:
- `config.html` - Página de configuración para Teams (en raíz)

## 🎯 3 Pasos para Desplegar

### 1️⃣ Preparar Servidor Público (Elige uno)

**OPCIÓN A - ngrok (Pruebas - 5 minutos)**
```bash
# Descargar ngrok de: https://ngrok.com/download
# Extraer y ejecutar:
ngrok http 3000

# Copiar la URL HTTPS (ej: https://abc123.ngrok.io)
```

**OPCIÓN B - Azure (Producción - 15 minutos)**
1. Ir a https://portal.azure.com
2. Crear → App Service
3. Nombre: `observatorio-inm`
4. Runtime: Node 18 LTS
5. Región: East US
6. Deploy: Git/GitHub
7. Copiar URL (ej: https://observatorio-inm.azurewebsites.net)

### 2️⃣ Crear Iconos

**Opción Rápida - Usar emojis como placeholders:**

```bash
# Instalar ImageMagick (si no lo tienes)
# Windows: https://imagemagick.org/script/download.php

# Crear color.png (192x192)
convert -size 192x192 xc:#10b981 -fill white -gravity center \
  -pointsize 72 -annotate 0 "🏠" teams/color.png

# Crear outline.png (32x32)
convert -size 32x32 xc:transparent -fill white -gravity center \
  -pointsize 24 -annotate 0 "🏠" teams/outline.png
```

**O sigue la guía**: [CREAR_ICONOS.md](./CREAR_ICONOS.md)

### 3️⃣ Generar y Subir Paquete

```bash
# 1. Generar paquete (reemplaza con tu URL)
cd teams
node build-package.js https://abc123.ngrok.io

# 2. Se creará: ObservatorioInmobiliario.zip

# 3. Subir a Teams:
#    - Abrir Microsoft Teams
#    - Apps → Administrar aplicaciones
#    - Cargar aplicación personalizada
#    - Seleccionar ObservatorioInmobiliario.zip
#    - ¡Listo!
```

## ⚡ Método Ultra Rápido (Solo Pruebas)

Si solo quieres probar rápidamente:

```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2: Iniciar ngrok
ngrok http 3000

# Terminal 3: Generar paquete
cd teams
node build-package.js https://TU-URL-NGROK.ngrok.io
```

Luego sube el ZIP a Teams.

## 📋 Checklist Mínimo

Antes de subir a Teams, verifica:

- [ ] Servidor corriendo en local (puerto 3000)
- [ ] ngrok/Azure mostrando la URL pública con HTTPS
- [ ] Iconos creados (color.png y outline.png en teams/)
- [ ] Paquete ZIP generado (ObservatorioInmobiliario.zip)
- [ ] Teams abierto con permisos para cargar apps

## 🎮 Prueba Rápida

Para verificar que todo funciona ANTES de subir a Teams:

```bash
# Abrir en navegador
https://TU-URL/config.html

# Deberías ver la página de configuración
```

## 🆘 Problemas Comunes

### "No puedo cargar apps personalizadas"
**Solución**: Contacta al admin de Microsoft 365 para habilitar apps personalizadas.

### "La app no carga en Teams"
**Solución**: Verifica que la URL sea HTTPS (no HTTP).

### "Error: Cannot find module 'archiver'"
**Solución**:
```bash
npm install archiver
```

### "Los iconos no se muestran"
**Solución**: Verifica que los PNG estén en la carpeta `teams/` y tengan exactamente los nombres:
- `color.png` (192x192 px)
- `outline.png` (32x32 px)

## 📞 Necesitas Ayuda?

Lee la documentación completa en: [README_TEAMS.md](./README_TEAMS.md)

O contacta a soporte técnico.

---

**💡 Tip Pro**: Una vez desplegado, puedes actualizar la app simplemente generando un nuevo ZIP con la misma ID y subiéndolo de nuevo.
