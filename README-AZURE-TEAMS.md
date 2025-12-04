# 🏠 Observatorio Inmobiliario - Azure & Teams

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Azure](https://img.shields.io/badge/Azure-App_Service-blue)
![Teams](https://img.shields.io/badge/Microsoft-Teams-purple)
![License](https://img.shields.io/badge/License-ISC-yellow)

Sistema de observatorio inmobiliario con análisis GIS integrado con Microsoft Teams y desplegado en Azure.

---

## 📋 Contenido

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Inicio Rápido](#inicio-rápido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [API](#api)
- [Teams Integration](#teams-integration)
- [Soporte](#soporte)

---

## ✨ Características

### 🗺️ Visualización GIS
- **Mapa interactivo** con Leaflet
- **Capas cartográficas** georreferenciadas
- **Marcadores personalizados** para ofertas
- **Polígonos de inmuebles**
- **Integración KMZ/KML** (Banco Agrario)

### 📊 Gestión de Datos
- **CRUD de ofertas** inmobiliarias
- **Gestión de normas** urbanísticas
- **Carga de archivos** (imágenes, PDFs, planos)
- **Conversión TIFF → PNG** on-the-fly
- **Almacenamiento local** o Azure Blob Storage

### 🔵 Integración Microsoft Teams
- **Pestañas personalizadas** en canales
- **Notificaciones automáticas** vía webhooks
- **Tarjetas adaptativas** para eventos
- **App personal** para usuarios

### ☁️ Azure Cloud
- **App Service** para hosting
- **Blob Storage** (opcional) para archivos
- **Auto-scaling** configurable
- **HTTPS** habilitado
- **Logs centralizados**

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                 Microsoft Teams                     │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Canal   │  │   Chat   │  │  App Personal   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │
└───────┼─────────────┼─────────────────┼────────────┘
        │             │                 │
        └─────────────┼─────────────────┘
                      │ HTTPS
        ┌─────────────▼─────────────────────────────┐
        │         Azure App Service                 │
        │  ┌────────────────────────────────────┐   │
        │  │   Node.js/Express Server           │   │
        │  │  - API REST                        │   │
        │  │  - Webhook handler                 │   │
        │  │  - Static files                    │   │
        │  └────────────┬───────────────────────┘   │
        └───────────────┼───────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌─────────▼──────────┐
│ Azure Blob     │            │  Local Storage     │
│ Storage        │            │  - uploads/        │
│ - Archivos     │     o      │  - inmuebles.json  │
│ - Imágenes     │            │  - capas.json      │
│ - Documentos   │            │  - normas.json     │
└────────────────┘            └────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerrequisitos
```bash
# Instalar Node.js 18+
node --version  # >= 18.0.0

# Instalar Azure CLI
az --version

# Instalar Git
git --version
```

### Despliegue Automático (Windows)
```powershell
# 1. Desplegar infraestructura
.\deploy-azure.ps1

# 2. Configurar variables de entorno
.\setup-env.ps1

# 3. Desplegar código
git remote add azure <URL-proporcionada>
git push azure master
```

### Despliegue Manual
Ver [QUICKSTART.md](./QUICKSTART.md) para instrucciones detalladas.

---

## 📁 Estructura del Proyecto

```
OBSERVATORIO_INMOBILIARIO/
├── 📄 server.js                    # Servidor principal
├── 📄 server-azure.js              # Servidor optimizado para Azure
├── 📄 teams-bot.js                 # Bot de Teams (notificaciones)
├── 📄 azure-blob-config.js         # Configuración Blob Storage
│
├── 🌐 index.html                   # Frontend principal
├── 🎨 config.html                  # Configuración Teams
│
├── 📜 carga_ofertas.js             # Lógica de ofertas
├── 📜 filtros.js                   # Filtros de búsqueda
├── 📜 reportBuilder.js             # Generador de reportes
├── 📜 calculosmercado.js           # Análisis de mercado
├── 📜 exportMap.js                 # Exportación de mapas
│
├── ⚙️ web.config                   # Configuración IIS/Azure
├── ⚙️ .deployment                  # Script de despliegue
├── ⚙️ deploy.cmd                   # Comando de despliegue
├── ⚙️ azure-config.json            # Configuración Azure
├── ⚙️ teams-manifest.json          # Manifest de Teams
│
├── 📁 uploads/                     # Archivos subidos
├── 📁 node_modules/                # Dependencias
│
├── 📊 inmuebles.json               # Base de datos ofertas
├── 📊 capas.json                   # Capas cartográficas
├── 📊 normas.json                  # Normas urbanísticas
│
├── 📚 README-AZURE-TEAMS.md        # Este archivo
├── 📚 DEPLOYMENT.md                # Guía completa de despliegue
├── 📚 TEAMS-SETUP.md               # Configuración Teams
├── 📚 QUICKSTART.md                # Inicio rápido
│
├── 🔧 .env.example                 # Ejemplo variables de entorno
├── 🔧 package.json                 # Dependencias Node.js
├── 🔧 package-azure.json           # Dependencias para Azure
│
└── 🚀 Scripts PowerShell:
    ├── deploy-azure.ps1            # Despliegue automatizado
    └── setup-env.ps1               # Configuración variables
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | ⚡ Guía de inicio rápido (15 min) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 📖 Guía completa de despliegue |
| [TEAMS-SETUP.md](./TEAMS-SETUP.md) | 🔵 Configuración de Teams paso a paso |
| [.env.example](./.env.example) | 🔐 Variables de entorno requeridas |

---

## 🔌 API

### Endpoints Principales

#### Ofertas Inmobiliarias
```http
GET    /api/ofertas           # Listar todas las ofertas
POST   /api/ofertas           # Crear nueva oferta
```

#### Capas Cartográficas
```http
GET    /api/capas-imagen      # Listar capas
POST   /api/capas-imagen      # Agregar capa
```

#### Normas Urbanísticas
```http
GET    /api/normas            # Listar normas
POST   /api/normas            # Agregar norma
```

#### KMZ/KML (Banco Agrario)
```http
GET    /api/kmz/banco-agrario # Obtener KML
GET    /api/kmz/info          # Info del archivo
```

#### Conversión de Planos
```http
GET    /planos/:name.png      # TIFF → PNG on-the-fly
```

#### Health Check
```http
GET    /health                # Estado del servidor
```

### Ejemplo: Crear Oferta

```javascript
const formData = new FormData();
formData.append('ID', 'OF-001');
formData.append('Tipo de Inmueble', 'Lote Rural');
formData.append('Transaccion', 'Venta');
formData.append('Area Hec', '5.5');
formData.append('Valor por unidad (COP)', '15000000');
formData.append('Latitud', '4.6097');
formData.append('Longitud', '-74.0817');
formData.append('imagenes', fileInput.files[0]);

fetch('https://tu-app.azurewebsites.net/api/ofertas', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log('Oferta creada:', data));
```

---

## 🔵 Teams Integration

### Webhooks - Notificaciones Automáticas

```javascript
const teamsBot = require('./teams-bot');

// Notificar nueva oferta
await teamsBot.notifyNewOffer({
  ID: 'OF-001',
  'Tipo de Inmueble': 'Lote Rural',
  Transacción: 'Venta',
  'Área Hec': 5.5,
  'Valor por unidad (COP)': 15000000
});

// Notificar nueva norma
await teamsBot.notifyNewNorm({
  titulo: 'POT Bogotá 2024',
  ano: '2024',
  departamento: 'Cundinamarca',
  municipio: 'Bogotá'
});

// Reportes diarios
await teamsBot.notifyDailyStats({
  totalOfertas: 150,
  nuevasHoy: 5,
  totalNormas: 23
});
```

### Pestañas Personalizadas

La aplicación puede agregarse como pestaña en:
- ✅ Canales de equipo
- ✅ Chats grupales
- ✅ App personal

Ver [TEAMS-SETUP.md](./TEAMS-SETUP.md) para instrucciones.

---

## 🔐 Variables de Entorno

```env
# Azure Storage (Opcional)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
AZURE_STORAGE_CONTAINER_NAME=observatorio-uploads

# Server
PORT=8080
NODE_ENV=production

# Teams
TEAMS_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TEAMS_APP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Application
APP_URL=https://tu-app.azurewebsites.net
```

---

## 🛠️ Comandos Útiles

### Desarrollo Local
```bash
npm install
npm start                    # Puerto 3000
```

### Azure CLI
```bash
# Ver logs en tiempo real
az webapp log tail --name tu-app --resource-group rg-observatorio

# Reiniciar aplicación
az webapp restart --name tu-app --resource-group rg-observatorio

# Abrir en navegador
az webapp browse --name tu-app --resource-group rg-observatorio

# Ver configuración
az webapp config appsettings list --name tu-app --resource-group rg-observatorio
```

### Git
```bash
# Primera vez
git init
git add .
git commit -m "Initial deployment"
git remote add azure <URL>
git push azure master

# Actualizaciones
git add .
git commit -m "Update"
git push azure master
```

---

## 📊 Monitoreo

### Azure Portal
1. Ve a tu App Service
2. **Monitoring** → **Metrics**
3. Visualiza:
   - CPU %
   - Memory %
   - HTTP requests
   - Response time

### Application Insights (Opcional)
```bash
az monitor app-insights component create \
  --app observatorio-insights \
  --location eastus \
  --resource-group rg-observatorio
```

---

## 🚨 Troubleshooting

### Error: App no inicia
```bash
# Ver logs
az webapp log tail --name tu-app --resource-group rg-observatorio

# Verificar variables
az webapp config appsettings list --name tu-app --resource-group rg-observatorio
```

### Error: CORS en Teams
Verifica en `web.config`:
```xml
<add name="Access-Control-Allow-Origin" value="https://teams.microsoft.com"/>
```

### Error: Archivos no suben
Verifica límite en `web.config`:
```xml
<requestLimits maxAllowedContentLength="52428800" /> <!-- 50MB -->
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 License

ISC © Ingeniería Legal SAS

---

## 📞 Soporte

- 📧 Email: soporte@ingenierialegal.com
- 📖 Documentación: [docs/](./docs/)
- 🐛 Issues: [GitHub Issues](./issues)

---

## 🎯 Roadmap

- [ ] Dashboard de analytics
- [ ] Exportación a Excel/PDF mejorada
- [ ] Integración con Power BI
- [ ] Bot conversacional en Teams
- [ ] API GraphQL
- [ ] Mobile App (React Native)
- [ ] Machine Learning para predicciones

---

## 🙏 Agradecimientos

- [Leaflet](https://leafletjs.com/) - Mapas interactivos
- [Express](https://expressjs.com/) - Framework web
- [Sharp](https://sharp.pixelplumbing.com/) - Procesamiento de imágenes
- [Azure](https://azure.microsoft.com/) - Cloud hosting
- [Microsoft Teams](https://www.microsoft.com/microsoft-teams/) - Colaboración

---

**Última actualización:** Diciembre 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción
