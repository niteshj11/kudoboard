# Azure Deployment Scripts

## Prerequisites

1. **Azure CLI** installed and logged in
2. **GitHub repository** set up
3. **Azure subscription** with appropriate permissions

## Initial Setup

### 1. Create Service Principal for GitHub Actions

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create service principal with federated credentials
az ad app create --display-name "kudoboard-github-actions"

# Note the appId from the output, then create federated credentials
APP_ID="YOUR_APP_ID"

# Create federated credential for main branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_ORG/kudoboard:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for staging branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-staging",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_ORG/kudoboard:ref:refs/heads/staging",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for develop branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-develop",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_ORG/kudoboard:ref:refs/heads/develop",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for pull requests
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-pr",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_ORG/kudoboard:pull_request",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `SWA_TOKEN_DEV` | Static Web App deployment token (dev) |
| `SWA_TOKEN_STAGING` | Static Web App deployment token (staging) |
| `SWA_TOKEN_PRODUCTION` | Static Web App deployment token (production) |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_DEV` | Function App publish profile (dev) |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_STAGING` | Function App publish profile (staging slot) |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_SECONDARY` | Function App publish profile (secondary region) |

### 3. Deploy Infrastructure

```bash
# Deploy dev environment
az deployment sub create \
  --location eastus2 \
  --template-file infra/main.bicep \
  --parameters environment=dev

# Deploy staging environment
az deployment sub create \
  --location eastus2 \
  --template-file infra/main.bicep \
  --parameters environment=staging

# Deploy production environment
az deployment sub create \
  --location eastus2 \
  --template-file infra/main.bicep \
  --parameters environment=production
```

### 4. Get Deployment Tokens

```bash
# Get Static Web App tokens
az staticwebapp secrets list --name swa-kudoboard-dev --query "properties.apiKey" -o tsv
az staticwebapp secrets list --name swa-kudoboard-staging --query "properties.apiKey" -o tsv
az staticwebapp secrets list --name swa-kudoboard-production --query "properties.apiKey" -o tsv

# Get Function App publish profiles
az functionapp deployment list-publishing-profiles \
  --name func-kudoboard-dev \
  --resource-group rg-kudoboard-dev \
  --xml

az functionapp deployment list-publishing-profiles \
  --name func-kudoboard-production \
  --resource-group rg-kudoboard-production \
  --slot staging \
  --xml
```

## Branching Strategy

```
main (production)
  ├── staging (pre-production testing)
  │     └── develop (active development)
  │           ├── feature/xxx
  │           └── bugfix/xxx
```

### Workflow

1. **Feature Development**: Create branch from `develop`, PR to `develop`
2. **Integration Testing**: Merge to `develop` → Auto-deploy to dev
3. **Pre-release Testing**: Merge `develop` to `staging` → Auto-deploy to staging
4. **Production Release**: Merge `staging` to `main` → Blue-green deploy to production

## Monitoring

### Health Checks

- Production: `https://fd-kudoboard-production.azurefd.net/api/health`
- Staging: `https://func-kudoboard-production-staging.azurewebsites.net/api/health`
- Dev: `https://func-kudoboard-dev.azurewebsites.net/api/health`

### Azure Monitor

All environments have Application Insights configured. View metrics at:
- Azure Portal → Application Insights → ai-kudoboard-{env}

### Key Metrics to Watch

1. **Response Time (P95)**: Should be < 200ms
2. **Error Rate**: Should be < 0.1%
3. **Availability**: Should be > 99.9%
4. **Request Rate**: Monitor for anomalies

## Rollback Procedure

### Automatic (GitHub Actions)

1. Go to Actions → "Rollback Production"
2. Click "Run workflow"
3. Enter reason and confirm

### Manual (Azure CLI)

```bash
# Swap production back to previous version (in staging slot)
az functionapp deployment slot swap \
  --resource-group rg-kudoboard-production \
  --name func-kudoboard-production \
  --slot staging \
  --target-slot production

# Purge CDN cache
az afd endpoint purge \
  --resource-group rg-kudoboard-production \
  --profile-name fd-kudoboard-production \
  --endpoint-name ep-kudoboard \
  --content-paths "/*"
```

## Cost Optimization

### Production Environment
- Front Door Premium: ~$330/month
- Functions (Consumption): Pay-per-use (~$50-200/month at scale)
- Cosmos DB (Serverless): Pay-per-use
- Static Web App (Standard): $9/month
- Storage: ~$5/month

### Dev/Staging
- Front Door Standard: ~$35/month
- Functions (Consumption): Minimal
- Cosmos DB (Serverless): Minimal
- Static Web App (Free): $0

## Security Checklist

- [ ] WAF enabled on Front Door (production)
- [ ] Rate limiting configured
- [ ] HTTPS enforced everywhere
- [ ] Secrets in Key Vault
- [ ] RBAC configured
- [ ] Network isolation (VNet) for production
- [ ] DDoS protection enabled
