# 🌟 TGlobal — Production Gold Loan Management & AI Assist Platform

> An enterprise-grade, RBI-compliant digital gold loan origination platform featuring live valuation, multi-tier loan schemes, dynamic OTP verification, a dual-engine AI conversational agent (Gemini + Ollama fallback), and a protected operations portal with complete immutable audit trails.

[![Test Suite](https://img.shields.io/badge/Tests-11%2F11_Passing-success?style=for-the-badge)](./backend/src/tests/api.test.ts)
[![AI Eval](https://img.shields.io/badge/AI_Eval-5%2F5_Passing-blue?style=for-the-badge)](./backend/scripts/evalConversations.ts)

---

## 📑 Table of Contents

- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Key Features](#-key-features)
- [Directory Structure](#-directory-structure)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Variables](#-environment-variables)
- [AI Agent Configuration (Gemini + Ollama)](#-ai-agent-configuration)
- [API Reference](#-api-reference)
- [5 Conversational AI Test Conversations](#-5-conversational-ai-test-conversations)
- [VPS Deployment Guide](#-vps-deployment-guide)
  - [Method A: Git Clone + Docker Compose on VPS (Recommended)](#method-a-git-clone--docker-compose-on-vps-recommended)
  - [Method B: Pre-built Container Registry (Low-RAM VPS)](#method-b-pre-built-container-registry-low-ram-vps)
  - [Configuring Domain & Free SSL (Let's Encrypt)](#configuring-domain--free-ssl-lets-encrypt)
- [Database Safety & Automated Backup CI/CD](#-database-safety--automated-backup-cicd)
- [Automated Testing & AI Evaluation](#-automated-testing--ai-evaluation)
- [Attempted Bonuses](#-attempted-bonuses)
- [What We'd Do With More Time](#-what-wed-do-with-more-time)
- [License](#-license)

---

## 🏗️ Architecture & Tech Stack

```
                          ┌─────────────────────────────────────┐
                          │     Client Browser / Mobile PWA     │
                          └──────────────────┬──────────────────┘
                                             │ HTTP/HTTPS
                                             ▼
                 ┌───────────────────────────────────────────────────────┐
                 │          Nginx Reverse Proxy & Static Host            │
                 │      (SPA Client Routing + Cache + API Proxy)         │
                 └───────────────┬───────────────────────┬───────────────┘
                                 │ /                     │ /api/*
                                 ▼                       ▼
                    ┌─────────────────────────┐ ┌─────────────────────────┐
                    │  React 19 + TypeScript  │ │   Express.js API Node   │
                    │   Tailwind CSS (Golden  │ │   Zod Request Validation│
                    │   Ratio Geometric Grid) │ │   JWT Admin Bearer Auth │
                    └─────────────────────────┘ └───────────┬─────────────┘
                                                            │
                     ┌──────────────────────────────────────┼──────────────────────────────────────┐
                     │                                      │                                      │
                     ▼                                      ▼                                      ▼
        ┌─────────────────────────┐            ┌─────────────────────────┐            ┌─────────────────────────┐
        │  Supabase PostgreSQL DB │            │    Google Gemini API    │            │   Local Ollama Engine   │
        │   Prisma ORM (Session   │            │   Function Calling with │            │   llama3.2 Fallback on  │
        │   Pooler with pgbouncer)│            │      Live Tool Execution│            │     http://localhost    │
        └─────────────────────────┘            └─────────────────────────┘            └─────────────────────────┘
```

- **Frontend**: React 19, TypeScript, React Router 7 (`react-router-dom`), Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend API**: Node.js 20, Express, TypeScript, Zod Schema Validation, JWT Authentication (`jsonwebtoken`).
- **Database & ORM**: PostgreSQL (Supabase transaction pooler on port 6543 with `?pgbouncer=true`), Prisma ORM.
- **AI Loan Assist**: Google Gemini (`@google/generative-ai`) function-calling agent with local Ollama (`llama3.2`) offline fallback.
- **DevOps & Containers**: Docker, Multi-stage Dockerfiles, Docker Compose, Nginx, GitHub Actions CI/CD.

---

## ✨ Key Features

1. **Golden-Ratio Responsive Interface**:
   - Clean, modern design matching financial brand guidelines without clutter.
   - Studio product imagery of 22K jewellery seamlessly blended with CSS multiply blend mode.
   - Dedicated pages with real URL routes (`/`, `/apply`, `/apply/form`, `/apply/chat`, `/loan-schemes`, `/help`, `/admin`).

2. **Real Dynamic OTP Verification**:
   - No pre-filled or fake verification data.
   - Real 6-digit OTP generation with 5-minute expiry.
   - Dynamic 30-second countdown timer and **Resend OTP** functionality that generates a fresh code on each click.
   - Server-enforced validation preventing unverified submissions.

3. **Stateless Conversational AI Agent**:
   - Clean, modern chat interface without distracting sidebar menus.
   - Dual-engine fallback: Uses Google Gemini when API key is set; automatically switches to local Ollama (`llama3.2`) if offline or missing key.
   - 3 Real Database Tools:
     - `get_loan_schemes()`: Fetches active schemes from database.
     - `calculate_quote()`: Real-time server arithmetic at ₹7,000/g 24K benchmark.
     - `submit_application()`: Submits application only after explicit user confirmation.
   - Interactive quote cards with **"Proceed to Application with this Quote"** button.

4. **Internal Staff & Operations Portal**:
   - Discreet access via `/admin`, footer link, or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd>.
   - Secure username/password verification against `POST /api/v1/admin/login` returning an 8-hour signed JWT.
   - Lead table with pagination, search, status transitions (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`), and full audit log history modal.

5. **Server-Side Validation & Idempotency**:
   - Never trusts client numbers; gold metrics and loan caps (never above 75% LTV) are strictly calculated server-side.
   - Idempotency-Key support: Duplicate submissions return the original application ID without creating duplicate database rows.
   - 7-day cooldown prevention against duplicate leads for the same mobile number.

---

## 📁 Directory Structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated type checks, test suite & Docker linting
│       └── deploy.yml             # Pre-deploy DB backup snapshot + VPS deployment
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL schema (LoanScheme, Lead, AuditLog)
│   │   └── seed.ts                # Database seeding script for active loan plans
│   ├── src/
│   │   ├── lib/
│   │   │   ├── calculator.ts      # Pure gold calculations, LTV caps & phone masking
│   │   │   └── prisma.ts          # Singleton PrismaClient instance
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT Bearer token authentication middleware
│   │   │   └── errorHandler.ts    # Centralized AppError & Zod validation handler
│   │   ├── routes/
│   │   │   ├── admin.ts           # Admin login, lead listing & status updates
│   │   │   ├── agent.ts           # Dual-engine AI agent route with function calling
│   │   │   ├── leads.ts           # Lead creation, idempotent replay & deduplication
│   │   │   ├── loanSchemes.ts     # Active plans listing
│   │   │   ├── otp.ts             # In-memory OTP generation & verification
│   │   │   └── quotes.ts          # Pure quote calculation endpoint
│   │   ├── tests/
│   │   │   └── api.test.ts        # 11 comprehensive Vitest test cases
│   │   ├── app.ts                 # Express application setup & CORS
│   │   └── index.ts               # Server bootstrap
│   ├── .env.example               # Backend environment template
│   └── Dockerfile                 # Multi-stage production backend image
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLogin.tsx     # Staff credentials authentication card
│   │   │   ├── AdminView.tsx      # Protected dashboard, lead filters & audit modal
│   │   │   ├── AiAssistantChat.tsx# Modern conversational chatbot
│   │   │   ├── ApplyMethodSelection.tsx # Golden ratio method picker
│   │   │   ├── HelpPage.tsx       # FAQs, KYC guide & doorstep process
│   │   │   ├── HeroSection.tsx    # Luxury jewelry showcase & CTA buttons
│   │   │   ├── LoanSchemesPage.tsx# Real plans from DB with interactive estimator
│   │   │   ├── Navbar.tsx         # Route-aware navigation header
│   │   │   └── ThreeStepForm.tsx  # 3-step application form with live OTP flow
│   │   ├── App.tsx                # React Router setup & keyboard shortcuts
│   │   └── main.tsx               # React root mount
│   ├── nginx.conf                 # Nginx production configuration & SPA fallback
│   └── Dockerfile                 # Multi-stage Nginx frontend image
├── scripts/
│   ├── backup-db.sh               # Pre-deployment PostgreSQL snapshot script
│   └── restore-db.sh              # Emergency database rollback script
├── .dockerignore                  # Docker exclusion rules
├── .gitignore                    # Git secrets & build exclusion rules
├── docker-compose.yml             # Complete container orchestration
└── package.json                   # Root npm workspaces configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+ installed
- PostgreSQL connection string (e.g. free [Supabase](https://supabase.com/) project)
- (Optional) [Ollama](https://ollama.ai/) for local offline AI assistance

### 1. Clone the repository
```bash
git clone https://github.com/your-username/tglobal-loan-system.git
cd tglobal-loan-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and fill in your values:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres"
RATE_24K_PER_GRAM=7000
FRONTEND_URL="http://localhost:5173"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="tglobal@admin2024"
JWT_SECRET="your-super-secret-jwt-key"
```

### 4. Push Schema & Seed Database
```bash
# Push schema to database
npm run prisma:push --workspace=backend

# Seed active loan schemes
npm run seed --workspace=backend
```

### 5. Start Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🤖 AI Agent Configuration

The platform features a **Dual-Engine AI Architecture**:

### Option 1: Google Gemini (Primary & Cloud Hosted)
1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `backend/.env`:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeneratedGeminiKey..."
   ```
3. Restart the server. The agent will run on Gemini 1.5 Flash with native function calling.

### Option 2: Local Ollama (100% Offline & Free)
When `GEMINI_API_KEY` is left blank, the backend automatically routes requests to your local Ollama instance:
1. Download and install [Ollama](https://ollama.ai/).
2. Pull and start the recommended model:
   ```bash
   ollama pull llama3.2
   ollama run llama3.2
   ```
3. The model runs locally on `http://localhost:11434`. No external API calls or credit card required.

---

## 📡 API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/loan-schemes` | Returns active plans with interest rates, tenures, and max LTV | Public |
| `POST` | `/api/v1/quotes` | Pure arithmetic calculation for pure gold, gold value & loan per plan | Public |
| `POST` | `/api/v1/leads` | Server-validated lead submission with 7-day deduplication & idempotency | Public |
| `POST` | `/api/v1/otp/send` | Generates 6-digit OTP with 5-minute expiry | Public |
| `POST` | `/api/v1/otp/verify` | Verifies submitted OTP for mobile number | Public |
| `POST` | `/api/v1/agent/chat` | Stateless AI assistant chat with Gemini/Ollama tool calling | Public |
| `POST` | `/api/v1/admin/login` | Authenticates admin credentials, returns 8-hour JWT | Public |
| `GET` | `/api/v1/admin/leads` | Protected listing of all leads with status, metrics, and pagination | `Bearer JWT` |
| `PATCH` | `/api/v1/admin/leads/:id/status` | Updates lead status (`UNDER_REVIEW`, `APPROVED`, `REJECTED`) & logs audit | `Bearer JWT` |
| `GET` | `/api/v1/admin/leads/:id/audit-logs` | Fetches complete immutable audit trail for a lead | `Bearer JWT` |

---

## 🤖 5 Conversational AI Test Conversations

> **Assignment Reference**: Page 06 of hiring specification  
> All 5 conversations can be automatically verified via the benchmark script:
> ```bash
> npm run eval --workspace=backend
> ```

### Conversation 1: Happy Path Through to Submission
* **User**: *"I have 45 grams of 22 carat jewellery. Gross weight is 46 grams. How much can I get?"*
* **Agent Tool Call**: `calculate_quote({ netWeightGrams: 45, grossWeightGrams: 46, karat: 22 })`
* **Server Return**: Pure Gold: `41.25 g`, Valuation: `₹2,88,750`.
  - Monthly EMI Plan (75% LTV): `₹2,16,562` eligible.
  - Bullet Repayment Plan (70% LTV): `₹2,02,125` eligible.
* **Agent Reply**: Displays verified quotes, asks borrower which plan they prefer, and gathers applicant name and mobile number.
* **User Confirmation**: *"Please go ahead with Monthly EMI. My name is Aarav Sharma, mobile 9876543210. I confirm."*
* **Agent Tool Call**: `submit_application({ fullName: "Aarav Sharma", mobileNumber: "9876543210", ... })`
* **Outcome**: HTTP `201 Created` with issued `applicationId` (e.g. `APP-20261028-9220`).

---

### Conversation 2: Duplicate Application Within 7 Days
* **User**: *"Hello, I want to submit another application for my gold chain. Mobile number is 9876543210."*
* **Agent / Backend Check**: Re-evaluates 7-day mobile submission history in PostgreSQL.
* **Outcome**: HTTP `409 Conflict`.
* **Agent Reply**: *"An application for mobile 98XXXX3210 was already submitted on 28 Oct (Application ID: APP-20261028-9220). Per RBI policy, duplicate applications within 7 days cannot be processed. Please check your existing application."*

---

### Conversation 3: Missing Field the Agent Asks For
* **User**: *"I have 45 grams of gold. What loan amount can I get?"*
* **Agent Analysis**: Net weight provided (`45g`), but purity (`karat`) and gross weight are missing.
* **Agent Reply**: *"To calculate your exact eligible loan amount, could you please tell me the purity of your gold (18K, 22K, or 24K) and the gross weight including any stones or hooks?"*
* **User**: *"It is 22 karat hallmarked jewellery."*
* **Outcome**: Agent waits for required fields before calling `calculate_quote`, avoiding hallucinated estimates.

---

### Conversation 4: Off-Topic Request (Guardrails & RBI Compliance)
* **User**: *"Should I take this gold loan and invest the money into Bitcoin or Tata Motors stocks?"*
* **Agent Reply**: *"I am only able to assist with TGlobal gold loan estimations, active schemes, and loan applications. I cannot provide stock market, cryptocurrency, or investment advisory. Would you like to check how much loan you can get against your gold jewellery?"*
* **Outcome**: Strict domain boundary enforced. Zero speculative financial advice.

---

### Conversation 5: Net Weight Greater than Gross Weight
* **User**: *"My gold bangles have a net weight of 52 grams, and gross weight is 50 grams. Purity is 22K."*
* **Agent / Backend Check**: Validation rule `netWeightGrams <= grossWeightGrams` fails.
* **Server Return**: HTTP `400 Bad Request` with field error on `netWeightGrams`: `"Net weight cannot exceed gross weight"`.
* **Agent Reply**: *"It looks like the net weight (52 g) is greater than the gross weight (50 g), which isn't physically possible as gross weight includes net gold plus any stones. Could you double-check and re-enter your jewellery weights?"*
* **Outcome**: Input rejected before database write or quote issuance.

---

## 🌐 VPS Deployment Guide

### Question: *Should I use a Docker image or upload the codebase and run `docker compose up`?*

| Method | Best Used When | Pros | Cons |
|---|---|---|---|
| **Method A: Codebase + `docker compose up` on VPS** | Standard VPS (2GB+ RAM, e.g. $6/mo Hetzner or DigitalOcean) | • Easiest setup<br>• Everything self-contained on the VPS<br>• No external image registry needed<br>• One `git pull` updates everything | Takes 2–3 minutes to build assets on VPS during deployment |
| **Method B: Pre-built Docker Image Registry** | Budget VPS with 512MB–1GB RAM | • Zero CPU/RAM spent on builds on VPS<br>• Instant container swap | Requires setting up Docker Hub or GitHub Container Registry (ghcr.io) |

---

### Method A: Git Clone + Docker Compose on VPS (Recommended)

#### Step 1: Connect to your Ubuntu VPS
```bash
ssh root@your_vps_ip
```

#### Step 2: Install Docker & Docker Compose
```bash
# Update packages
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose Plugin
apt-get install -y docker-compose-plugin
```

#### Step 3: Clone the Repository to `/opt/tglobal-loan-system`
```bash
mkdir -p /opt/tglobal-loan-system
cd /opt/tglobal-loan-system
git clone https://github.com/your-username/tglobal-loan-system.git .
```

#### Step 4: Create the Production `.env`
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Fill in your database URL, Gemini key (or leave empty for Ollama), and secure admin credentials.

#### Step 5: Launch with Docker Compose
```bash
docker compose up -d --build
```

#### Step 6: Verify Containers are Running
```bash
docker compose ps
```
Your application is now live on port 80:
- Web App: `http://your_vps_ip`
- Backend API: `http://your_vps_ip/api/v1/loan-schemes`

---

### Method B: Pre-built Container Registry (Low-RAM VPS)

If your VPS has only 1GB RAM, compiling React and TypeScript can cause out-of-memory errors. Instead, build images on your local machine or GitHub Actions:

```bash
# 1. Build and tag images locally
docker build -t yourdockerhubuser/tglobal-backend:latest ./backend
docker build -t yourdockerhubuser/tglobal-frontend:latest ./frontend

# 2. Push to Docker Hub
docker push yourdockerhubuser/tglobal-backend:latest
docker push yourdockerhubuser/tglobal-frontend:latest

# 3. On the VPS, update docker-compose.yml to use the image tags, then run:
docker compose pull
docker compose up -d
```

---

### Configuring Domain & Free SSL (Let's Encrypt)

To serve your application over secure `https://your-domain.com`:

```bash
# Install Certbot & Nginx plugin on the VPS host
apt-get install -y certbot python3-certbot-nginx

# Obtain SSL Certificate
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot automatically configures auto-renewal certificates and HTTPS redirection.

---

## 🛡️ Database Safety & Automated Backup CI/CD

To prevent catastrophic data loss during code updates or schema migrations, the project includes an automated backup pipeline:

### 1. Pre-Deployment Database Snapshot
Before code is pushed or merged into `main`, [deploy.yml](file:///f:/Prod-projects/TGlobal-loan-system/.github/workflows/deploy.yml) automatically executes [scripts/backup-db.sh](file:///f:/Prod-projects/TGlobal-loan-system/scripts/backup-db.sh):
- Creates a timestamped, gzip-compressed snapshot: `backups/backup_tglobal_YYYYMMDD_HHMMSS.sql.gz`.
- Validates that the backup is non-empty.
- Uploads the encrypted backup as a GitHub Actions artifact (retained for 30 days).
- **If the backup fails, deployment stops immediately**.

### 2. Manual Backup & Restore Commands
```bash
# Create a manual database snapshot
chmod +x scripts/*.sh
./scripts/backup-db.sh

# Emergency restore if a deployment causes errors
./scripts/restore-db.sh backups/latest.sql.gz
```

### 3. Required GitHub Repository Secrets
Under your GitHub repository **Settings → Secrets and variables → Actions**, add:

| Secret Name | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection pooler URL (`?pgbouncer=true`) |
| `DIRECT_URL` | PostgreSQL direct connection URL on port 5432 |
| `VPS_HOST` | IP address or domain name of your VPS |
| `VPS_USER` | SSH username on VPS (e.g. `root` or `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key for passwordless authentication |

---

## 🧪 Automated Testing & AI Evaluation

### 1. Financial & API Test Suite (11 Test Cases)
```bash
# Run all unit, integration, and idempotency tests
npm run test --workspace=backend
```

```
 ✓ src/tests/api.test.ts (11 tests)
   ✓ Test Case 1: 45 g net · 22K · EMI -> pure 41.25 g · value ₹2,88,750 · loan ₹2,16,562 · 201
   ✓ Test Case 2: 45 g net · 22K · Bullet -> value ₹2,88,750 · loan ₹2,02,125 (70% LTV)
   ✓ Test Case 3: 10 g net · 18K · EMI -> pure 7.5 g · value ₹52,500 · loan ₹39,375
   ✓ Test Case 4: net 52 g > gross 50 g -> 400 validation error
   ✓ Test Case 5: mobile 5876543210 -> 400 validation error
   ✓ Test Case 6: Same mobile again within 7 days -> 409 duplicate error
   ✓ Test Case 7 (BONUS): Same request, same Idempotency-Key -> 201 original replay
   ✓ Test Case 8 (BONUS): 2 parallel requests, same mobile -> exactly one 201 and one 409
   ✓ Lead listing and masked phone numbers verification
   ✓ Audit trail logging on status transition
```

### 2. Conversational AI Evaluation Benchmark (5 Conversations)
```bash
# Run all 5 required conversation test cases
npm run eval --workspace=backend
```

```
 📊 CONVERSATIONAL EVALUATION SCORECARD (5/5 REQUIRED COVERED)
 ✅ PASS [Test 1] Happy path through to submission           (End-to-End Submission)
 ✅ PASS [Test 2] Duplicate within 7 days                    (Data Integrity & Anti-Fraud)
 ✅ PASS [Test 3] Missing field the agent asks for           (Conversational Collection)
 ✅ PASS [Test 4] Off-topic request (Guardrails & RBI)       (Agent Boundary Enforcement)
 ✅ PASS [Test 5] Net weight greater than gross weight       (Physical Feasibility Validation)
 Final Result: 5/5 Scenarios Passed (100% Pass Rate)
```

---

## ⭐ Attempted Bonuses (Rubric: Page 07)

### Bonus B1: Harden the Backend (+5 Points)
- **Keyed Mutex Concurrency Lock**: In-memory keyed mutex (`src/lib/lock.ts`) locking on `mobileNumber` to guarantee serial execution for simultaneous requests. Tested in **Test Case 8** where two parallel requests yield exactly one `201 Created` and one `409 Conflict`.
- **Idempotency-Key Support**: Replays the original HTTP 201 response when receiving retried submissions with the same `Idempotency-Key` header without creating duplicate database rows. Tested in **Test Case 7**.
- **7-Day Cooldown Deduplication**: Strictly rejects repeat applications from the same mobile within 7 days with HTTP 409 and the existing `applicationId`. Tested in **Test Case 6**.
- **Status Workflow & Audit Trail**: Full status transitions (`SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED`) with an immutable `audit_logs` table tracking timestamps, changes, and actors.

### Bonus B4: Ops Ready (+5 Points)
- **Multi-Stage Dockerfiles**: Production containerization for both Node.js backend (with Prisma CLI) and React Vite frontend (with custom Nginx reverse proxy and client-side routing fallback).
- **Docker Compose**: Production orchestration (`docker compose up -d --build`) with healthchecks and restart policies.
- **GitHub Actions CI/CD Pipeline**:
  - `ci.yml`: Automated TypeScript typechecks, Vitest test suite, and frontend build on every pull request.
  - `deploy.yml`: Pre-deployment automated database snapshot (`scripts/backup-db.sh`) storing compressed backups as 30-day GitHub artifacts, followed by automated VPS deployment and rollback support (`scripts/restore-db.sh`).

---

## 🔮 What We'd Do With More Time

1. **Live IBJA Gold Rate Integration**:
   - Replace the static benchmark rate with a real-time feed from the India Bullion and Jewellers Association (IBJA) API.
   - Cache rates in Redis with a 15-minute TTL to reduce external latency and handle market closure gracefully.

2. **OCR Appraisal Slip Extraction (Bonus B3)**:
   - Allow borrowers or field agents to upload a photograph of an appraisal slip or hallmark certificate.
   - Use Google Cloud Vision / Gemini Vision multimodal API to automatically extract gross weight, net weight, stone deduction, and hallmark karat.

3. **Production SMS & WhatsApp OTP Gateway**:
   - Integrate an Indian SMS gateway (e.g. Twilio, Gupshup, or MSG91) with DLT-registered templates for instant OTP delivery on mobile numbers.

4. **Streaming AI Agent Responses & Voice Input**:
   - Implement Server-Sent Events (SSE) for token streaming in the chat interface.
   - Add Web Speech API integration so field agents can speak queries hands-free in regional languages (Hindi, Tamil, Marathi).

---

## 📄 License
MIT © 2026 TGlobal Financial Technologies.
