import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomInt, randomUUID } from 'node:crypto';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 4000);
const ROUND_WAIT_MS = 8000;
const ROUND_BREAK_MS = 3500;
const CRASH_CHECK_MS = 50;
const DEMO_USER_ID = 'demo-player';

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '16kb' }));
app.disable('x-powered-by');

// A single-player, volatile practice simulation. These points have no cash value.
const state = {
  user: { id: DEMO_USER_ID, name: 'Demo Player', points: 10000 },
  round: null,
  history: [],
  bets: [],
  transactions: []
};

function makeRound(number) {
  return {
    id: randomUUID(),
    number,
    status: 'waiting',
    multiplier: 1,
    crashAt: Number((randomInt(101, 3001) / 100).toFixed(2)),
    createdAt: new Date().toISOString(),
    phaseStartedAt: Date.now()
  };
}

state.round = makeRound(1);

function publicRound() {
  const { crashAt, ...round } = state.round;
  return { ...round, crashAt: round.status === 'crashed' ? crashAt : undefined };
}

function addTransaction(type, amount, reference, status = 'completed') {
  state.transactions.unshift({
    id: randomUUID(),
    type,
    amount,
    reference,
    status,
    createdAt: new Date().toISOString()
  });
  state.transactions = state.transactions.slice(0, 100);
}

function settleCrash() {
  const round = state.round;
  round.status = 'crashed';
  round.multiplier = round.crashAt;
  round.crashedAt = new Date().toISOString();
  state.history.unshift({
    id: round.id,
    number: round.number,
    multiplier: round.crashAt,
    createdAt: round.crashedAt
  });
  state.history = state.history.slice(0, 100);

  for (const bet of state.bets) {
    if (bet.roundId === round.id && bet.status === 'active') {
      bet.status = 'lost';
      addTransaction('practice loss', bet.amount, `BET-${bet.id}`);
    }
  }
}

setInterval(() => {
  const round = state.round;
  const elapsed = Date.now() - round.phaseStartedAt;

  if (round.status === 'waiting' && elapsed >= ROUND_WAIT_MS) {
    round.status = 'flying';
    round.phaseStartedAt = Date.now();
  } else if (round.status === 'flying') {
    const seconds = (Date.now() - round.phaseStartedAt) / 1000;
    const multiplier = Number(Math.exp(seconds * 0.12).toFixed(2));
    if (multiplier >= round.crashAt) settleCrash();
    else round.multiplier = multiplier;
  } else if (round.status === 'crashed' && elapsed >= ROUND_BREAK_MS) {
    state.round = makeRound(round.number + 1);
  }
}, CRASH_CHECK_MS).unref();

function getPredictor() {
  const values = state.history.map(item => item.multiplier);
  if (!values.length) {
    return {
      history: [], average: null, median: null, highest: null, lowest: null,
      volatility: null,
      message: 'No completed demo rounds yet. Historical statistics are descriptive only and do not predict future outcomes.'
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    history: state.history.slice(0, 50),
    last10: values.slice(0, 10),
    last20: values.slice(0, 20),
    last50: values.slice(0, 50),
    average: Number(average.toFixed(2)),
    median: Number(median.toFixed(2)),
    highest: Math.max(...values),
    lowest: Math.min(...values),
    volatility: Number((Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length)).toFixed(2)),
    message: 'Demo history is descriptive only. Each round is independently generated; historical outcomes cannot predict or guarantee a future crash point.'
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'SKYWIN', mode: 'practice-only', status: 'online' });
});

app.get('/api/dashboard', (req, res) => {
  res.json({
    mode: 'practice-only',
    user: { id: state.user.id, name: state.user.name, points: state.user.points },
    currentRound: publicRound(),
    predictor: getPredictor(),
    bets: state.bets.slice(0, 20).map(({ id, amount, status, roundId, payout, cashoutAt }) => ({ id, amount, status, roundId, payout, cashoutAt })),
    transactions: state.transactions.slice(0, 10)
  });
});

app.get('/api/game/rounds', (req, res) => {
  res.json({ current: publicRound(), history: state.history.slice(0, 50) });
});

app.post('/api/game/bet', (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000) {
    return res.status(400).json({ error: 'Practice bets must be a whole number from 1 to 1,000 points.' });
  }
  if (state.round.status !== 'waiting') {
    return res.status(409).json({ error: 'Bets are accepted only during the round countdown.' });
  }
  if (state.user.points < amount) {
    return res.status(400).json({ error: 'Not enough demo points.' });
  }
  if (state.bets.some(bet => bet.roundId === state.round.id && bet.status === 'active')) {
    return res.status(409).json({ error: 'One practice bet per round is allowed.' });
  }

  state.user.points -= amount;
  const bet = {
    id: randomUUID(),
    roundId: state.round.id,
    amount,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  state.bets.unshift(bet);
  addTransaction('practice bet', -amount, `BET-${bet.id}`);
  res.status(201).json({ bet: { id: bet.id, amount: bet.amount, status: bet.status, roundId: bet.roundId } });
});

app.post('/api/game/cashout', (req, res) => {
  const bet = state.bets.find(item => item.id === req.body?.betId);
  if (!bet || bet.status !== 'active') {
    return res.status(404).json({ error: 'Active practice bet not found.' });
  }
  if (bet.roundId !== state.round.id || state.round.status !== 'flying') {
    return res.status(409).json({ error: 'Cash-out is available only while your round is flying.' });
  }

  // Multiplier and payout are calculated exclusively from server game state.
  const multiplier = state.round.multiplier;
  const payout = Math.floor(bet.amount * multiplier * 100) / 100;
  bet.status = 'cashed_out';
  bet.payout = payout;
  bet.cashoutAt = multiplier;
  state.user.points = Number((state.user.points + payout).toFixed(2));
  addTransaction('practice payout', payout, `CASH-${bet.id}`);
  res.json({ bet: { id: bet.id, status: bet.status, payout, cashoutAt: multiplier }, points: state.user.points });
});

app.get('/api/predictor', (req, res) => res.json(getPredictor()));

// Real-money features are deliberately unavailable in this practice build.
for (const path of ['/api/mpesa/initiate', '/api/mpesa/callback', '/api/wallet/deposit', '/api/wallet/withdraw']) {
  app.all(path, (req, res) => res.status(410).json({
    error: 'Unavailable: this SKYWIN build is practice-only and does not process payments or withdrawals.'
  }));
}

app.listen(PORT, () => console.log(`SKYWIN practice API listening on port ${PORT}`));
