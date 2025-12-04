# =====================================================
# Script de Despliegue Completo en Azure
# Observatorio Inmobiliario
# =====================================================

param(
    [string]$AppName = "",
    [string]$ResourceGroup = "rg-observatorio-inmobiliario",
    [string]$Location = "eastus",
    [string]$PlanName = "plan-observatorio",
    [string]$Sku = "B1"
)

Write-Host ""
Write-Host "🚀 DESPLIEGUE OBSERVATORIO INMOBILIARIO EN AZURE" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""

# Verificar Azure CLI
$azureCliInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azureCliInstalled) {
    Write-Host "❌ Azure CLI no está instalado." -ForegroundColor Red
    exit 1
}

# Solicitar nombre si no se proporcionó
if (-not $AppName) {
    $AppName = Read-Host "Ingresa el nombre de tu aplicación (único globalmente)"
}

Write-Host "📝 Configuración del despliegue:" -ForegroundColor Cyan
Write-Host "  • Nombre de App: $AppName" -ForegroundColor White
Write-Host "  • Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "  • Ubicación: $Location" -ForegroundColor White
Write-Host "  • Plan: $PlanName ($Sku)" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "¿Continuar con el despliegue? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Despliegue cancelado" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔐 Paso 1: Iniciar sesión en Azure..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al iniciar sesión" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Sesión activa" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Paso 2: Crear Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource Group creado/verificado" -ForegroundColor Green
} else {
    Write-Host "❌ Error al crear Resource Group" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Paso 3: Crear App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name $PlanName `
    --resource-group $ResourceGroup `
    --sku $Sku `
    --is-linux

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ App Service Plan creado" -ForegroundColor Green
} else {
    Write-Host "⚠️ App Service Plan puede ya existir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Paso 4: Crear Web App..." -ForegroundColor Yellow
az webapp create `
    --name $AppName `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --runtime "NODE:18-lts"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Web App creada" -ForegroundColor Green
} else {
    Write-Host "❌ Error al crear Web App" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚙️ Paso 5: Configurar variables básicas..." -ForegroundColor Yellow
az webapp config appsettings set `
    --name $AppName `
    --resource-group $ResourceGroup `
    --settings `
        NODE_ENV=production `
        PORT=8080 `
        WEBSITE_NODE_DEFAULT_VERSION=18-lts `
        APP_URL="https://$AppName.azurewebsites.net"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Variables configuradas" -ForegroundColor Green
} else {
    Write-Host "❌ Error al configurar variables" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔒 Paso 6: Habilitar HTTPS..." -ForegroundColor Yellow
az webapp update `
    --name $AppName `
    --resource-group $ResourceGroup `
    --https-only true

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ HTTPS habilitado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Paso 7: Configurar despliegue Git..." -ForegroundColor Yellow
$gitUrl = az webapp deployment source config-local-git `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query url `
    --output tsv

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git configurado" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 URL de Git remoto:" -ForegroundColor Cyan
    Write-Host $gitUrl -ForegroundColor White
} else {
    Write-Host "⚠️ Error al configurar Git" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ¡DESPLIEGUE COMPLETADO!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Información de la aplicación:" -ForegroundColor Cyan
Write-Host "  • Nombre: $AppName" -ForegroundColor White
Write-Host "  • URL: https://$AppName.azurewebsites.net" -ForegroundColor White
Write-Host "  • Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configura variables de entorno adicionales:" -ForegroundColor White
Write-Host "   .\setup-env.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configura Git remote y despliega:" -ForegroundColor White
Write-Host "   git remote add azure $gitUrl" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Initial deployment'" -ForegroundColor Cyan
Write-Host "   git push azure master" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Abre la aplicación:" -ForegroundColor White
Write-Host "   az webapp browse --name $AppName --resource-group $ResourceGroup" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Monitorea logs:" -ForegroundColor White
Write-Host "   az webapp log tail --name $AppName --resource-group $ResourceGroup" -ForegroundColor Cyan
Write-Host ""
