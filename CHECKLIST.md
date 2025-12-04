# ✅ Checklist de Despliegue - Observatorio Inmobiliario

## 📋 Pre-Despliegue

### Herramientas y Cuentas
- [ ] Node.js 18+ instalado
- [ ] Azure CLI instalado y configurado
- [ ] Git instalado
- [ ] Cuenta de Azure activa con suscripción
- [ ] Cuenta de Microsoft 365 (para Teams)
- [ ] Editor de texto/IDE

### Verificar Instalaciones
```bash
node --version    # >= 18.0.0
npm --version     # >= 9.0.0
az --version      # Última versión
git --version     # Cualquier versión reciente
```

---

## ☁️ Fase 1: Azure Infrastructure

### 1.1 Login y Configuración Básica
- [ ] Ejecutar `az login`
- [ ] Verificar suscripción activa: `az account show`
- [ ] Seleccionar suscripción (si tienes múltiples):
  ```bash
  az account set --subscription "Nombre o ID"
  ```

### 1.2 Crear Resource Group
- [ ] Definir nombre: `rg-observatorio-inmobiliario`
- [ ] Seleccionar región: `eastus` (o la de tu preferencia)
- [ ] Ejecutar:
  ```bash
  az group create \
    --name rg-observatorio-inmobiliario \
    --location eastus
  ```
- [ ] Verificar creación en Azure Portal

### 1.3 Crear App Service Plan
- [ ] Definir nombre: `plan-observatorio`
- [ ] Seleccionar SKU: `B1` (básico) o superior
- [ ] Ejecutar:
  ```bash
  az appservice plan create \
    --name plan-observatorio \
    --resource-group rg-observatorio-inmobiliario \
    --sku B1 \
    --is-linux
  ```
- [ ] Verificar estado: `Ready`

### 1.4 Crear Web App
- [ ] Definir nombre único: `observatorio-inmobiliario-[tu-empresa]`
- [ ] Verificar disponibilidad del nombre
- [ ] Ejecutar:
  ```bash
  az webapp create \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario \
    --plan plan-observatorio \
    --runtime "NODE:18-lts"
  ```
- [ ] Anotar URL: `https://observatorio-inmobiliario-[tu-empresa].azurewebsites.net`

### 1.5 Configuración Básica
- [ ] Habilitar HTTPS:
  ```bash
  az webapp update \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario \
    --https-only true
  ```
- [ ] Configurar variables básicas:
  ```bash
  az webapp config appsettings set \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario \
    --settings \
      NODE_ENV=production \
      PORT=8080 \
      WEBSITE_NODE_DEFAULT_VERSION=18-lts
  ```

---

## 🔵 Fase 2: Microsoft Teams Setup

### 2.1 Crear Webhook Entrante
- [ ] Abrir Microsoft Teams
- [ ] Navegar al canal deseado
- [ ] Hacer clic en `⋯` → `Connectors`
- [ ] Buscar "Incoming Webhook"
- [ ] Configurar:
  - Nombre: `Observatorio Inmobiliario`
  - Descripción: `Notificaciones automáticas`
- [ ] Copiar URL del webhook
- [ ] Guardar URL de forma segura

