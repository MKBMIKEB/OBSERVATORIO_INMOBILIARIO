# 🏗️ Arquitectura del Sistema - Observatorio Inmobiliario

## 📊 Diagrama de Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐ │
│  │   Microsoft Teams    │  │   Navegador Web      │  │   Mobile (futuro) │ │
│  │                      │  │                      │  │                   │ │
│  │  • Pestaña Canal    │  │  • Chrome/Edge       │  │  • iOS/Android    │ │
│  │  • App Personal     │  │  • Firefox           │  │  • React Native   │ │
│  │  • Chat Grupal      │  │  • Safari            │  │                   │ │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘ │
└─────────────┼──────────────────────────┼──────────────────────────┼──────────┘
              │                          │                          │
              └──────────────────────────┼──────────────────────────┘
                                         │
                                    HTTPS/TLS
                                         │
┌────────────────────────────────────────┼────────────────────────────────────┐
│                    AZURE FRONT DOOR (opcional)                               │
│  • Load Balancing  • SSL Termination  • DDoS Protection  • WAF             │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │
┌────────────────────────────────────────┼────────────────────────────────────┐
│                      AZURE APP SERVICE                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Node.js/Express Server                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │  │
│  │  │   API REST   │  │  Static Web  │  │  Webhooks   │  │  Auth    │ │  │
│  │  │              │  │              │  │             │  │          │ │  │
│  │  │ /api/ofertas │  │ index.html   │  │ Teams Bot   │  │ Azure AD │ │  │
│  │  │ /api/normas  │  │ config.html  │  │ Handler     │  │ (futuro) │ │  │
│  │  │ /api/capas   │  │ *.js, *.css  │  │             │  │          │ │  │
│  │  │ /api/kmz     │  │              │  │             │  │          │ │  │
│  │  │ /health      │  │              │  │             │  │          │ │  │
│  │  └──────┬───────┘  └──────────────┘  └──────┬──────┘  └──────────┘ │  │
│  │         │                                     │                      │  │
│  │         └─────────────────┬───────────────────┘                      │  │
│  └───────────────────────────┼────────────────────────────────────────────┘ │
│                               │                                              │
│  ┌────────────────────────────┼────────────────────────────────┐            │
│  │         MIDDLEWARE LAYER   │                                │            │
│  │  • CORS Handler            │                                │            │
│  │  • Body Parser             │                                │            │
│  │  • Multer (File Upload)    │                                │            │
│  │  • Error Handler           │                                │            │
│  │  • Logger                  │                                │            │
│  └────────────────────────────┼────────────────────────────────┘            │
└─────────────────────────────────┼──────────────────────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
┌───────────────────▼──────────┐   ┌────────────▼──────────────────────────┐
│  AZURE BLOB STORAGE          │   │  LOCAL FILE SYSTEM                    │
│  (Producción)                │   │  (Desarrollo/Fallback)                │
│                              │   │                                       │
│  Container:                  │   │  Carpetas:                            │
│  • observatorio-uploads      │   │  • uploads/                           │
│                              │   │                                       │
│  Archivos:                   │   │  Archivos JSON:                       │
│  • Imágenes (JPG, PNG)       │   │  • inmuebles.json                     │
│  • Documentos (PDF)          │   │  • capas.json                         │
│  • Planos (TIFF, KML, KMZ)   │   │  • normas.json                        │
│  • Polígonos (GeoJSON)       │   │                                       │
│                              │   │                                       │
│  Features:                   │   │                                       │
│  • CDN Integration           │   │                                       │
│  • Automatic Backup          │   │                                       │
│  • Geo-Redundancy            │   │                                       │
└──────────────────────────────┘   └───────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                                   │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐ │
│  │   Microsoft Graph    │  │   Azure Active       │  │   Leaflet/ESRI    │ │
│  │   API                │  │   Directory          │  │   Map Services    │ │
│  │                      │  │                      │  │                   │ │
│  │  • User Info         │  │  • Authentication    │  │  • Base Maps      │ │
│  │  • Teams Presence    │  │  • Authorization     │  │  • Tile Layers    │ │
│  │  • Calendar          │  │  • User Management   │  │  • Geocoding      │ │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────┘ │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐ │
│  │   Application        │  │   Azure Monitor      │  │   Power BI        │ │
│  │   Insights           │  │   & Logs             │  │   (futuro)        │ │
│  │                      │  │                      │  │                   │ │
│  │  • Telemetry         │  │  • Real-time Logs    │  │  • Dashboards     │ │
│  │  • Performance       │  │  • Alerts            │  │  • Reports        │ │
│  │  • Exceptions        │  │  • Metrics           │  │  • Analytics      │ │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1. Carga de Nueva Oferta Inmobiliaria

