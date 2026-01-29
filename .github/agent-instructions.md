# Agent Instructions

Guidelines and best practices for AI agents working on this project.

## Terminal Usage

### Running Background Processes
- **Always start long-running processes (like `func start`, `npm run dev`, servers) in a separate terminal** from the one used for testing or other commands.
- Use `isBackground: true` when starting servers or watch processes.
- After starting a background process, use a different terminal for subsequent commands like `Invoke-RestMethod` or `curl` to test endpoints.
- **IMPORTANT**: Do not run test commands in the same terminal that's running a server - they will interfere with each other.

### Example: Testing Azure Functions Locally
```powershell
# Terminal 1: Start the function (background)
cd api
func start

# Terminal 2: Test the endpoints (MUST be a separate terminal)
Invoke-RestMethod -Uri "http://localhost:7071/api/health" -Method Get
```

### Known Issues
- The terminal output can get mixed up when running background processes
- Always wait for "Worker process started and initialized" before testing
- If tests fail with "connection refused", the server may have stopped - restart it

## Azure Cosmos DB

### Local Auth Policy
- The Cosmos DB account has `disableLocalAuth=true` enforced by Azure Policy
- This means key-based authentication won't work locally
- **Workaround**: Use the Express server with in-memory storage for local development

## Local Development

### Azure Functions
1. Build before running: `cd api && npm run build`
2. Start locally: `func start` (runs on port 7071)
3. Test endpoints at: `http://localhost:7071/api/{endpoint}`

### Client (React)
1. Start dev server: `cd client && npm run dev` (runs on port 5173)
2. The client expects API at `/api` which proxies to the backend

## Deployment

### Branch Strategy
- `develop` → DEV environment
- `staging` → STAGING environment  
- `main` → PRODUCTION environment

### Manual Deployment
```powershell
# Deploy Functions
cd api
func azure functionapp publish func-kudoboard-dev

# Deploy Static Web App
swa deploy ./client/dist --deployment-token $TOKEN
```

## Debugging

### Check Function App Logs
```powershell
az functionapp log tail --name func-kudoboard-dev --resource-group rg-kudoboard-dev
```

### Test API Endpoints
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:7071/api/health" -Method Get

# Register user
$body = @{name="Test"; email="test@test.com"; password="test123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:7071/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```
