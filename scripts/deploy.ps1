# PowerShell deployment script for Windows

param(
    [string]$Environment = "dev",
    [string]$Location = "eastus2"
)

$ErrorActionPreference = "Stop"

$SubscriptionId = $env:AZURE_SUBSCRIPTION_ID

if (-not $SubscriptionId) {
    Write-Error "AZURE_SUBSCRIPTION_ID environment variable not set"
    exit 1
}

Write-Host "🚀 Deploying Kudoboard infrastructure..." -ForegroundColor Cyan
Write-Host "   Environment: $Environment"
Write-Host "   Location: $Location"
Write-Host "   Subscription: $SubscriptionId"

# Login check
try {
    az account show | Out-Null
} catch {
    Write-Host "Please login to Azure first: az login" -ForegroundColor Red
    exit 1
}

# Set subscription
az account set --subscription $SubscriptionId

# Deploy infrastructure
Write-Host "`n📦 Deploying Bicep templates..." -ForegroundColor Yellow
$deploymentName = "kudoboard-$Environment-$(Get-Date -Format 'yyyyMMddHHmmss')"

az deployment sub create `
    --location $Location `
    --template-file "./infra/main.bicep" `
    --parameters environment=$Environment `
    --name $deploymentName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

$rgName = "rg-kudoboard-$Environment"

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Resource Group: $rgName"

# List resources
Write-Host "`n📦 Deployed resources:" -ForegroundColor Yellow
az resource list --resource-group $rgName --output table

# Get Static Web App token
Write-Host "`n🔑 Static Web App deployment token:" -ForegroundColor Yellow
$swaName = "swa-kudoboard-$Environment"
try {
    az staticwebapp secrets list --name $swaName --resource-group $rgName --query "properties.apiKey" -o tsv
} catch {
    Write-Host "   (Static Web App not found or not accessible)"
}

# Get Function App hostname
Write-Host "`n🌐 Function App URL:" -ForegroundColor Yellow
$funcName = "func-kudoboard-$Environment"
try {
    az functionapp show --name $funcName --resource-group $rgName --query "defaultHostName" -o tsv
} catch {
    Write-Host "   (Function App not found or not accessible)"
}

# Get Front Door endpoint
Write-Host "`n🌍 Front Door endpoint:" -ForegroundColor Yellow
$fdName = "fd-kudoboard-$Environment"
try {
    az afd endpoint show --resource-group $rgName --profile-name $fdName --endpoint-name "ep-kudoboard" --query "hostName" -o tsv
} catch {
    Write-Host "   (Front Door not found or not accessible)"
}

Write-Host "`n🎉 Done! Next steps:" -ForegroundColor Green
Write-Host "   1. Add GitHub secrets for CI/CD"
Write-Host "   2. Push code to trigger deployment"
Write-Host "   3. Configure custom domain (optional)"
