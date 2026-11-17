# SKYWIN

SKYWIN is a demo Aviator gaming platform starter designed for safe local testing and UI/UX validation. It is not a production casino, license, or real-money payment system. Real M-Pesa flows require Daraja sandbox or production approvals, backend verification, and compliance review.

## Features
- User registration and login flow
- Wallet balance and transaction history
- Live Aviator-style game card
- Predictor analytics dashboard
- Admin overview dashboard
- M-Pesa sandbox initiation pattern
- Secure server-side configuration structure

## Stack
- React + Vite frontend
- Express backend API
- Demo in-memory persistence
- bcrypt password hashing
- environment-based config

## Setup

1. Install dependencies:
   npm install
2. Copy environment file:
   cp .env.example .env
3. Start the app:
   npm run dev
4. Open the frontend at:
   http://localhost:5173

## API
- Health check: http://localhost:4000/api/health
- Login: POST /api/auth/login
- Register: POST /api/auth/register
- Dashboard: GET /api/dashboard
- Predictor: GET /api/predictor
- Admin: GET /api/admin/overview
- Game bet: POST /api/game/bet
- M-Pesa initiate: POST /api/mpesa/initiate

## Important security notes
- Never store secret keys in frontend code.
- Keep Daraja credentials in server environment variables only.
- Always verify payment callbacks on the backend before crediting wallets.
- Do not claim legal licensing or real-money operation without proper approvals.
