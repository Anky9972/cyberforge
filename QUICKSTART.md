# 🚀 CyberForge Quick Start Guide

Get up and running with CyberForge in 5 minutes!

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Ollama** (for local AI) ([Download](https://ollama.ai/)) - Optional but recommended

---

## ⚡ Quick Install

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
git clone https://github.com/Anky9972/cyberforge.git
cd cyberforge
.\setup.ps1
```

**Linux/Mac (Bash):**
```bash
git clone https://github.com/Anky9972/cyberforge.git
cd cyberforge
chmod +x setup.sh
./setup.sh
```

This will:
- ✅ Install dependencies
- ✅ Setup database
- ✅ Configure environment
- ✅ Start all services

### Option 2: Manual Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/Anky9972/cyberforge.git
   cd cyberforge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cyberforge
   REDIS_URL=redis://localhost:6379
   OLLAMA_API_URL=http://localhost:11434
   JWT_SECRET=your_secret_here_min_32_chars
   ```

4. **Setup Database**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Pull AI Model** (for local scanning)
   ```bash
   ollama pull llama3.2:3b
   ```

---

## 🎯 Start CyberForge

### Start All Services

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

Or use Docker:
```bash
docker-compose up -d
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **API Docs**: http://localhost:3002/api-docs (when `ENABLE_SWAGGER=true`)

---

## 🔐 First Steps

### 1. Create Account

Navigate to http://localhost:5173 and register:

```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "username": "yourname",
    "password": "SecurePassword123!"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "you@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the `accessToken` from the response.

### 3. Create Your First Project

```bash
curl -X POST http://localhost:3002/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My First Project",
    "description": "Testing CyberForge",
    "language": "JavaScript",
    "framework": "Express"
  }'
```

### 4. Run Your First Scan

#### Option A: Upload ZIP File

```bash
curl -X POST http://localhost:3002/api/analyze \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@./my-project.zip" \
  -F "scanType=FULL" \
  -F "aiProvider=ollama"
```

#### Option B: Scan Local Directory (CLI)

```bash
npm install -g @cyberforge/cli

cyberforge scan \
  --path ./my-project \
  --output results.json
```

---

## 📊 View Results

### In Web UI

1. Navigate to **Dashboard**: http://localhost:5173/dashboard
2. Click on your **Project**
3. View **Vulnerabilities** by severity
4. Click any issue for **detailed analysis and fix suggestions**

### Via API

```bash
curl http://localhost:3002/api/scans/{SCAN_ID} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Export SARIF Report

```bash
curl http://localhost:3002/api/scans/{SCAN_ID}/sarif \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o report.sarif
```

Upload to GitHub:
```bash
# In GitHub Actions, this happens automatically
# See: .github/workflows/cyberforge-scan.yml
```

---

## 🛠️ Common Tasks

### Scan Specific Files Only

```bash
cyberforge scan \
  --path ./src \
  --include "*.js,*.ts" \
  --exclude "*.test.js"
```

### Incremental Scan (Only Changed Files)

```bash
cyberforge scan \
  --path . \
  --incremental \
  --baseline-scan PREVIOUS_SCAN_ID
```

### Fail Build on High Severity

```bash
cyberforge scan \
  --path . \
  --fail-on-severity high \
  --exit-code
```

### Generate Reports

```bash
# JSON Report
cyberforge scan --output results.json

# SARIF for GitHub/GitLab
cyberforge sarif --input results.json --output report.sarif

# HTML Report
cyberforge report --input results.json --output report.html
```

---

## 🔧 Configuration

### AI Providers

CyberForge supports multiple AI providers:

#### Local (Ollama) - Privacy First ⭐ Recommended
```env
AI_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

#### Mistral AI - Fast & Accurate
```env
AI_PROVIDER=mistral
MISTRAL_API_KEY=your_api_key_here
MISTRAL_MODEL=mistral-medium-2508
```

#### OpenAI - Most Capable
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

#### Fallback Strategy
```env
AI_PROVIDER=ollama
AI_FALLBACK_ENABLED=true
AI_FALLBACK_PROVIDER=mistral
```

### Security Settings

```env
# Authentication
JWT_SECRET=generate_with_openssl_rand_hex_64
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE_MB=50
MAX_ZIP_SIZE_MB=100
```

---

## 🚀 CI/CD Integration

### GitHub Actions

Add to `.github/workflows/security.yml`:

```yaml
- name: CyberForge Scan
  uses: cyberforge/scan-action@v1
  with:
    api-key: ${{ secrets.CYBERFORGE_API_KEY }}
    fail-on-severity: high
```

Or use the pre-built workflow:
```bash
cp .github/workflows/cyberforge-scan.yml.example .github/workflows/security.yml
```

### GitLab CI

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/Anky9972/cyberforge/main/.gitlab-ci.yml'
```

### Pre-commit Hook

```bash
# Install
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Now every commit will be scanned automatically
git commit -m "feat: new feature"
# 🔍 CyberForge: Scanning staged files...
```

---

## 🔍 Scan Example Projects

We provide intentionally vulnerable projects for testing:

```bash
# Clone demo projects
git clone https://github.com/Anky9972/cyberforge-demos.git
cd cyberforge-demos

# Scan vulnerable Node.js app
cyberforge scan --path ./vulnerable-express-app

# Scan vulnerable Python app
cyberforge scan --path ./vulnerable-django-app

# Scan vulnerable Java app
cyberforge scan --path ./vulnerable-spring-app
```

Expected findings:
- SQL Injection vulnerabilities
- XSS (Cross-Site Scripting)
- Hardcoded credentials
- Insecure cryptography
- CSRF issues

---

## 📚 Next Steps

### Learn More

- 📖 **[Full Documentation](./README.md)** - Complete guide
- 🎨 **[Dashboard Guide](./DASHBOARD_GUIDE.md)** - UI features
- 🏗️ **[Architecture](./docs/ARCHITECTURE.md)** - System design
- 🔌 **[API Reference](http://localhost:3002/api-docs)** - REST API docs

### Advanced Features

- **Custom Rules**: Create your own vulnerability patterns
- **Webhooks**: Integrate with Slack, Teams, Jira
- **SSO**: SAML/OAuth authentication
- **Multi-tenancy**: Team and organization support
- **API Fuzzing**: Test REST APIs with smart inputs
- **Corpus Management**: Build test case libraries

---

## 🆘 Troubleshooting

### Can't connect to database

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
psql "postgresql://postgres:password@localhost:5432/cyberforge"

# Reset database
npx prisma migrate reset
```

### Ollama not responding

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Pull model again
ollama pull llama3.2:3b

# Restart Ollama service
ollama serve
```

### Port already in use

```bash
# Change port in .env
PORT=3003
FRONTEND_URL=http://localhost:5174

# Or kill process using the port
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### Scan takes too long

```env
# Reduce timeout
ANALYSIS_TIMEOUT_SECONDS=120

# Increase workers
WORKER_THREADS=8

# Use faster AI model
OLLAMA_MODEL=llama3.2:1b  # Smaller, faster
```

---

## 💬 Get Help

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Anky9972/cyberforge/issues)
- 💡 **Feature Requests**: [Discussions](https://github.com/Anky9972/cyberforge/discussions)
- 📧 **Email**: support@cyberforge.dev
- 💬 **Discord**: [Join Community](https://discord.gg/cyberforge)

---

## ✅ Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend |
| `cd server && npm run dev` | Start backend |
| `docker-compose up` | Start all services |
| `cyberforge scan --path .` | Scan current directory |
| `npx prisma studio` | View database |
| `ollama list` | Show installed AI models |
| `redis-cli ping` | Test Redis connection |

---

**🎉 You're ready to secure your code with CyberForge!**

Found this guide helpful? Give us a ⭐ on [GitHub](https://github.com/Anky9972/cyberforge)!
