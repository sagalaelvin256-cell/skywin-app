# SKYWIN practice simulation

SKYWIN is an independent Aviator-style **practice game** for local testing and interface demonstration. It is not the Aviator game of another operator. It does not process real money, deposits, withdrawals, or prizes. Demo points have no cash value.

## Features
- Responsive dark-themed React/Vite frontend.
- Server-managed countdown, flying and crash phases.
- Crash outcome generated server-side with Node's cryptographic random integer source. The secret crash point is not returned while the round is running.
- Practice bets and cash-outs validated against server state; the client cannot supply the multiplier or payout.
- Recent round history and descriptive statistics, with an explicit no-prediction notice.
- Payment and withdrawal endpoints disabled (HTTP 410).

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>. API health: <http://localhost:4000/api/health>.

A practice bet can be placed during the countdown (1–1,000 points, one per round). Cash-out is enabled only during the flight. The server maintains the practice balance and computes the payout. All data is in memory and resets when the API restarts; this is not multi-user or persistent.

## Routes
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/game/rounds`
- `POST /api/game/bet` with `{ "amount": 100 }`
- `POST /api/game/cashout` with `{ "betId": "..." }`
- `GET /api/predictor`

M-Pesa, deposit, and withdrawal routes are intentionally disabled. No payment callback can credit a balance.

## Scope and production warning
This code is a local practice simulation, **not** a production gambling platform. It has no durable database, real account authentication, multi-user isolation, regulated game certification, payment processing, or production monitoring. Do not expose it as a real-money game. Any future real-money service requires qualified legal/compliance review, applicable licensing and payment approvals, independent game testing, robust security engineering, and a production architecture. Historical results cannot reliably predict future rounds.
