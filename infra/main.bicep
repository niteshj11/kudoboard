// Kudoboard Infrastructure - Production-Grade Azure Setup
// Vercel-like deployment with Front Door CDN, Serverless Functions, and Edge optimization

targetScope = 'subscription'

@description('Environment name (dev, staging, production)')
@allowed(['dev', 'staging', 'production'])
param environment string = 'production'

@description('Primary Azure region')
param primaryLocation string = 'eastus2'

@description('Secondary Azure region for geo-redundancy')
param secondaryLocation string = 'westeurope'

@description('Application name prefix')
param appName string = 'kudoboard'

// Resource naming
var resourceGroupName = 'rg-${appName}-${environment}'
var tags = {
  application: appName
  environment: environment
  managedBy: 'bicep'
}

// Create Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: primaryLocation
  tags: tags
}

// Deploy all resources
module resources 'modules/resources.bicep' = {
  scope: rg
  name: 'resources-deployment'
  params: {
    appName: appName
    environment: environment
    primaryLocation: primaryLocation
    secondaryLocation: secondaryLocation
    tags: tags
  }
}

// Outputs for CI/CD
output resourceGroupName string = rg.name
output staticWebAppName string = resources.outputs.staticWebAppName
output functionAppName string = resources.outputs.functionAppName
output frontDoorEndpoint string = resources.outputs.frontDoorEndpoint
output cosmosDbEndpoint string = resources.outputs.cosmosDbEndpoint
output storageAccountName string = resources.outputs.storageAccountName