```
Usuario en Teams/Web
        │
        ▼
   [Frontend HTML]
        │ POST multipart/form-data
        ▼
   [Express Server]
        │
        ├──► [Multer Middleware]
        │           │
        │           ├──► Guarda imágenes en Blob Storage/Local
        │           └──► Retorna URLs de archivos
        │
        ├──► [Validación de datos]
        │
        ├──► [Procesamiento]
        │           │
        │           ├──► Parse JSON (unidades fisiográficas)
        │           └──► Cálculos (valor/hectárea, etc.)
        │
        ├──► [Guardar en BD]
        │           │
        │           └──► inmuebles.json (o BD futura)
        │
        └──► [Notificación]
                    │
                    └──► [Teams Bot] ──► Webhook ──► Canal de Teams
                                                            │
                                                            ▼
                                                   Tarjeta Adaptativa
```

### 2. Visualización en Mapa

```
Usuario abre app
        │
        ▼
   [index.html carga]
        │
        ├──► Leaflet Map Init
        │
        ├──► GET /api/ofertas
        │           │
        │           ▼
        │      [Express Server]
        │           │
        │           ├──► Lee inmuebles.json
        │           └──► Retorna array de ofertas
        │
        ├──► Procesa datos en frontend
        │           │
        │           ├──► Crea marcadores por coordenadas
        │           ├──► Aplica filtros
        │           └──► Genera popups
        │
        └──► Renderiza en mapa
                    │
                    └──► Usuario interactúa (zoom, click, etc.)
```

### 3. Notificación Automática

```
Evento en sistema (nueva oferta/norma)
        │
        ▼
   [teams-bot.js]
        │
        ├──► Formatea datos
        │           │
        │           └──► Crea tarjeta adaptativa (JSON)
        │
        ├──► POST a Webhook URL
        │           │
        │           ▼
        │      [Microsoft Teams]
        │           │
        │           ├──► Valida payload
        │           └──► Publica en canal
        │
        └──► Usuarios reciben notificación
                    │
                    ├──► Desktop
                    ├──► Mobile
                    └──► Web
```

---

## 🧩 Componentes del Sistema

### Frontend

