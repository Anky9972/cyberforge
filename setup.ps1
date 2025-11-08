# CyberForge Setup Script for Windows (PowerShell)
# Run with: .\setup.ps1

Write-Host "🚀 CyberForge Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18 or higher." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Check if .env exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env file and add your API keys!" -ForegroundColor Red
    Write-Host "   - Mistral API Key (required)" -ForegroundColor Yellow
    Write-Host "   - JWT secrets (generate with: node -e ""console.log(require('crypto').randomBytes(64).toString('hex'))"")" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Press Enter to continue after editing .env file..."
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Ask user for setup type
Write-Host ""
Write-Host "Choose setup type:" -ForegroundColor Yellow
Write-Host "1. Docker (Recommended - includes PostgreSQL & Redis)" -ForegroundColor White
Write-Host "2. Local Development (Manual PostgreSQL & Redis setup required)" -ForegroundColor White
Write-Host ""
$setupType = Read-Host "Enter choice (1 or 2)"

if ($setupType -eq "1") {
    # Docker setup
    Write-Host ""
    Write-Host "🐳 Docker Setup Selected" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Docker is installed
    Write-Host "Checking Docker installation..." -ForegroundColor Yellow
    $dockerVersion = docker --version 2>$null
    if ($null -eq $dockerVersion) {
        Write-Host "❌ Docker is not installed. Please install Docker Desktop." -ForegroundColor Red
        Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker version: $dockerVersion" -ForegroundColor Green
    
    # Check if docker-compose is available
    $composeVersion = docker-compose --version 2>$null
    if ($null -eq $composeVersion) {
        Write-Host "❌ docker-compose is not installed." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ docker-compose version: $composeVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host ""
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host ""
    Write-Host "Starting Docker containers..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host ""
    Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    docker-compose exec -T backend npx prisma migrate dev --name init
    
    Write-Host ""
    Write-Host "✅ Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access your application:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host "   Health:   http://localhost:3001/health" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Optional Tools (start with: docker-compose --profile tools up -d)" -ForegroundColor Cyan
    Write-Host "   PgAdmin:        http://localhost:5050" -ForegroundColor White
    Write-Host "   Redis Commander: http://localhost:8081" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   View logs:      docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop services:  docker-compose down" -ForegroundColor White
    Write-Host "   Restart:        docker-compose restart" -ForegroundColor White
    
} elseif ($setupType -eq "2") {
    # Local development setup
    Write-Host ""
    Write-Host "💻 Local Development Setup Selected" -ForegroundColor Cyan
    Write-Host ""
    
    # Check PostgreSQL
    Write-Host "⚠️  Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
    Write-Host "⚠️  Make sure Redis is running on localhost:6379 (optional)" -ForegroundColor Yellow
    Write-Host ""
    $dbReady = Read-Host "Is your database ready? (y/n)"
    
    if ($dbReady -ne "y") {
        Write-Host ""
        Write-Host "To start PostgreSQL with Docker:" -ForegroundColor Yellow
        Write-Host "docker run --name cyberforge-postgres -e POSTGRES_PASSWORD=cyberforge_password -e POSTGRES_DB=cyberforge -p 5432:5432 -d postgres:16-alpine" -ForegroundColor White
        Write-Host ""
        Write-Host "To start Redis with Docker:" -ForegroundColor Yellow
        Write-Host "docker run --name cyberforge-redis -p 6379:6379 -d redis:7-alpine" -ForegroundColor White
        Write-Host ""
        exit 0
    }
    
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host ""
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host ""
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npx prisma migrate dev --name init
    
    Write-Host ""
    Write-Host "✅ Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Start the application:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1 - Two terminals:" -ForegroundColor Yellow
    Write-Host "   Terminal 1: npm run dev:server" -ForegroundColor White
    Write-Host "   Terminal 2: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2 - Single command:" -ForegroundColor Yellow
    Write-Host "   npm run dev:all" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Access:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
    
} else {
    Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Happy Coding! 🎉" -ForegroundColor Green
Write-Host ""
