# Kudoboard

A mobile-friendly web application for creating beautiful appreciation boards for birthdays, farewells, and celebrations.

[![Deploy to Azure](https://img.shields.io/badge/Deploy%20to-Azure-blue?logo=microsoft-azure)](./infra/DEPLOYMENT.md)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green?logo=github-actions)](/.github/workflows/ci-cd.yml)

## Features

- ✅ Create boards for any occasion
- ✅ Add text messages, images, and GIFs
- ✅ Real-time updates via WebSocket
- ✅ Mobile-responsive design
- ✅ Share boards via unique links
- ✅ No account required for contributors
- ✅ Customizable card colors and styles

## Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (mobile-first)
- **State:** Zustand
- **Routing:** React Router v6
- **Hosting:** Azure Static Web Apps

### Backend (Serverless)
- **Runtime:** Azure Functions v4 (Node.js 18)
- **Database:** Azure Cosmos DB (serverless, multi-region)
- **Storage:** Azure Blob Storage
- **Auth:** JWT tokens

### Infrastructure
- **CDN:** Azure Front Door Premium (global edge caching)
- **WAF:** Web Application Firewall
- **IaC:** Bicep templates
- **CI/CD:** GitHub Actions with blue-green deployments

### Environments
| Environment | Branch | Description |
|-------------|--------|-------------|
| Production | `main` | Live site with blue-green deployment |
| Staging | `staging` | Pre-production testing |
| Development | `develop` | Active development |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure account (for production deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/kudoboard.git
cd kudoboard
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Copy the example env file
cp server/.env.example server/.env

# Edit with your values
```

4. Start development servers:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Environment Variables

#### Server (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | Environment (development/production) |
| `COSMOS_ENDPOINT` | Azure Cosmos DB endpoint |
| `COSMOS_KEY` | Azure Cosmos DB key |
| `COSMOS_DATABASE` | Database name |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage connection |
| `AZURE_STORAGE_CONTAINER` | Storage container name |
| `JWT_SECRET` | Secret for JWT tokens |
| `GIPHY_API_KEY` | Giphy API key for GIF search |
| `CLIENT_URL` | Frontend URL for CORS |

## Project Structure

```
kudoboard/
├── client/                 # React frontend (Static Web App)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand store
│   │   ├── lib/            # Utilities (API, socket)
│   │   ├── hooks/          # Custom hooks
│   │   ├── edge/           # Edge function utilities
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── api/                    # Azure Functions (serverless backend)
│   └── src/
│       ├── functions/      # HTTP trigger functions
│       └── lib/            # Shared utilities
├── server/                 # Express backend (for local dev)
│   └── src/
│       ├── routes/         # API routes
│       ├── middleware/     # Express middleware
│       ├── config/         # Database & storage config
│       ├── sockets/        # Socket.io handlers
│       └── types/          # TypeScript types
├── infra/                  # Azure Bicep templates
│   ├── main.bicep          # Main deployment file
│   └── modules/            # Resource modules
├── scripts/                # Deployment scripts
└── docs/                   # Documentation
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure account (for cloud services)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/kudoboard.git
cd kudoboard

# Install dependencies
npm run install:all

# Copy environment variables
cp server/.env.example server/.env

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Azure Deployment

This project uses a Vercel-like deployment architecture on Azure with:
- 🌍 **Global CDN** via Azure Front Door
- ⚡ **Serverless Functions** via Azure Functions
- 🔒 **WAF Protection** in production
- 🔄 **Blue-Green Deployments** with staging slots
- 📊 **Multi-region** database for production

### Deploy Infrastructure

```powershell
# Windows
.\scripts\deploy.ps1 -Environment dev

# Linux/macOS
./scripts/deploy.sh dev
```

### CI/CD Pipeline

The GitHub Actions workflow automatically deploys:
- `develop` branch → Development environment
- `staging` branch → Staging environment  
- `main` branch → Production (with blue-green swap)

See [infra/DEPLOYMENT.md](infra/DEPLOYMENT.md) for detailed setup instructions.

## API Endpoints

### Health
- `GET /api/health` - Health check with region info

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id` - Get board by ID
- `GET /api/boards/share/:shareCode` - Get board by share code
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Messages
- `GET /api/messages/board/:boardId` - Get board messages
- `POST /api/messages` - Create message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### Upload
- `POST /api/upload/image` - Upload image

### GIFs
- `GET /api/giphy/search` - Search GIFs
- `GET /api/giphy/trending` - Trending GIFs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
