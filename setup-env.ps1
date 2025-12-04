# =====================================================
# Script de Configuración de Variables de Entorno
# Para Azure App Service - Observatorio Inmobiliario
# =====================================================

Write-Host "🚀 Configuración de Variables de Entorno - Observatorio Inmobiliario" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

# Verificar si Azure CLI está instalado
Write-Host "🔍 Verificando Azure CLI..." -ForegroundColor Yellow
$azureCliInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azureCliInstalled) {
    Write-Host "❌ Azure CLI no está instalado." -ForegroundColor Red
    Write-Host "Por favor instala Azure CLI desde: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Azure CLI detectado" -ForegroundColor Green
Write-Host ""

# Solicitar nombre de la aplicación
$appName = Read-Host "Ingresa el nombre de tu aplicación (ej: observatorio-inmobiliario-company)"
$resourceGroup = Read-Host "Ingresa el nombre del Resource Group (ej: rg-observatorio-inmobiliario)"

Write-Host ""
Write-Host "📝 Configurando aplicación: $appName" -ForegroundColor Cyan
Write-Host "📦 Resource Group: $resourceGroup" -ForegroundColor Cyan
Write-Host ""

# Verificar si el usuario está logueado en Azure
Write-Host "🔐 Verificando sesión de Azure..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    Write-Host "⚠️ No has iniciado sesión en Azure." -ForegroundColor Yellow
    Write-Host "Iniciando sesión..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al iniciar sesión en Azure" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Sesión de Azure activa" -ForegroundColor Green
Write-Host ""

# Solicitar variables de entorno
Write-Host "🔧 Configuración de Variables de Entorno" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$teamsAppId = Read-Host "TEAMS_APP_ID (Application ID de Azure AD)"
$teamsAppPassword = Read-Host "TEAMS_APP_PASSWORD (Client Secret)" -AsSecureString
$teamsAppPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($teamsAppPassword)
)

$teamsWebhookUrl = Read-Host "TEAMS_WEBHOOK_URL (URL del webhook entrante)"

Write-Host ""
$useAzureStorage = Read-Host "¿Deseas configurar Azure Blob Storage? (s/n)"

$azureStorageConnectionString = ""
$azureStorageContainerName = "observatorio-uploads"

if ($useAzureStorage -eq "s" -or $useAzureStorage -eq "S") {
    $azureStorageConnectionString = Read-Host "AZURE_STORAGE_CONNECTION_STRING"
    $containerName = Read-Host "AZURE_STORAGE_CONTAINER_NAME (default: observatorio-uploads)"
    if ($containerName) {
        $azureStorageContainerName = $containerName
    }
}

Write-Host ""
Write-Host "📤 Aplicando configuración en Azure App Service..." -ForegroundColor Yellow

# Configuración base
$settings = @(
    "NODE_ENV=production",
    "PORT=8080",
    "APP_URL=https://$appName.azurewebsites.net",
    "TEAMS_APP_ID=$teamsAppId",
    "TEAMS_APP_PASSWORD=$teamsAppPasswordPlain",
    "TEAMS_WEBHOOK_URL=$teamsWebhookUrl"
)

# Agregar Azure Storage si se configuró
if ($azureStorageConnectionString) {
    $settings += "AZURE_STORAGE_CONNECTION_STRING=$azureStorageConnectionString"
    $settings += "AZURE_STORAGE_CONTAINER_NAME=$azureStorageContainerName"
}

# Aplicar settings
$settingsString = $settings -join " "
az webapp config appsettings set `
    --name $appName `
    --resource-group $resourceGroup `
    --settings $settings

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Variables de entorno configuradas correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Resumen de Configuración:" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "App Name: $appName" -ForegroundColor White
    Write-Host "Resource Group: $resourceGroup" -ForegroundColor White
    Write-Host "URL: https://$appName.azurewebsites.net" -ForegroundColor White
    Write-Host "Teams App ID: $teamsAppId" -ForegroundColor White
    Write-Host "Azure Storage: $(if ($azureStorageConnectionString) { 'Habilitado' } else { 'Deshabilitado' })" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Despliega la aplicación: git push azure master" -ForegroundColor White
    Write-Host "2. Verifica la aplicación: az webapp browse --name $appName --resource-group $resourceGroup" -ForegroundColor White
    Write-Host "3. Revisa los logs: az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Error al configurar variables de entorno" -ForegroundColor Red
    Write-Host "Por favor verifica:" -ForegroundColor Yellow
    Write-Host "- Que el nombre de la aplicación sea correcto" -ForegroundColor White
    Write-Host "- Que el Resource Group exista" -ForegroundColor White
    Write-Host "- Que tengas permisos suficientes" -ForegroundColor White
}