### 2.2 Registrar App en Azure AD
- [ ] Ir a [Azure Portal](https://portal.azure.com)
- [ ] Azure Active Directory → App registrations → New registration
- [ ] Configurar:
  - Name: `Observatorio Inmobiliario GIS`
  - Supported account types: `Multitenant`
  - Redirect URI: `https://observatorio-inmobiliario-[tu-empresa].azurewebsites.net/auth-end`
- [ ] Click en `Register`
- [ ] **Anotar Application (client) ID**: `______________________`
- [ ] **Anotar Directory (tenant) ID**: `______________________`

### 2.3 Crear Client Secret
- [ ] Ir a `Certificates & secrets`
- [ ] Click en `+ New client secret`
- [ ] Description: `Observatorio Teams App`
- [ ] Expires: `24 months`
- [ ] Click en `Add`
- [ ] **Copiar Value INMEDIATAMENTE**: `______________________`
- [ ] Guardar de forma segura (no se vuelve a mostrar)

### 2.4 Configurar Permisos API
- [ ] Ir a `API permissions`
- [ ] Click en `+ Add a permission`
- [ ] Microsoft Graph → Delegated permissions
- [ ] Seleccionar:
  - [ ] `User.Read`
  - [ ] `offline_access`
- [ ] Click en `Add permissions`
- [ ] (Si eres admin) Click en `Grant admin consent`

### 2.5 Configurar Variables en Azure
- [ ] Ejecutar:
  ```bash
  az webapp config appsettings set \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario \
    --settings \
      TEAMS_APP_ID="<tu-application-id>" \
      TEAMS_APP_PASSWORD="<tu-client-secret>" \
      TEAMS_WEBHOOK_URL="<tu-webhook-url>" \
      APP_URL="https://observatorio-inmobiliario-[tu-empresa].azurewebsites.net"
  ```

---

## 📦 Fase 3: Preparar Teams Package

### 3.1 Editar Manifest
- [ ] Abrir `teams-manifest.json`
- [ ] Reemplazar `{{TEAMS_APP_ID}}` con tu Application ID
- [ ] Reemplazar todas las ocurrencias de `{{APP_URL}}`
- [ ] Reemplazar `{{APP_URL_DOMAIN}}`
- [ ] Verificar formato JSON (usar validador online)

### 3.2 Crear Íconos
- [ ] Crear `icon-color.png` (192x192 px)
  - Fondo de color (#10b981)
  - Logo o emoji 🏠
- [ ] Crear `icon-outline.png` (32x32 px)
  - Fondo transparente
  - Contorno blanco
- [ ] Verificar tamaños exactos

### 3.3 Crear Package ZIP
- [ ] Crear carpeta temporal: `teams-package/`
- [ ] Copiar archivos:
  - [ ] `manifest.json` (editado)
  - [ ] `icon-color.png`
  - [ ] `icon-outline.png`
- [ ] Crear ZIP: `observatorio-teams.zip`
- [ ] Verificar que ZIP contiene exactamente 3 archivos

### 3.4 Instalar App en Teams
- [ ] Abrir Microsoft Teams
- [ ] Ir a `Apps` → `Manage your apps`
- [ ] Click en `Upload a custom app`
- [ ] Seleccionar `Upload for [tu organización]`
- [ ] Subir `observatorio-teams.zip`
- [ ] Click en `Add`
- [ ] Verificar que aparece en la lista de apps

---

## 💾 Fase 4: Azure Blob Storage (Opcional pero Recomendado)

### 4.1 Crear Storage Account
- [ ] Definir nombre: `stobservatorio[random]` (debe ser único)
- [ ] Ejecutar:
  ```bash
  az storage account create \
    --name stobservatorio[random] \
    --resource-group rg-observatorio-inmobiliario \
    --location eastus \
    --sku Standard_LRS \
    --kind StorageV2
  ```
- [ ] Verificar creación

### 4.2 Crear Container
- [ ] Ejecutar:
  ```bash
  az storage container create \
    --name observatorio-uploads \
    --account-name stobservatorio[random] \
    --public-access blob
  ```

### 4.3 Obtener Connection String
- [ ] Ejecutar:
  ```bash
  az storage account show-connection-string \
    --name stobservatorio[random] \
    --resource-group rg-observatorio-inmobiliario \
    --query connectionString \
    --output tsv
  ```
- [ ] **Copiar Connection String**: `______________________`

### 4.4 Configurar en App Service
- [ ] Ejecutar:
  ```bash
  az webapp config appsettings set \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario \
    --settings \
      AZURE_STORAGE_CONNECTION_STRING="<connection-string>" \
      AZURE_STORAGE_CONTAINER_NAME="observatorio-uploads"
  ```

### 4.5 Instalar Dependencia
- [ ] Agregar a `package.json`:
  ```json
  "@azure/storage-blob": "^12.17.0"
  ```
- [ ] O ejecutar: `npm install @azure/storage-blob`

---

## 🚀 Fase 5: Despliegue de Código

### 5.1 Preparar Repositorio Git (si no existe)
- [ ] Navegar a la carpeta del proyecto
- [ ] Inicializar Git: `git init`
- [ ] Crear `.gitignore`:
  ```
  node_modules/
  .env
  uploads/
  *.log
  ```
- [ ] Commit inicial:
  ```bash
  git add .
  git commit -m "Initial commit - Observatorio Inmobiliario"
  ```

### 5.2 Configurar Git Deployment
- [ ] Ejecutar:
  ```bash
  az webapp deployment source config-local-git \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario
  ```
- [ ] Copiar la URL de Git remoto

### 5.3 Agregar Remote y Push
- [ ] Agregar remote:
  ```bash
  git remote add azure <URL-de-git-remoto>
  ```
- [ ] Push a Azure:
  ```bash
  git push azure master
  ```
- [ ] Esperar a que termine el despliegue (2-5 minutos)
- [ ] Verificar logs:
  ```bash
  az webapp log tail \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario
  ```

---

## ✅ Fase 6: Verificación y Testing

### 6.1 Verificar App Web
- [ ] Abrir navegador: `https://observatorio-inmobiliario-[tu-empresa].azurewebsites.net`
- [ ] Verificar que carga el mapa
- [ ] Verificar que no hay errores en consola (F12)
- [ ] Probar funcionalidades básicas

### 6.2 Verificar API
- [ ] Health check:
  ```bash
  curl https://observatorio-inmobiliario-[tu-empresa].azurewebsites.net/health
  ```
- [ ] API ofertas:
  ```bash
  curl https://observatorio-inmobiliario-[tu-empresa].azurewebsites.net/api/ofertas
  ```

### 6.3 Probar Webhook de Teams
- [ ] Crear script de prueba:
  ```bash
  curl -X POST "<tu-webhook-url>" \
    -H "Content-Type: application/json" \
    -d '{"text": "🏠 ¡Hola desde el Observatorio!"}'
  ```
- [ ] Verificar que llega mensaje al canal de Teams

### 6.4 Probar App en Teams
- [ ] Agregar pestaña en un canal:
  - Click en `+` junto a pestañas
  - Buscar "Observatorio INM"
  - Configurar y guardar
- [ ] Verificar que carga correctamente
- [ ] Probar funcionalidades dentro de Teams

### 6.5 Probar Notificaciones Automáticas
- [ ] Crear una nueva oferta desde la app
- [ ] Verificar que llega notificación a Teams
- [ ] Revisar formato de la tarjeta adaptativa

---

## 📊 Fase 7: Monitoreo y Ajustes

### 7.1 Configurar Logs
- [ ] Habilitar logging:
  ```bash
  az webapp log config \
    --name observatorio-inmobiliario-[tu-empresa] \
    --resource-group rg-observatorio-inmobiliario \
    --application-logging filesystem \
    --level information
  ```

### 7.2 Configurar Alertas (Opcional)
- [ ] Ir a Azure Portal → tu App Service
- [ ] Alerts → New alert rule
- [ ] Configurar alertas para:
  - CPU > 80%
  - Memory > 80%
  - HTTP 5xx errors > 10

### 7.3 Documentar URLs y Credenciales
- [ ] URL de la aplicación: `______________________`
- [ ] Application ID: `______________________`
- [ ] Webhook URL: `______________________`
- [ ] Storage Account: `______________________`
- [ ] Resource Group: `______________________`

---

## 🎓 Fase 8: Capacitación y Documentación

### 8.1 Documentación Interna
- [ ] Crear documento con URLs de acceso
- [ ] Documentar credenciales de forma segura
- [ ] Crear guía de usuario para el equipo

### 8.2 Capacitar Usuarios
- [ ] Mostrar cómo acceder a la app en Teams
- [ ] Explicar funcionalidades principales
- [ ] Demostrar carga de ofertas y normas
- [ ] Explicar notificaciones

### 8.3 Plan de Mantenimiento
- [ ] Definir responsable del monitoreo
- [ ] Establecer frecuencia de backups
- [ ] Documentar proceso de actualización
- [ ] Definir plan de escalamiento

---

## 🔄 Actualizaciones Futuras

Para actualizar el código desplegado:

```bash
# 1. Hacer cambios en el código
# 2. Commit
git add .
git commit -m "Descripción de cambios"

# 3. Push a Azure
git push azure master

# 4. Verificar logs
az webapp log tail \
  --name observatorio-inmobiliario-[tu-empresa] \
  --resource-group rg-observatorio-inmobiliario
```

---

## 🆘 Troubleshooting Rápido

### App no carga
```bash
az webapp log tail --name tu-app --resource-group rg-observatorio
az webapp restart --name tu-app --resource-group rg-observatorio
```

### Webhook no funciona
- Verificar que la URL no haya expirado (válido 1 año)
- Verificar formato del JSON enviado
- Revisar permisos del canal

### Teams no carga la pestaña
- Verificar CORS en `web.config`
- Verificar que HTTPS esté habilitado
- Revisar consola del navegador (F12)

---

## ✅ Checklist Final

- [ ] ✅ Infraestructura Azure creada
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ App registrada en Azure AD
- [ ] ✅ Webhook de Teams configurado
- [ ] ✅ Package de Teams creado e instalado
- [ ] ✅ Código desplegado exitosamente
- [ ] ✅ App accesible desde navegador
- [ ] ✅ App accesible desde Teams
- [ ] ✅ Notificaciones funcionando
- [ ] ✅ Azure Blob Storage configurado (opcional)
- [ ] ✅ Logs habilitados
- [ ] ✅ Documentación completada
- [ ] ✅ Usuarios capacitados

---

## 🎉 ¡Despliegue Completado!

Tu Observatorio Inmobiliario ahora está:
- ✅ Desplegado en Azure
- ✅ Integrado con Microsoft Teams
- ✅ Listo para producción

**Próximos pasos recomendados:**
1. Configurar backups automáticos
2. Implementar CI/CD con GitHub Actions
3. Agregar Application Insights
4. Configurar custom domain
5. Implementar autenticación adicional si es necesario

---

**Tiempo estimado total:** 1.5 - 2 horas
**Dificultad:** Media
**Última actualización:** Diciembre 2025
