# StellarSplit Architecture Guide

## Overview

StellarSplit is a mobile-first crypto bill splitting app powered by:

- Frontend: Next.js (App Router)
- Backend: NestJS (Modular Monorepo)
- Blockchain: Stellar Network
- AI: Receipt OCR + LLM Parsing
- Database: PostgreSQL
- Cache: Redis
- Storage: S3-compatible storage
- Auth: JWT + Refresh Tokens

---

# System Architecture

                ┌──────────────────┐
                │   Mobile Web UI  │
                │   (Next.js)      │
                └─────────┬────────┘
                          │
                          ▼
                ┌──────────────────┐
                │   API Gateway    │
                │   (NestJS)       │
                └─────────┬────────┘
                          │
     ┌────────────┬─────────────┬───────────────┐
     ▼            ▼             ▼               ▼
 Auth Module   Receipt Module  Split Module   Payment Module
     │            │             │               │
     ▼            ▼             ▼               ▼
  PostgreSQL   AI Service    Business Logic   Stellar SDK

---

# Core Modules

## 1. Auth Module
- JWT issuance
- Refresh tokens
- Role-based access
- Wallet linking

## 2. Receipt Module
- Image upload
- OCR parsing
- AI structuring
- Confidence scoring

## 3. Split Module
- Participant allocation
- Equal/custom split
- Debt tracking

## 4. Payment Module
- Stellar SDK integration
- XLM / USDC transfer
- Transaction confirmation
- Webhook verification

---

# Database Design (High-Level)

Users
- id
- email
- passwordHash
- stellarPublicKey

Receipts
- id
- userId
- imageUrl
- parsedData (JSONB)

Splits
- id
- receiptId
- status

SplitParticipants
- id
- splitId
- userId
- amountOwed
- status

Payments
- id
- splitId
- transactionHash
- asset
- network

---

# Blockchain Flow

1. User selects asset (XLM / USDC)
2. Backend generates transaction payload
3. Frontend signs via wallet
4. Transaction submitted to Stellar
5. Webhook confirms finality
6. Split marked as completed

---

# AI Receipt Processing Flow

1. Image upload
2. OCR extraction
3. LLM structuring
4. Item detection
5. Total verification
6. Stored as structured JSON

---

# Security Model

- Password hashing (bcrypt)
- JWT Access + Refresh strategy
- Rate limiting
- Input validation (class-validator)
- Signed transaction verification
- Webhook signature validation

---

# Deployment Architecture

Production:
- Vercel (Frontend)
- Dockerized NestJS API
- PostgreSQL (Managed)
- Redis (Managed)
- Stellar Mainnet

Test:
- Stellar Testnet
- Separate database instance

---

# Scalability Strategy

- Horizontal scaling (stateless API)
- Redis caching for split lookups
- Background workers for AI processing
- Webhook queue processing

---

End of Architecture Guide