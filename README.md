# Voice-to-Cloud Architecture Studio ☁️🎙️

> **AI Architecture Decision & Simulation Studio**: Design an architecture, experiment with it, change it, simulate what happens, understand the impact, and optimize it before building the real application.

Voice-to-Cloud Architecture Studio is an intelligent cloud architecture design, simulation, and decision-support platform. It enables anyone—from non-technical founders to experienced software architects—to describe software ideas in natural language or voice, instantly generating production-ready architectures, simulating failure cascades, estimating infrastructure costs, testing traffic surges, tracking architecture decisions (ADRs), and exporting Terraform blueprints.

---

## 🌟 Main Features

### 1. 🎙️ Idea-to-Architecture (Natural Language & Voice)
- **Zero Technical Jargon Needed**: Describe ideas like *"I want to build a shopping website with online payments and order tracking"*, and the engine understands the e-commerce domain, requirement catalog, and required services.
- **Web Speech API**: Hands-free voice recognition with live audio wave visualization and editable speech-to-text.
- **Smart Clarification Questions**: Dynamically prompts for scale, payment requirements, compliance, and real-time alerts.

### 2. 🔮 What-If Simulator (10 Scenario Types)
- Ask architectural questions such as:
  - *"What happens if traffic becomes 10 times higher?"*
  - *"What happens if PostgreSQL fails?"*
  - *"What happens if I remove Redis?"*
  - *"What happens if users increase from 10,000 to 1,000,000?"*
- Supports 10 scenario types: Traffic Surge, Traffic Drop, Component Failure, Component Removal, Component Addition, Technology Change, Budget Constraints, Storage Growth, User Growth, and Custom Scenarios.
- Recalculates projected RPS, latency, cost differences, and potential bottlenecks.
- Explicitly labeled as **Scenario-based simulation** (not a live production prediction).

### 3. 💥 Failure Cascade Simulator
- Simulates outage scenarios for Database, Backend, API Gateway, Cache, Load Balancer, and Payment Services.
- Visual 3-tier cascade graph: `FAILED COMPONENT` $\rightarrow$ `DEPENDENT COMPONENTS` $\rightarrow$ `USER-IMPACTED FEATURES`.
- Recommends actionable mitigations (Multi-AZ replication, failover automation, circuit breakers, dead-letter queues).

### 4. 🔬 Change Impact Analyzer & Dependency Graph
- Analyzes upstream and downstream dependencies before changes are made (e.g., removing Redis highlights increased database IOPS and application latency).
- Visual status levels: `LOW IMPACT`, `MEDIUM IMPACT`, `HIGH IMPACT`, and `CRITICAL`.

### 5. 📈 12-Month Architecture Growth Simulator
- Enter current users, monthly growth rate, and simulation duration (e.g., 10,000 users at 15% monthly growth over 12 months).
- Generates a period-by-period milestone timeline estimating users, requests/sec, compute load, database load, bandwidth, storage, and costs.

### 6. ⚖️ Multi-Architecture Comparison
- Compare multiple architectures for the same requirements side-by-side across 9 dimensions (Estimated Cost, Scalability, High Availability, Performance, Complexity, Component Count, Dependencies, Bottlenecks, and Security).
- Explains factual trade-offs without arbitrarily declaring a single "winner".

### 7. 💵 Budget-Constrained Architecture Mode
- Set a target monthly budget in **INR (₹)** or **USD ($)**.
- If estimated cost exceeds budget, displays `BUDGET EXCEEDED` with difference and non-destructive cost-reduction alternatives.

### 8. 🧠 Architecture Decision Memory (ADRs)
- Store, edit, and review Architecture Decision Records (Decision, Reason, Alternative, Trade-off, Affected Components).
- Automatically flags when an architecture change affects a previously recorded decision (*"This decision has changed"*).

### 9. 💬 Conversational Architecture Editing
- Modify architecture dynamically using natural language commands:
  - *"Add Redis"*
  - *"Remove Redis"*
  - *"Use Python for backend"*
  - *"Make this architecture cheaper"*

### 10. ☁️ Multi-Cloud Mapping & Terraform IaC Preview
- One-click translation of logical architecture to AWS and GCP native cloud services with selection justifications.
- Generates clean, modular Terraform HCL code preview for review before deployment.

---

## 🏗️ Architecture Overview & Technology Stack

```
Voice-to-Cloud Architecture Studio
│
├── backend/                             # Python / FastAPI REST Backend
│   ├── main.py                          # Application entry point & CORS configuration
│   ├── api/routes.py                    # REST API endpoints & route handlers
│   ├── models/                          # Pydantic v2 schemas & SQLAlchemy ORM models
│   ├── database/database.py             # SQLite / PostgreSQL database engine
│   ├── services/                        # Modular architectural domain services
│   │   ├── requirement_analyzer.py      # Natural language & domain parser
│   │   ├── architecture_generator.py    # Multi-tier recommendation engine
│   │   ├── architecture_validator.py    # Orphan & security exposure validator
│   │   ├── health_analyzer.py           # Multi-pillar scoring engine (Security, HA, Cost)
│   │   ├── cost_estimator.py            # AWS & GCP baseline cost calculator
│   │   ├── traffic_simulator.py         # Capacity & bottleneck simulator
│   │   ├── failure_simulator.py         # Blast-radius & outage calculator
│   │   ├── what_if_simulator.py         # 10 What-If scenario simulations
│   │   ├── impact_analyzer.py           # Dependency ripple & impact analyzer
│   │   ├── growth_simulator.py          # 12-month scaling trajectory simulator
│   │   ├── architecture_comparator.py   # Multi-architecture comparison engine
│   │   ├── decision_manager.py          # Architecture Decision Records (ADR)
│   │   ├── conversational_editor.py     # Natural language command parser
│   │   ├── optimizer.py                 # Trade-off profiles & recommendations
│   │   ├── cloud_mapper.py              # Logical to AWS/GCP mapping
│   │   └── terraform_generator.py       # Terraform HCL code generator
│   └── tests/                           # Pytest unit & integration test suite
│
├── src/                                 # Frontend (React 18 + Vite)
│   ├── components/                      # Modular dashboard panels & modals
│   ├── services/                        # API client with offline fallback
│   ├── data/presetArchitectures.js      # 9 domain presets
│   └── index.css                        # Modern dark-mode styling & layout
│
├── package.json                         # Frontend dependencies & scripts
├── requirements.txt                     # Backend Python dependencies
├── .env.example                         # Environment configuration template
└── .gitignore                           # Git ignore definitions
```

