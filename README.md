# momenTUM Designer

This repository contains the Designer service for the momenTUM research platform. It’s shipped as Docker containers and served behind Caddy.

## Prerequisites

- Docker & Docker Compose  
- Caddy (v2)  
- A `.env` file placed in `backend/` containing your environment variables

## Quickstart

1. **Prepare `.env`**  
   Copy `backend/.env.example` → `backend/.env` and fill in required values (database URL, REDCap API key, etc).

2. **(Optional) Create Caddy network**  
   If using Caddy in a separate Docker network:  
   ```
   docker network create caddy
   ```

3. **Launch all services**  
   ```bash
   docker-compose up -d --build
   ```

4. **Verify endpoints**  
   - Backend API:  `http://localhost:8200/api`  
   - Frontend UI:  `http://localhost:3200/`  
   - Caddy proxy: `http://localhost:8080/`  

## Services

| Service     | Container Name           | Description               |
| ----------- | ------------------------ | ------------------------- |
| backend     | study-designer-api       | FastAPI backend (port 8200) |
| frontend    | study-designer-frontend  | TypeScript UI (port 3200)  |
| tests       | study-designer-tests     | Pytest suite               |
| caddy       | caddy-designer           | Reverse proxy (port 8080)  |

## Caddy Configuration

See [`infrastructure/Caddyfile`](infrastructure/Caddyfile) for the full proxy setup.

---

*All services join the same Docker Compose network by default; attach `caddy` to `caddy` network only if needed.*
