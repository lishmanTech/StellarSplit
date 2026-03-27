# StellarSplit Developer Onboarding Guide

Welcome to StellarSplit 🚀

This guide helps new developers set up and contribute quickly.

---

# Prerequisites

- Node.js v20+
- PNPM or Yarn
- Docker
- PostgreSQL
- Redis
- Stellar Testnet account

---

# Monorepo Structure

apps/
  frontend/
  api/

packages/
  shared/
  ui/
  config/

docs/

---

# Setup Steps

## 1. Clone Repository

git clone https://github.com/your-org/stellarsplit.git
cd stellarsplit

---

## 2. Install Dependencies

pnpm install

---

## 3. Setup Environment Variables

Create .env in apps/api:

DATABASE_URL=
JWT_SECRET=
REDIS_URL=
STELLAR_NETWORK=testnet
STELLAR_ISSUER=
STELLAR_USDC_ASSET_CODE=USDC

---

## 4. Start Infrastructure

docker-compose up -d

---

## 5. Run API

cd apps/api
pnpm run start:dev

---

## 6. Run Frontend

cd apps/frontend
pnpm run dev

---

# Coding Standards

- Strict TypeScript
- Feature-based module structure
- DTO validation required
- No business logic in controllers
- Use service layer for blockchain calls

---

# Git Workflow

- Feature branches
- Conventional commits
- Pull request required
- CI must pass before merge

---

# Testing

Unit Tests:
pnpm run test

E2E Tests:
pnpm run test:e2e

---

# How to Add a New Module

1. Create folder in src/
2. Add module.ts
3. Add controller.ts
4. Add service.ts
5. Add DTO folder
6. Register module in AppModule

---

# Stellar Integration Guide

- Use Stellar SDK
- Always validate transaction hash
- Confirm transaction success before updating DB
- Handle network timeout gracefully

---

# Contribution Guidelines

- Keep PRs small
- Add tests for new features
- Update documentation
- Follow linting rules

---

# Useful Resources

- Stellar Docs: https://developers.stellar.org
- NestJS Docs: https://docs.nestjs.com
- Next.js Docs: https://nextjs.org/docs

---

# Vision

StellarSplit aims to remove awkward money conversations by making crypto bill splitting instant and seamless.

---

Welcome to the team 💫