# ⚡ JobMatch AI — Placement & Career Intelligence Platform

[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-003B57?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.sqlite.org/)

> **Live Deployment:** [https://jobmatchingagent.onrender.com](https://jobmatchingagent.onrender.com)

---

## 🌟 Overview

**JobMatch AI** (powered by the **Agent 50** placement intelligence engine and **SantraAI** conversational assistant) is a comprehensive academic career intelligence and campus recruitment platform. It connects Students, Training & Placement (T&P) Officers, and Heads of Departments (HOD) through multi-factor match algorithms, automated JD structuring, real-time application pipelines, and dynamic AI-powered insights.

---

## 🚀 Architecture & Core Features

### 1. 🧠 Agent 50 Multi-Parametric Matching Engine
Grounded in deterministic, explainable mathematical weights totaling exactly **100%**:
- **Skill Alignment (40%)**: Strict token and synonym equivalence mapping (`React` $\leftrightarrow$ `React.js`, `Python` $\leftrightarrow$ `Python3`), proficiency multipliers, and verified credential weighting without substring false-positives.
- **Project & Portfolio Relevance (20%)**: Semantic evaluation of project tech stacks, live links, and GitHub repositories against job requirements.
- **Experience & Role Domain Track (15%)**: Alignment between student career track preferences and hiring roles.
- **Certifications & Academic Rigor (15%)**: CGPA evaluation against threshold cutoffs, active backlog restrictions, and verified certifications.
- **Technical Readiness Index (10%)**: Institutional readiness evaluation covering technical, aptitude, and interview benchmarks.
- **Dynamic Explainability**: Produces transparent reasons for candidate match strength and concrete remediation guidance for identified skill gaps.

### 2. 🤖 SantraAI Grounded Conversational Assistant
- Server-side integration with **Groq LLM** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`).
- Grounded strictly in authenticated user role context and real database records.
- Zero credential exposure to frontend clients.

### 3. 👥 Multi-Role Portal Isolation & RBAC
- **Student Portal**: Access personalized match rankings, radar compatibility breakdowns, application timelines, interview details, and skill gap remediation.
- **Training & Placement (T&P) Portal**: Full administrative capability: create company drives, rank candidate pools, advance interview rounds, and monitor institutional analytics.
- **HOD Portal**: Read-only departmental oversight, monitor student placement statistics, track active drives, and review curriculum skill gaps.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Lucide React, Canvas Confetti
- **Backend**: Node.js, Express, JWT Authentication, CORS with strict allowlisting, Rate Limiting
- **Database**: SQLite (`sql.js` WebAssembly) with automatic schema indexing and migration path to persistent PostgreSQL
- **AI / LLM**: Groq API (`llama-3.3-70b-versatile`)
- **Deployment**: Render Cloud (Docker / Node Web Service)

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18.x to v22.x recommended)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/vu241fa04a65-alt/JobMatchingAgent.git
cd JobMatchingAgent
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your environment variables:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=dev_jwt_secret_jobmatchingagent_2026_super_secure_key
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DB_PATH=./server/data/jobmatch.db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000
```

### 3. Install Dependencies
```bash
npm install
```
*(The root `postinstall` script automatically installs and builds client dependencies).*

### 4. Start Development Servers
```bash
# Starts both Express backend (:5000) and Vite frontend (:5173) concurrently
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)** to access the application.

---

## 🔑 Seeded Demo Accounts

Predefined accounts in the database:

| Role | Portal Tab | Identifier (USN / ID / Email) | Default Seed Password | Access Level |
|---|---|---|---|---|
| **Student** | Student Portal | `1RV23CS184` or `subbu@rvce.edu.in` | `Student@123` | Student Dashboard & Matches |
| **Student** | Student Portal | `1RV22IS015` or `siri.c@rvce.edu.in` | `Student@123` | Student Dashboard & Matches |
| **T&P Officer** | T&P Portal | `TP-OFFICER-01` or `aarav.sharma@rvce.edu.in` | `TPCell@123` | Full Institutional Administration |
| **HOD** | HOD Portal | `HOD-CSE-01` or `hod.cse@rvce.edu.in` | `HOD@123` | Department Overview (Read-Only) |

*Note: Passwords are authenticated strictly using bcrypt against stored database hashes. Hardcoded fallbacks are removed.*

---

## 🧪 Testing & Verification

Run the full automated test suite (including production audit, security authorization checks, horizontal privilege escalation tests, and matching engine unit tests):

```bash
# Run all tests
npm test

# Run security & matching unit test suite specifically
npm run test:security
```

---

## 🚀 Render Cloud Deployment

### Web Service Configuration

1. **Create Web Service** on Render connected to this repository:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

2. **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production hardening & security checks |
   | `JWT_SECRET` | *(32+ character random secret)* | Cryptographic signing key for sessions |
   | `GROQ_API_KEY` | *(Your Groq API key)* | Required for SantraAI chatbot |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` | LLM model for SantraAI |
   | `DB_PATH` | `./server/data/jobmatch.db` | SQLite database file location |
   | `ALLOWED_ORIGINS` | `https://jobmatchingagent.onrender.com` | Trusted CORS origins |

### Persistent PostgreSQL Database Migration (Recommended)

To migrate from local SQLite storage to persistent managed PostgreSQL on Render:

1. Provision a PostgreSQL instance on Render.
2. Run the automated PostgreSQL migration script:
   ```bash
   node server/db/migrate_to_postgres.js
   ```
3. Load the generated dump into your PostgreSQL database:
   ```bash
   psql "$DATABASE_URL" -f server/data/postgres_migration_dump.sql
   ```