```
┌─────────────────────────────────────────────────┐
│              index.html                         │
│  ┌───────────────────────────────────────────┐ │
│  │  Leaflet Map Component                    │ │
│  │  • Base layers (OSM, satellite, etc.)     │ │
│  │  • Marker clusters                        │ │
│  │  • Polygons & overlays                    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  UI Controls (filtros.js)                 │ │
│  │  • Filtros por tipo/precio/área           │ │
│  │  • Búsqueda                               │ │
│  │  • Ordenamiento                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Forms (carga_ofertas.js)                 │ │
│  │  • Formulario de ofertas                  │ │
│  │  • Upload de archivos                     │ │
│  │  • Validación cliente                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Reports (reportBuilder.js)               │ │
│  │  • Generación PDF                         │ │
│  │  • Exportación Excel                      │ │
│  │  • Screenshots de mapa                    │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Backend

```
┌─────────────────────────────────────────────────┐
│          server.js / server-azure.js            │
│  ┌───────────────────────────────────────────┐ │
│  │  Express App                              │ │
│  │  • Middleware stack                       │ │
│  │  • Route handlers                         │ │
│  │  • Error handling                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  API Endpoints                            │ │
│  │  • /api/ofertas (GET, POST)               │ │
│  │  • /api/normas (GET, POST)                │ │
│  │  • /api/capas-imagen (GET, POST)          │ │
│  │  • /api/kmz/* (GET)                       │ │
│  │  • /planos/:name.png (GET)                │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  File Processing                          │ │
│  │  • Multer (upload)                        │ │
│  │  • Sharp (image conversion)               │ │
│  │  • JSZip (KMZ extraction)                 │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Teams Integration (teams-bot.js)         │ │
│  │  • Webhook sender                         │ │
│  │  • Card templates                         │ │
│  │  • Event handlers                         │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad

### Capas de Seguridad

```
┌─────────────────────────────────────────────────┐
│  1. Transport Layer Security (TLS/HTTPS)        │
│     • Certificado SSL automático de Azure       │
│     • Forzar HTTPS en todas las requests        │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  2. Azure App Service Security                  │
│     • IP restrictions (opcional)                │
│     • CORS configurado para Teams               │
│     • Headers de seguridad (CSP, X-Frame)       │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  3. Application Layer Security                  │
│     • Input validation                          │
│     • File type restrictions                    │
│     • Size limits (50MB)                        │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  4. Data Security                               │
│     • Environment variables para secretos       │
│     • Azure Blob Storage encryption             │
│     • No credentials en código                  │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  5. Azure AD Authentication (futuro)            │
│     • OAuth 2.0                                 │
│     • Single Sign-On                            │
│     • Role-based access control                 │
└─────────────────────────────────────────────────┘
```

---

## 📈 Escalabilidad

### Arquitectura Escalable

```
             [Azure Front Door] (opcional)
                     │
        ┌────────────┼────────────┐
        │            │            │
   [Instance 1] [Instance 2] [Instance 3]
   App Service  App Service  App Service
        │            │            │
        └────────────┼────────────┘
                     │
              [Shared Storage]
         ┌────────────┴────────────┐
         │                         │
  [Azure Blob Storage]     [Azure SQL DB]
  (archivos)               (futuro - datos)
```

### Auto-scaling Configurado

```
Métricas de escalamiento:
┌─────────────────────────────────────────┐
│  • CPU > 70%  ──► Scale Out (+1)        │
│  • CPU < 30%  ──► Scale In (-1)         │
│  • Min: 1 instance                      │
│  • Max: 3 instances                     │
│  • Cooldown: 5 minutos                  │
└─────────────────────────────────────────┘
```

---

## 🔄 CI/CD Pipeline (Futuro)

```
Developer
    │
    ▼ git push
[GitHub Repository]
    │
    │ webhook trigger
    ▼
[GitHub Actions]
    │
    ├──► Run Tests (npm test)
    │
    ├──► Build (npm run build)
    │
    ├──► Security Scan
    │
    └──► Deploy
            │
            ▼
    [Azure App Service]
            │
            ├──► Staging Slot
            │           │
            │           ├──► Smoke Tests
            │           └──► Swap to Production
            │
            └──► Production
                        │
                        └──► Send notification to Teams
```

---

## 📊 Monitoreo y Observabilidad

```
┌────────────────────────────────────────────────────┐
│             Application Insights                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  • Request telemetry                         │ │
│  │  • Exception tracking                        │ │
│  │  • Custom events                             │ │
│  │  • Performance metrics                       │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼─────┐  ┌──────▼──────┐
│ Azure        │  │  Azure     │  │   Power BI  │
│ Monitor      │  │  Alerts    │  │  Dashboards │
│              │  │            │  │             │
│ • Logs       │  │ • Email    │  │ • Real-time │
│ • Metrics    │  │ • SMS      │  │ • Analytics │
│ • Dashboards │  │ • Teams    │  │ • Reports   │
└──────────────┘  └────────────┘  └─────────────┘
```

---

## 💡 Buenas Prácticas Implementadas

### ✅ Código
- Separación de responsabilidades (server.js vs server-azure.js)
- Módulos reutilizables (teams-bot.js, azure-blob-config.js)
- Manejo de errores consistente
- Logging estructurado

### ✅ Configuración
- Variables de entorno para secretos
- Configuración por ambiente (dev/prod)
- Headers de seguridad
- CORS apropiado

### ✅ Despliegue
- Scripts automatizados (PowerShell)
- Documentación completa
- Checklist de verificación
- Rollback plan

### ✅ Operaciones
- Health checks
- Logs centralizados
- Monitoreo activo
- Alertas configuradas

---

**Última actualización:** Diciembre 2025
**Versión de Arquitectura:** 1.0.0
