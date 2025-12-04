# 📱 Despliegue en Microsoft Teams - Observatorio Inmobiliario

## 🎯 Requisitos Previos

1. **Servidor público con HTTPS** (obligatorio para Teams)
   - Azure App Service (recomendado)
   - ngrok (para pruebas)
   - Otro hosting con SSL

2. **Permisos en Teams**
   - Administrador del tenant de Microsoft 365
   - O permisos para cargar apps personalizadas

## 📋 Pasos para Desplegar

### Paso 1: Preparar el Servidor Público

#### Opción A: Usar ngrok (Pruebas rápidas)
```bash
# Instalar ngrok (si no lo tienes)
# Descargar de: https://ngrok.com/download

# Iniciar túnel
ngrok http 3000

# Copiar la URL HTTPS que te da (ej: https://abc123.ngrok.io)
```

#### Opción B: Azure App Service (Producción)
1. Crear App Service en Azure Portal
2. Configurar deployment desde Git/GitHub
3. Obtener la URL (ej: https://observatorio-inm.azurewebsites.net)

### Paso 2: Generar GUID Único

Ejecuta en PowerShell:
```powershell
[guid]::NewGuid()
```

O en Node.js:
```javascript
node -e "console.log(require('crypto').randomUUID())"
```

### Paso 3: Configurar el Manifest

1. Abre `teams/manifest.json`
2. Reemplaza:
   - `{{GENERA-UN-GUID-UNICO}}` → Tu GUID generado
   - `{{TU-DOMINIO}}.com` → Tu URL pública (sin https://)
   - `{{AZURE-APP-ID}}` → ID de tu app en Azure AD (opcional)

Ejemplo:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "developer": {
    "websiteUrl": "https://abc123.ngrok.io",
    ...
  },
  "validDomains": [
    "abc123.ngrok.io",
    ...
  ]
}
```

### Paso 4: Crear Iconos

Necesitas dos iconos PNG:

**color.png** (192x192 px)
- Fondo de color
- Logo de la empresa
- Formato PNG

**outline.png** (32x32 px)
- Fondo transparente
- Outline blanco
- Formato PNG

Puedes usar estas herramientas:
- Canva: https://www.canva.com
- Photopea: https://www.photopea.com
- GIMP: Gratuito

Coloca ambos archivos en la carpeta `teams/`

### Paso 5: Crear el Paquete ZIP

```bash
cd teams/
zip -r ../ObservatorioInmobiliario.zip manifest.json color.png outline.png
```

O en Windows:
1. Selecciona `manifest.json`, `color.png` y `outline.png`
2. Click derecho → Enviar a → Carpeta comprimida (en zip)
3. Renombra a `ObservatorioInmobiliario.zip`

**IMPORTANTE**: El ZIP debe contener los archivos directamente, NO una carpeta.

### Paso 6: Subir a Teams

1. Abre Microsoft Teams
2. Ve a **Apps** (panel izquierdo)
3. Click en **Administrar tus aplicaciones**
4. Click en **Cargar una aplicación personalizada**
5. Selecciona **Cargar para mí** o **Cargar para [tu organización]**
6. Selecciona el archivo `ObservatorioInmobiliario.zip`
7. Click en **Agregar**

### Paso 7: Configurar en un Canal

1. Ve a un equipo/canal
2. Click en el botón **+** (agregar pestaña)
3. Busca "Observatorio Inmobiliario"
4. Click en la app
5. Configura según necesites
6. Click en **Guardar**

## 🔧 Configuración Avanzada

### Variables de Entorno

Crear archivo `.env`:
```env
PORT=3000
NODE_ENV=production
TEAMS_APP_ID=tu-app-id
```

### CORS para Teams

Asegúrate de que el servidor acepta requests de Teams:
```javascript
app.use(cors({
  origin: [
    'https://teams.microsoft.com',
    'https://*.teams.microsoft.com',
    'https://*.office.com'
  ]
}));
```

### Content Security Policy

Agregar headers CSP para Teams:
```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors teams.microsoft.com *.teams.microsoft.com *.skype.com"
  );
  next();
});
```

## 🐛 Troubleshooting

### Error: "App blocked by Content Security Policy"
Agrega los headers CSP mencionados arriba.

### Error: "Unable to load tab"
Verifica que:
- La URL es HTTPS (no HTTP)
- El servidor está corriendo
- Los dominios en validDomains son correctos

### Los mapas no cargan
Agrega todos los dominios de tiles a `validDomains`:
- `*.tile.openstreetmap.org`
- `server.arcgisonline.com`
- etc.

### Error de CORS
Configura CORS en el servidor para aceptar Teams.

## 📚 Recursos

- [Documentación Teams Apps](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- [Teams App Manifest Schema](https://docs.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Developer Portal for Teams](https://dev.teams.microsoft.com/)

## ✅ Checklist Pre-Deploy

- [ ] Servidor público con HTTPS configurado
- [ ] GUID único generado
- [ ] manifest.json configurado con URLs correctas
- [ ] Iconos creados (color.png y outline.png)
- [ ] ZIP creado correctamente
- [ ] CORS configurado en servidor
- [ ] CSP headers agregados
- [ ] Aplicación probada en navegador
- [ ] Permisos de Teams obtenidos

## 🚀 Deploy Automático (Opcional)

Puedes usar GitHub Actions para deploy automático a Azure:

```yaml
name: Deploy to Azure
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: azure/webapps-deploy@v2
        with:
          app-name: observatorio-inm
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

## 📞 Soporte

Para ayuda adicional:
- Email: soporte@ingenierialegal.com
- Teams: Canal de IT
