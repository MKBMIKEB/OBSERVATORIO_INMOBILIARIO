# 🚀 Guía de Despliegue - Observatorio Inmobiliario

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue en Azure App Service](#despliegue-en-azure)
3. [Integración con Microsoft Teams](#integración-con-teams)
4. [Configuración de Azure Blob Storage](#azure-blob-storage)
5. [Variables de Entorno](#variables-de-entorno)
6. [Comandos Útiles](#comandos-útiles)

---

## 📦 Requisitos Previos

### Herramientas Necesarias
- Azure CLI instalado ([Descargar](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- Node.js 18.x o superior
- Git instalado
- Cuenta de Azure activa
- Cuenta de Microsoft 365 (para Teams)

### Verificar Instalaciones
```bash
az --version
node --version
git --version
```

---

## ☁️ Despliegue en Azure App Service

### Paso 1: Iniciar Sesión en Azure
```bash
az login
```

### Paso 2: Crear Grupo de Recursos
```bash
az group create \
  --name rg-observatorio-inmobiliario \
  --location eastus
```

### Paso 3: Crear App Service Plan
```bash
az appservice plan create \
  --name plan-observatorio \
  --resource-group rg-observatorio-inmobiliario \
  --sku B1 \
  --is-linux
```

### Paso 4: Crear Web App
```bash
az webapp create \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --plan plan-observatorio \
  --runtime "NODE:18-lts"
```

**Nota:** Reemplaza `[TU-NOMBRE]` con un identificador único.

### Paso 5: Configurar Variables de Entorno
```bash
az webapp config appsettings set \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    WEBSITE_NODE_DEFAULT_VERSION=18-lts
```

### Paso 6: Desplegar desde Git Local
```bash
# Inicializar repositorio Git (si no existe)
git init
git add .
git commit -m "Initial deployment"

# Configurar despliegue desde Git local
az webapp deployment source config-local-git \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario

# Obtener URL de Git remoto
az webapp deployment list-publishing-credentials \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --query scmUri \
  --output tsv

# Agregar remote y hacer push
git remote add azure <URL-obtenida>
git push azure master
```

### Paso 7: Verificar Despliegue
```bash
# Abrir la aplicación en el navegador
az webapp browse \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario
```

---

## 🔵 Integración con Microsoft Teams

### Paso 1: Registrar Aplicación en Azure AD

1. Ve al [Portal de Azure](https://portal.azure.com)
2. Navega a **Azure Active Directory** → **App registrations** → **New registration**
3. Configura:
   - **Name:** Observatorio Inmobiliario
   - **Supported account types:** Accounts in any organizational directory
   - **Redirect URI:** `https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net/auth-end`
4. Anota el **Application (client) ID**
5. Ve a **Certificates & secrets** → **New client secret**
6. Anota el **Secret value**

### Paso 2: Configurar Variables de Teams en Azure
```bash
az webapp config appsettings set \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --settings \
    TEAMS_APP_ID="<Application-ID>" \
    TEAMS_APP_PASSWORD="<Client-Secret>" \
    APP_URL="https://observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net"
```

### Paso 3: Preparar Manifest de Teams

1. Edita el archivo `teams-manifest.json`:
   - Reemplaza `{{TEAMS_APP_ID}}` con tu Application ID
   - Reemplaza `{{APP_URL}}` con tu URL de Azure
   - Reemplaza `{{APP_URL_DOMAIN}}` con tu dominio (ej: `observatorio-inmobiliario-[TU-NOMBRE].azurewebsites.net`)

2. Crea íconos para Teams:
   - **icon-color.png:** 192x192 px (PNG)
   - **icon-outline.png:** 32x32 px (PNG transparente)

### Paso 4: Crear Paquete de Teams
```bash
# Crear carpeta temporal
mkdir teams-package
cd teams-package

# Copiar archivos necesarios
cp ../teams-manifest.json ./manifest.json
cp ../icon-color.png ./
cp ../icon-outline.png ./

# Crear archivo ZIP
zip -r observatorio-teams.zip manifest.json icon-color.png icon-outline.png

# Volver a directorio principal
cd ..
```

### Paso 5: Instalar App en Teams

1. Abre **Microsoft Teams**
2. Ve a **Apps** → **Manage your apps** → **Upload a custom app**
3. Selecciona el archivo `observatorio-teams.zip`
4. Haz clic en **Add** para instalar

### Paso 6: Configurar Pestaña en Canal

1. En Teams, ve al canal donde quieres agregar el observatorio
2. Haz clic en **+** para agregar una pestaña
3. Busca y selecciona **Observatorio INM**
4. Configura y guarda

---

## 💾 Azure Blob Storage (Opcional - Recomendado)

Para producción, se recomienda usar Azure Blob Storage en lugar del almacenamiento local.

### Paso 1: Crear Storage Account
```bash
az storage account create \
  --name stobservatorio[RANDOM] \
  --resource-group rg-observatorio-inmobiliario \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2
```

### Paso 2: Crear Contenedor
```bash
az storage container create \
  --name observatorio-uploads \
  --account-name stobservatorio[RANDOM] \
  --public-access blob
```

### Paso 3: Obtener Connection String
```bash
az storage account show-connection-string \
  --name stobservatorio[RANDOM] \
  --resource-group rg-observatorio-inmobiliario \
  --query connectionString \
  --output tsv
```

### Paso 4: Configurar en App Service
```bash
az webapp config appsettings set \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --settings \
    AZURE_STORAGE_CONNECTION_STRING="<Connection-String>" \
    AZURE_STORAGE_CONTAINER_NAME="observatorio-uploads"
```

### Paso 5: Instalar Dependencia
```bash
npm install @azure/storage-blob
```

### Paso 6: Actualizar server.js

Reemplaza `server.js` con `server-azure.js` o descomentar las secciones de Azure Blob Storage.

---

## 🔐 Variables de Entorno

Crea un archivo `.env` localmente (NO subir a Git):

```env
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=observatorio-uploads

# Server
PORT=3000
NODE_ENV=development

# Teams
TEAMS_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TEAMS_APP_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Application
APP_URL=http://localhost:3000
```

---

## 🛠️ Comandos Útiles

### Ver Logs en Tiempo Real
```bash
az webapp log tail \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario
```

### Reiniciar Aplicación
```bash
az webapp restart \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario
```

### Ver Estado de la Aplicación
```bash
az webapp show \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --query state
```

### Actualizar Despliegue
```bash
git add .
git commit -m "Update deployment"
git push azure master
```

### Escalar Verticalmente
```bash
az appservice plan update \
  --name plan-observatorio \
  --resource-group rg-observatorio-inmobiliario \
  --sku B2
```

### Habilitar HTTPS
```bash
az webapp update \
  --name observatorio-inmobiliario-[TU-NOMBRE] \
  --resource-group rg-observatorio-inmobiliario \
  --https-only true
```

---

## 🔍 Troubleshooting

### Error: La aplicación no inicia

**Verificar logs:**
```bash
az webapp log tail --name observatorio-inmobiliario-[TU-NOMBRE] --resource-group rg-observatorio-inmobiliario
```

**Verificar variables de entorno:**
```bash
az webapp config appsettings list --name observatorio-inmobiliario-[TU-NOMBRE] --resource-group rg-observatorio-inmobiliario
```

### Error: No se pueden subir archivos

- Verificar que el tamaño máximo de archivo esté configurado en `web.config`
- Verificar permisos del contenedor de Azure Blob Storage
- Revisar Connection String

### Error: Teams no carga la aplicación

- Verificar que CORS esté configurado correctamente
- Verificar headers de seguridad (X-Frame-Options, CSP)
- Verificar que la URL en el manifest sea la correcta

---

## 📚 Recursos Adicionales

- [Documentación de Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/)
- [Documentación de Teams Apps](https://docs.microsoft.com/en-us/microsoftteams/platform/)
- [Azure Blob Storage Docs](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Node.js en Azure](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)

---

## 📞 Soporte

Para problemas o consultas:
- Revisar logs de Azure
- Consultar documentación oficial
- Contactar al equipo de desarrollo

---

**Última actualización:** Diciembre 2025
**Versión:** 1.0.0
