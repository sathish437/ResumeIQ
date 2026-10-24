# ResumeIQ — AI-Powered Resume Intelligence & Grounded Analysis

ResumeIQ is a full-stack, enterprise-grade AI SaaS application that extracts explicit skills, performs grounded evidence citations from PDF/DOCX resumes, facilitates source-grounded AI chat with conversation memory, benchmarks custom job descriptions, and creates personalized career roadmaps.

---

## Architecture Overview

* **Frontend:** React 19, TypeScript, Vite, Motion, Lucide Icons, and Vanilla CSS Design System.
* **Frontend Web Server:** Nginx 1.27 Alpine (Production SPA routing, reverse proxy for `/api/`, COOP headers, Gzip).
* **Backend:** Java 21, Spring Boot 4.1.1, Spring AI 2.0.1, Spring Security, Spring JDBC, Apache PDFBox, Apache POI.
* **Database:** PostgreSQL 16 (Local container with persistent volume) or Neon Serverless PostgreSQL.
* **AI Provider:** Google Gemini API (`gemini-2.5-flash`).
* **Authentication:** Google OAuth 2.0 / Google Identity Services with strict user data isolation.

```
+-------------------------------------------------------------+
| Browser Client (http://localhost:5173 or http://localhost)  |
+-------------------------------------------------------------+
                              |
                              | HTTP / WebSocket / Static Assets
                              v
+-------------------------------------------------------------+
| resumeiq-frontend (Nginx Reverse Proxy & Static Web Server) |
| - Port: 80 (mapped to host 5173 and 80)                     |
| - Serves React production bundle                            |
| - Proxies /api/* -> http://backend:8080/api/*               |
| - Header: Cross-Origin-Opener-Policy same-origin-allow-popups|
+-------------------------------------------------------------+
                              |
                              | Internal Docker Network: resumeiq-network
                              v
+-------------------------------------------------------------+
| resumeiq-backend (Spring Boot 4.x / Java 21)                |
| - Port: 8080 (internal + mapped to host 8080)               |
| - Spring Security Authentication & Cookie Session Mgmt      |
| - Spring AI + Gemini API Engine                             |
+-------------------------------------------------------------+
                              |
                              | JDBC (port 5432)
                              v
+-------------------------------------------------------------+
| resumeiq-postgres (PostgreSQL 16 Alpine)                    |
| - Persistent named volume: resumeiq_postgres_data           |
+-------------------------------------------------------------+
```

---

## Quick Start with Docker Compose

### 1. Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine + Docker Compose Plugin (Linux).

### 2. Environment Setup
Copy the template `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Build and Start the Application
Run Docker Compose in detached mode:
```bash
docker compose up --build -d
```

### 4. Access the Application
* **Frontend Application:** Open [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost)
* **Backend Swagger API Docs:** Open [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **OpenAPI Specification:** Open [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## Docker Compose Management Commands

### Check Running Services and Health
```bash
docker compose ps
```
All services should display `healthy`:
* `resumeiq-postgres` (healthy)
* `resumeiq-backend` (healthy)
* `resumeiq-frontend` (healthy)

### Stream Live Logs
View logs for all services:
```bash
docker compose logs -f
```
Or view logs for a specific service:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Stop the Application (Preserving Database Data)
```bash
docker compose down
```
> [!NOTE]
> `docker compose down` gracefully stops and removes containers while **preserving** the PostgreSQL database volume (`resumeiq_postgres_data`).

> [!WARNING]
> **DO NOT** casually run `docker compose down -v`. The `-v` flag permanently deletes the named volume and erases all uploaded resumes, user accounts, and AI chat history!

### Rebuilding after Code Changes
To rebuild frontend or backend after making modifications:
```bash
docker compose up --build -d
```

---

## Database Configuration & Management

### Option A: Local Containerized PostgreSQL (Default)
The compose setup automatically launches a local PostgreSQL 16 container with a named volume `resumeiq_postgres_data` mapped to `/var/lib/postgresql/data`.
* Host Port: `5432`
* Database: `resumeiq`
* Username: `postgres`
* Password: `postgres`

### Option B: External Neon PostgreSQL
To connect the containerized backend to an external Neon database instead of local Postgres, update `.env`:
```env
DATABASE_URL=jdbc:postgresql://ep-rapid-river-b33cn2dy-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_USERNAME=your_neon_username
DB_PASSWORD=your_neon_password
```

### Database Backup & Restore

#### Backing up local PostgreSQL:
```bash
docker compose exec postgres pg_dump -U postgres resumeiq > resumeiq_backup.sql
```

#### Restoring from backup:
```bash
cat resumeiq_backup.sql | docker compose exec -T postgres psql -U postgres resumeiq
```

---

## Google OAuth 2.0 Configuration

ResumeIQ uses Google Identity Services for single sign-on with token audience validation on the backend.

### Required Authorized JavaScript Origins
In [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) for OAuth Client `837596203973-dnhf7rp7qgpte6bbafunvshu2b0ghmui.apps.googleusercontent.com`:
Ensure the following origins are added under **Authorized JavaScript origins** (no trailing slashes):
* `http://localhost:5173`
* `http://localhost`
* `http://127.0.0.1:5173`

> [!TIP]
> Changes made in the Google Cloud Console take **5 to 15 minutes** to propagate worldwide.

---

## Reverse Proxy & Security Highlights

1. **Same-Origin API Architecture:**
   * Browser requests use relative paths (`/api/...`). Nginx reverse proxies them to `http://backend:8080/api/...`.
   * This eliminates cross-origin browser issues, guarantees cookies (`resumeiq_session`) function smoothly as first-party cookies, and keeps internal container addresses hidden.
2. **COOP Configuration for Google Popups:**
   * Nginx and Spring Security are both configured with `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
   * This enables the Google OAuth popup to communicate via `window.opener.postMessage` without being blocked.
3. **Multi-User Data Isolation:**
   * Resume uploads, analyses, chat turns, and roadmaps are strictly scoped to the authenticated `AppUser` ID on the server.
   * Cross-account data leaks are completely blocked at the controller, service, and database repository layers.
4. **Non-Root Execution:**
   * The backend Spring Boot container executes under an unprivileged user `appuser` (UID 10001).