### Core Technologies
- **Frontend**: React 18, Vite 5, Mermaid.js (interactive architecture diagrams), Lucide Icons, Vanilla CSS design system.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy ORM.
- **Database**: SQLite (default local development), PostgreSQL compatible via `DATABASE_URL`.
- **Infrastructure-as-Code**: HashiCorp Terraform HCL.

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/voice-to-cloud-architecture-studio.git
cd voice-to-cloud-architecture-studio
```

### 2. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

### 3. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run backend tests (22 tests)
python -m pytest -v backend/tests

# Start the FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive FastAPI Swagger documentation will be available at: **`http://127.0.0.1:8000/docs`**

### 4. Frontend Setup
In a new terminal:
```bash
# Install frontend dependencies
npm install

# Run frontend test suite (56 tests)
npm test

# Build production bundle
npm run build

# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 5. Unified Local Development (Recommended)
To start both backend and frontend together with a single command after restarting your IDE:
```bash
npm run dev:all
# or
npm start
```
This:
1. Automatically frees any stale background processes on ports `8000` and `5173`.
2. Starts the FastAPI backend on **`http://127.0.0.1:8000`**.
3. Gracefully waits until the backend health endpoint (`/api/health`) is responding.
4. Starts the Vite frontend on **`http://localhost:5173`** with zero proxy `ECONNREFUSED` errors.
5. Displays unified, color-coded logging for both services in a single terminal.


---

## 🔑 Environment Variables Reference

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Frontend | `""` (uses `/api` proxy) | Target URL for backend in production (e.g. `https://api.yourdomain.com`). |
| `PORT` | Backend | `8000` | Port for FastAPI Uvicorn server. |
| `CORS_ORIGINS` | Backend | `localhost:5173,localhost:3000` | Comma-separated list of allowed CORS frontend origins. |
| `DATABASE_URL` | Backend | Local SQLite path | SQLAlchemy connection URL (e.g., `postgresql://user:pass@host:5432/dbname`). |
| `LLM_API_KEY` | Optional | `""` | Optional external LLM API key for edge worker expansion. |
| `AWS_ACCESS_KEY_ID` | Optional | `""` | Optional AWS credential placeholder for live billing verification. |
| `AWS_SECRET_ACCESS_KEY` | Optional | `""` | Optional AWS secret placeholder. |

---

## 🧪 Testing Suite

### Run All Backend Tests (Pytest)
```bash
python -m pytest -v backend/tests
```
Tests cover requirement analysis, architecture generation, validator rules, health scoring, What-If simulation, impact analysis, growth simulation, multi-architecture comparison, decision records, and conversational commands.

### Run All Frontend Tests (Node.js)
```bash
npm test
```
Tests cover natural language parsing, Mermaid diagram generation, health scoring, cost calculations, What-If simulation, change impact calculation, growth trajectory calculation, ADR storage, and conversational state updates.

### Build Production Bundle
```bash
npm run build
```
Generates minified production assets in the `dist/` directory.

---

## ⚠️ Important Limitations & Disclaimers

1. **Cost Estimations are Baseline Approximations**: Cloud cost figures are calculated using configurable sample baseline pricing data from `pricing_catalog.json`. They are intended for architectural sizing and trade-off comparison, **not as live billing predictions**.
2. **Simulations are Scenario-Based Models**: Traffic, growth, and failure cascading tests are architectural graph models, not live production load tests or chaos engineering injections.
3. **Security Audits are Design Diagnostics**: Security and health checks evaluate architectural best practices (e.g., private database networks, authentication layers, HTTPS encryption). They do **not** replace a professional penetration test or security compliance audit.
4. **Terraform Blueprints are Previews**: Generated Terraform code is an educational starting point and must be reviewed against your organization's security policies before running `terraform apply`.

---

## 🚀 Production Deployment Guidelines

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Set the build command to `npm run build`.
2. Set the publish directory to `dist`.
3. Set the environment variable `VITE_API_BASE_URL` to your production backend URL (e.g. `https://api.yourdomain.com`).

### Backend Deployment (Render / Railway / AWS ECS / Google Cloud Run)
1. Build container using Python 3.11 with `pip install -r requirements.txt`.
2. Start command: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
3. Configure `DATABASE_URL` with a managed PostgreSQL instance for production data persistence.
4. Configure `CORS_ORIGINS` with your production frontend URL (e.g., `https://studio.yourdomain.com`).

---

## 📄 License
MIT License. Built for software architects, engineering teams, and founders.
