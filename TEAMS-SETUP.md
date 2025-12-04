# 🔵 Guía de Configuración de Microsoft Teams

## 📋 Índice
1. [Crear Webhook Entrante](#crear-webhook-entrante)
2. [Registrar Aplicación en Azure AD](#registrar-aplicación)
3. [Crear Manifest de Teams](#crear-manifest)
4. [Crear Íconos](#crear-íconos)
5. [Empaquetar y Subir](#empaquetar-app)
6. [Configurar Pestaña](#configurar-pestaña)
7. [Testing](#testing)

---

## 1️⃣ Crear Webhook Entrante

Para recibir notificaciones automáticas en Teams:

1. Abre **Microsoft Teams**
2. Navega al canal donde quieres recibir notificaciones
3. Haz clic en **⋯** (más opciones) → **Connectors** → **Incoming Webhook**
4. Haz clic en **Configure**
5. Dale un nombre: **Observatorio Inmobiliario**
6. (Opcional) Sube una imagen personalizada
7. Haz clic en **Create**
8. **Copia la URL del webhook** (¡guárdala de forma segura!)
9. Haz clic en **Done**

### Configurar en Azure App Service
```bash
az webapp config appsettings set \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --settings TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
```

### Prueba Local
Crea un archivo `.env` con:
```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

---

## 2️⃣ Registrar Aplicación en Azure AD

### Paso 1: Crear Registro de App

1. Ve al [Portal de Azure](https://portal.azure.com)
2. Navega a **Azure Active Directory**
3. Selecciona **App registrations** → **+ New registration**

### Paso 2: Configurar Registro

**Nombre:**
```
Observatorio Inmobiliario GIS
```

**Supported account types:**
- ☑️ Accounts in any organizational directory (Any Azure AD directory - Multitenant)

**Redirect URI (optional):**
- Platform: `Web`
- URI: `https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/auth-end`

Haz clic en **Register**

### Paso 3: Anotar Application (client) ID

En la página de Overview, copia:
- **Application (client) ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Paso 4: Crear Client Secret

1. Ve a **Certificates & secrets**
2. Haz clic en **+ New client secret**
3. Description: `Observatorio Teams App`
4. Expires: `24 months` (recomendado)
5. Haz clic en **Add**
6. **Copia el Value inmediatamente** (solo se muestra una vez)

### Paso 5: Configurar API Permissions

1. Ve a **API permissions**
2. Haz clic en **+ Add a permission**
3. Selecciona **Microsoft Graph**
4. Selecciona **Delegated permissions**
5. Busca y agrega:
   - `User.Read`
   - `offline_access`
6. Haz clic en **Add permissions**
7. Haz clic en **Grant admin consent** (si eres admin)

### Paso 6: Configurar Authentication

1. Ve a **Authentication**
2. En **Platform configurations**, selecciona tu Web platform
3. Marca las siguientes opciones:
   - ☑️ Access tokens
   - ☑️ ID tokens
4. En **Supported account types**, verifica que esté seleccionado:
   - Accounts in any organizational directory
5. Haz clic en **Save**

---

## 3️⃣ Crear Manifest de Teams

### Paso 1: Editar teams-manifest.json

Reemplaza los placeholders:

```json
{
  "id": "PEGA-AQUÍ-TU-APPLICATION-ID",
  "packageName": "com.ingenierialegal.observatorio",
  "developer": {
    "name": "Ingeniería Legal SAS",
    "websiteUrl": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net",
    "privacyUrl": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/privacy",
    "termsOfUseUrl": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/terms"
  },
  ...
  "configurableTabs": [
    {
      "configurationUrl": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/config.html",
      ...
    }
  ],
  "staticTabs": [
    {
      "contentUrl": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/index.html",
      "websiteUrl": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/",
      ...
    }
  ],
  "validDomains": [
    "observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net"
  ],
  "webApplicationInfo": {
    "id": "PEGA-AQUÍ-TU-APPLICATION-ID",
    "resource": "https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net"
  }
}
```

---

## 4️⃣ Crear Íconos

### Requisitos

**icon-color.png:**
- Tamaño: 192x192 píxeles
- Formato: PNG con fondo
- Colores: Usar verde #10b981 como color principal

**icon-outline.png:**
- Tamaño: 32x32 píxeles
- Formato: PNG transparente
- Estilo: Contorno blanco sobre fondo transparente

### Herramientas Recomendadas

- [Canva](https://www.canva.com/) - Diseño gráfico online
- [Figma](https://www.figma.com/) - Diseño de interfaces
- [GIMP](https://www.gimp.org/) - Editor de imágenes gratuito

### Plantilla Simple con HTML/Canvas

Puedes usar este código HTML para generar íconos básicos:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Generador de Íconos Teams</title>
</head>
<body>
  <h2>icon-color.png (192x192)</h2>
  <canvas id="colorIcon" width="192" height="192"></canvas>
  <br><button onclick="downloadColor()">Descargar</button>

  <h2>icon-outline.png (32x32)</h2>
  <canvas id="outlineIcon" width="32" height="32"></canvas>
  <br><button onclick="downloadOutline()">Descargar</button>

  <script>
    // Ícono a color
    const ctxColor = document.getElementById('colorIcon').getContext('2d');
    ctxColor.fillStyle = '#10b981';
    ctxColor.fillRect(0, 0, 192, 192);
    ctxColor.fillStyle = '#fff';
    ctxColor.font = 'bold 120px Arial';
    ctxColor.textAlign = 'center';
    ctxColor.textBaseline = 'middle';
    ctxColor.fillText('🏠', 96, 96);

    // Ícono outline
    const ctxOutline = document.getElementById('outlineIcon').getContext('2d');
    ctxOutline.strokeStyle = '#fff';
    ctxOutline.lineWidth = 2;
    ctxOutline.strokeRect(4, 4, 24, 24);
    ctxOutline.moveTo(16, 4);
    ctxOutline.lineTo(4, 12);
    ctxOutline.lineTo(28, 12);
    ctxOutline.closePath();
    ctxOutline.stroke();

    function downloadColor() {
      const canvas = document.getElementById('colorIcon');
      const link = document.createElement('a');
      link.download = 'icon-color.png';
      link.href = canvas.toDataURL();
      link.click();
    }

    function downloadOutline() {
      const canvas = document.getElementById('outlineIcon');
      const link = document.createElement('a');
      link.download = 'icon-outline.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  </script>
</body>
</html>
```

---

## 5️⃣ Empaquetar y Subir App

### Paso 1: Preparar Archivos

Estructura de carpeta:
```
teams-package/
├── manifest.json       (editado con tus datos)
├── icon-color.png      (192x192)
└── icon-outline.png    (32x32)
```

### Paso 2: Crear Package ZIP

**Windows:**
1. Selecciona los 3 archivos
2. Click derecho → **Enviar a** → **Carpeta comprimida (en ZIP)**
3. Renombra a `observatorio-teams.zip`

**macOS/Linux:**
```bash
zip -r observatorio-teams.zip manifest.json icon-color.png icon-outline.png
```

### Paso 3: Subir a Teams

1. Abre **Microsoft Teams**
2. Ve a **Apps** en la barra lateral
3. Haz clic en **Manage your apps** (abajo)
4. Haz clic en **Upload a custom app**
5. Selecciona **Upload for [tu organización]**
6. Selecciona el archivo `observatorio-teams.zip`
7. Haz clic en **Add**

---

## 6️⃣ Configurar Pestaña

### En un Canal de Equipo

1. Ve al canal donde quieres agregar el observatorio
2. Haz clic en el **+** junto a las pestañas
3. Busca **Observatorio INM** o **Observatorio Inmobiliario**
4. Haz clic en la app
5. Configura el nombre de la pestaña (ej: "Mapa GIS")
6. Haz clic en **Save**

### Como App Personal

1. Ve a **Apps**
2. Busca tu app **Observatorio INM**
3. Haz clic en **Add**
4. La app aparecerá en la barra lateral izquierda

---

## 7️⃣ Testing

### Probar Webhook

Ejecuta este código en Node.js o usa curl:

```javascript
const axios = require('axios');

const webhookUrl = 'TU-WEBHOOK-URL';

axios.post(webhookUrl, {
  '@type': 'MessageCard',
  '@context': 'https://schema.org/extensions',
  text: '🏠 ¡Hola desde el Observatorio Inmobiliario!'
})
.then(() => console.log('✅ Mensaje enviado'))
.catch(err => console.error('❌ Error:', err.message));
```

**O con curl:**
```bash
curl -X POST "TU-WEBHOOK-URL" \
  -H "Content-Type: application/json" \
  -d '{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "text": "🏠 ¡Hola desde el Observatorio!"
  }'
```

### Probar Notificaciones desde la App

```javascript
// En tu server.js o server-azure.js
const teamsBot = require('./teams-bot');

// Probar notificación de oferta
app.get('/test/teams', async (req, res) => {
  const testOffer = {
    ID: 'TEST-001',
    'Tipo de Inmueble': 'Lote Rural',
    Transacción: 'Venta',
    'Área Hec': 5.5,
    'Valor por unidad (COP)': 15000000,
    'valor Integral (COP)': 82500000,
    'Fecha del Registro': new Date().toISOString(),
    Descripción: 'Lote rural de prueba para Teams'
  };

  const sent = await teamsBot.notifyNewOffer(testOffer);

  res.json({
    success: sent,
    message: sent ? 'Notificación enviada' : 'Error al enviar'
  });
});
```

Luego visita: `https://tu-app.azurewebsites.net/test/teams`

---

## 🔧 Troubleshooting

### La app no aparece en Teams

- Verifica que el manifest.json esté correctamente formateado (usa un validador JSON)
- Verifica que el Application ID sea correcto
- Verifica que los íconos tengan el tamaño correcto
- Revisa los permisos de tu organización para apps personalizadas

### La pestaña no carga

- Verifica que la URL de tu app esté accesible públicamente
- Verifica los headers CORS y CSP en `web.config`
- Abre la consola del navegador (F12) para ver errores
- Verifica que HTTPS esté habilitado

### El webhook no envía mensajes

- Verifica que la URL del webhook sea correcta
- El webhook puede haber expirado (válido por 1 año)
- Verifica que el formato del mensaje sea correcto
- Revisa los logs de Azure

---

## 📚 Recursos

- [Teams Developer Portal](https://dev.teams.microsoft.com/)
- [Teams App Schema](https://developer.microsoft.com/json-schemas/teams/v1.16/MicrosoftTeams.schema.json)
- [Adaptive Cards Designer](https://adaptivecards.io/designer/)
- [Teams Webhooks Docs](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)

---

**Última actualización:** Diciembre 2025
