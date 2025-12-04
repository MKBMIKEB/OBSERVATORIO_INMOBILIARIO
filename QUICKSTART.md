# ⚡ Guía Rápida de Despliegue

## 🎯 Opción 1: Despliegue Automatizado (Windows)

### Paso 1: Ejecutar Script de Despliegue
```powershell
.\deploy-azure.ps1
```

Sigue las instrucciones en pantalla. El script creará:
- ✅ Resource Group
- ✅ App Service Plan
- ✅ Web App
- ✅ Configuración básica

### Paso 2: Configurar Variables de Entorno
```powershell
.\setup-env.ps1
```

Necesitarás:
- Application ID de Azure AD
- Client Secret
- Webhook URL de Teams

### Paso 3: Desplegar Código
```bash
git remote add azure <URL-proporcionada-por-script>
git add .
git commit -m "Initial deployment"
git push azure master
```

### Paso 4: Configurar Teams
Sigue la guía: [TEAMS-SETUP.md](./TEAMS-SETUP.md)

---

## 🎯 Opción 2: Despliegue Manual

### Prerrequisitos
```bash
# Verificar instalaciones
az --version
node --version
git --version
```

### 1. Login en Azure
```bash
az login
```

### 2. Crear Infraestructura
```bash
# Variables
APP_NAME="observatorio-inmobiliario-tuempresa"
RESOURCE_GROUP="rg-observatorio"
LOCATION="eastus"

# Crear recursos
az group create --name $RESOURCE_GROUP --location $LOCATION

az appservice plan create \
  --name plan-observatorio \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan plan-observatorio \
  --runtime "NODE:18-lts"
```

### 3. Configurar Variables
```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    TEAMS_APP_ID="<tu-app-id>" \
    TEAMS_APP_PASSWORD="<tu-secret>" \
    TEAMS_WEBHOOK_URL="<tu-webhook>" \
    APP_URL="https://$APP_NAME.azurewebsites.net"
```

### 4. Desplegar desde Git
```bash
# Configurar Git
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Obtener URL
GIT_URL=$(az webapp deployment list-publishing-credentials \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query scmUri -o tsv)

# Desplegar
git remote add azure $GIT_URL
git push azure master
```

---

## 📱 Configuración de Teams

### 1. Crear Webhook
1. Abre Teams → Canal → ⋯ → Connectors
2. Busca "Incoming Webhook"
3. Configura y copia la URL

### 2. Registrar App en Azure AD
1. Portal Azure → Azure AD → App registrations
2. New registration
3. Anota Application ID y crea Client Secret

### 3. Crear Package de Teams
```bash
# Editar teams-manifest.json con tus datos
# Crear íconos (ver TEAMS-SETUP.md)
# Comprimir:
zip observatorio-teams.zip manifest.json icon-color.png icon-outline.png
```

### 4. Instalar en Teams
Teams → Apps → Manage your apps → Upload → Subir ZIP

---

## 🔧 Comandos Útiles

### Ver Logs
```bash
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Reiniciar App
```bash
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Abrir en Navegador
```bash
az webapp browse --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Ver Estado
```bash
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query state
```

---

## 📊 Verificación

### Health Check
```bash
curl https://$APP_NAME.azurewebsites.net/health
```

### Probar API
```bash
curl https://$APP_NAME.azurewebsites.net/api/ofertas
```

### Probar Teams Webhook
```bash
curl -X POST "$TEAMS_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "¡Hola desde Observatorio!"}'
```

---

## 🚨 Solución de Problemas

### App no inicia
```bash
# Ver logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Verificar variables
az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP
```

### Error de certificado SSL
```bash
az webapp update --name $APP_NAME --resource-group $RESOURCE_GROUP --https-only true
```

### Error de CORS en Teams
Verifica `web.config` - debe incluir:
```xml
<add name="Access-Control-Allow-Origin" value="https://teams.microsoft.com"/>
```

---

## 📚 Documentación Completa

- **Despliegue detallado:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Configuración Teams:** [TEAMS-SETUP.md](./TEAMS-SETUP.md)
- **Variables de entorno:** [.env.example](./.env.example)

---

## ⏱️ Tiempo Estimado

- ⚡ Script automatizado: **15-20 minutos**
- 🔧 Despliegue manual: **30-40 minutos**
- 🔵 Configuración Teams: **10-15 minutos**

**Total: ~1 hora** (primera vez)

---

## 💡 Tips

1. **Usa nombres únicos** para el App Name (deben ser globalmente únicos)
2. **Guarda los secretos** de forma segura (no en Git)
3. **Habilita HTTPS** siempre (requerido por Teams)
4. **Monitorea los logs** durante el primer despliegue
5. **Prueba localmente** antes de desplegar

---

**¿Necesitas ayuda?** Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para más detalles.
