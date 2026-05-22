# AI Cybersecurity Log Analyzer

Production-ready starter monorepo for a real-time AI-powered server monitoring system.

## Apps
- watcher-agent -> Watches VPS logs in real time
- api-server -> NestJS API backend
- ai-worker -> AI threat analysis worker
- dashboard -> Next.js frontend

## Features
- Real-time log watching
- Threat detection engine
- Queue architecture
- AI analysis pipeline
- PostgreSQL + Prisma
- Redis + BullMQ
- Dockerized setup

## Quick Start

```bash
docker compose up --build
```

## Logs Monitored
- /var/log/auth.log
- /var/log/nginx/access.log
- ~/.pm2/logs

## Architecture

Watcher -> Redis Queue -> AI Worker -> PostgreSQL -> Dashboard