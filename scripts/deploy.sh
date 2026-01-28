#!/bin/bash
# Quick deployment script for initial setup

set -e

SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"
ENVIRONMENT="${1:-dev}"
LOCATION="${2:-eastus2}"

if [ -z "$SUBSCRIPTION_ID" ]; then
    echo "Error: AZURE_SUBSCRIPTION_ID environment variable not set"
    exit 1
fi

echo "🚀 Deploying Kudoboard infrastructure..."
echo "   Environment: $ENVIRONMENT"
echo "   Location: $LOCATION"
echo "   Subscription: $SUBSCRIPTION_ID"

# Login check
az account show &>/dev/null || {
    echo "Please login to Azure first: az login"
    exit 1
}

# Set subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Deploy infrastructure
echo "📦 Deploying Bicep templates..."
az deployment sub create \
    --location "$LOCATION" \
    --template-file ./infra/main.bicep \
    --parameters environment="$ENVIRONMENT" \
    --name "kudoboard-$ENVIRONMENT-$(date +%Y%m%d%H%M%S)"

# Get outputs
RG_NAME="rg-kudoboard-$ENVIRONMENT"
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Resource Group: $RG_NAME"
echo ""

# List resources
echo "📦 Deployed resources:"
az resource list --resource-group "$RG_NAME" --output table

# Get Static Web App token
echo ""
echo "🔑 Static Web App deployment token:"
SWA_NAME="swa-kudoboard-$ENVIRONMENT"
az staticwebapp secrets list --name "$SWA_NAME" --resource-group "$RG_NAME" --query "properties.apiKey" -o tsv 2>/dev/null || echo "   (Static Web App not found or not accessible)"

# Get Function App hostname
echo ""
echo "🌐 Function App URL:"
FUNC_NAME="func-kudoboard-$ENVIRONMENT"
az functionapp show --name "$FUNC_NAME" --resource-group "$RG_NAME" --query "defaultHostName" -o tsv 2>/dev/null || echo "   (Function App not found or not accessible)"

# Get Front Door endpoint
echo ""
echo "🌍 Front Door endpoint:"
FD_NAME="fd-kudoboard-$ENVIRONMENT"
az afd endpoint show --resource-group "$RG_NAME" --profile-name "$FD_NAME" --endpoint-name "ep-kudoboard" --query "hostName" -o tsv 2>/dev/null || echo "   (Front Door not found or not accessible)"

echo ""
echo "🎉 Done! Next steps:"
echo "   1. Add GitHub secrets for CI/CD"
echo "   2. Push code to trigger deployment"
echo "   3. Configure custom domain (optional)"
