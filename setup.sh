#!/bin/bash

# CyberForge Setup Script for Linux/Mac
# Run with: chmod +x setup.sh && ./setup.sh

echo "🚀 CyberForge Setup Script"
echo "========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    echo -e "${YELLOW}Download from: https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Check if .env exists
echo ""
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Edit .env file and add your API keys!${NC}"
    echo -e "${YELLOW}   - Mistral API Key (required)${NC}"
    echo -e "${YELLOW}   - JWT secrets (generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")${NC}"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Ask user for setup type
echo ""
echo -e "${YELLOW}Choose setup type:${NC}"
echo "1. Docker (Recommended - includes PostgreSQL & Redis)"
echo "2. Local Development (Manual PostgreSQL & Redis setup required)"
echo ""
read -p "Enter choice (1 or 2): " SETUP_TYPE

if [ "$SETUP_TYPE" = "1" ]; then
    # Docker setup
    echo ""
    echo -e "${CYAN}🐳 Docker Setup Selected${NC}"
    echo ""
    
    # Check if Docker is installed
    echo -e "${YELLOW}Checking Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker.${NC}"
        echo -e "${YELLOW}Install from: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker version: $DOCKER_VERSION${NC}"
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ docker-compose is not installed.${NC}"
        exit 1
    fi
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ docker-compose version: $COMPOSE_VERSION${NC}"
    
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    
    echo ""
    echo -e "${YELLOW}Generating Prisma Client...${NC}"
    npx prisma generate
    
    echo ""
    echo -e "${YELLOW}Starting Docker containers...${NC}"
    docker-compose up -d
    
    echo ""
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"
    sleep 10
    
    echo ""
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker-compose exec -T backend npx prisma migrate dev --name init
    
    echo ""
    echo -e "${GREEN}✅ Setup Complete!${NC}"
    echo ""
    echo -e "${CYAN}🌐 Access your application:${NC}"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3001"
    echo "   Health:   http://localhost:3001/health"
    echo ""
    echo -e "${CYAN}📊 Optional Tools (start with: docker-compose --profile tools up -d)${NC}"
    echo "   PgAdmin:         http://localhost:5050"
    echo "   Redis Commander: http://localhost:8081"
    echo ""
    echo -e "${CYAN}🔧 Useful Commands:${NC}"
    echo "   View logs:      docker-compose logs -f"
    echo "   Stop services:  docker-compose down"
    echo "   Restart:        docker-compose restart"
    
elif [ "$SETUP_TYPE" = "2" ]; then
    # Local development setup
    echo ""
    echo -e "${CYAN}💻 Local Development Setup Selected${NC}"
    echo ""
    
    # Check PostgreSQL
    echo -e "${YELLOW}⚠️  Make sure PostgreSQL is running on localhost:5432${NC}"
    echo -e "${YELLOW}⚠️  Make sure Redis is running on localhost:6379 (optional)${NC}"
    echo ""
    read -p "Is your database ready? (y/n): " DB_READY
    
    if [ "$DB_READY" != "y" ]; then
        echo ""
        echo -e "${YELLOW}To start PostgreSQL with Docker:${NC}"
        echo "docker run --name cyberforge-postgres -e POSTGRES_PASSWORD=cyberforge_password -e POSTGRES_DB=cyberforge -p 5432:5432 -d postgres:16-alpine"
        echo ""
        echo -e "${YELLOW}To start Redis with Docker:${NC}"
        echo "docker run --name cyberforge-redis -p 6379:6379 -d redis:7-alpine"
        echo ""
        exit 0
    fi
    
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    
    echo ""
    echo -e "${YELLOW}Generating Prisma Client...${NC}"
    npx prisma generate
    
    echo ""
    echo -e "${YELLOW}Running database migrations...${NC}"
    npx prisma migrate dev --name init
    
    echo ""
    echo -e "${GREEN}✅ Setup Complete!${NC}"
    echo ""
    echo -e "${CYAN}🚀 Start the application:${NC}"
    echo ""
    echo -e "${YELLOW}Option 1 - Two terminals:${NC}"
    echo "   Terminal 1: npm run dev:server"
    echo "   Terminal 2: npm run dev"
    echo ""
    echo -e "${YELLOW}Option 2 - Single command:${NC}"
    echo "   npm run dev:all"
    echo ""
    echo -e "${CYAN}🌐 Access:${NC}"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:3001"
    
else
    echo -e "${RED}Invalid choice. Please run the script again.${NC}"
    exit 1
fi

echo ""
echo "========================="
echo -e "${GREEN}Happy Coding! 🎉${NC}"
echo ""
