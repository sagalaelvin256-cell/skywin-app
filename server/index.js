import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

const createDemoUser = async () => ({
  id: 'u_demo_1',
  name: 'Demo Player',
  email: 'demo@skywin.app',
  phone: '+254700000001',
  passwordHash: await bcrypt.hash('Password123!', 10),
  role: 'user',
  wallet: {
    balance: 24500,
    bettingBalance: 5000,
    pendingWithdrawals: 0
  },
  createdAt: new Date().toISOString()
});

const state = {
  users: [],
  transactions: [
    {
      id: 'tx_1',
      userId: 'u_demo_1',
      type: 'deposit',
      amount: 2000,
      status: 'completed',
      reference: 'DEP-202611170001',
      method: 'M-Pesa',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tx_2',
      userId: 'u_demo_1',
      type: 'bet',
      amount: 250,
      status: 'settled',
      reference: 'BET-202611170002',
      method: 'Bet',
      createdAt: new Date().toISOString()
    }
  ],
  bets: [],
  payments: [],
  rounds: [
    {
      id: 'r_cur_01',
      roundNumber: 4021,
      status: 'live',
      multiplier: 1.87,
      countdown: 12,
      crashAt: 4.61,
      updatedAt: new Date().toISOString()
    }
  ],
  admin: {
    totalUsers: 1284,
    activePlayers: 764,
    pendingWithdrawals: 7
  }
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  wallet: {
    balance: user.wallet.balance,
    bettingBalance: user.wallet.bettingBalance,
    pendingWithdrawals: user.wallet.pendingWithdrawals
  }
});

const buildRoundHistory = () => [
  { id: 4012, multiplier: 1.45, createdAt: '2026-11-17T08:10:00Z' },
  { id: 4013, multiplier: 2.31, createdAt: '2026-11-17T08:11:00Z' },
  { id: 4014, multiplier: 4.25, createdAt: '2026-11-17T08:12:00Z' },
  { id: 4015, multiplier: 1.87, createdAt: '2026-11-17T08:13:00Z' },
  { id: 4016, multiplier: 6.22, createdAt: '2026-11-17T08:14:00Z' },
  { id: 4017, multiplier: 2.91, createdAt: '2026-11-17T08:15:00Z' },
  { id: 4018, multiplier: 7.14, createdAt: '2026-11-17T08:16:00Z' },
  { id: 4019, multiplier: 1.9, createdAt: '2026-11-17T08:17:00Z' },
  { id: 4020, multiplier: 5.42, createdAt: '2026-11-17T08:18:00Z' },
  { id: 4021, multiplier: 3.74, createdAt: '2026-11-17T08:19:00Z' }
];

const predictorStats = () => {
  const values = buildRoundHistory().map(item => item.multiplier);
  const sorted = [...values].sort((a, b) => a - b);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const highest = Math.max(...values);
  const lowest = Math.min(...values);

  return {
    history: buildRoundHistory(),
    last10: values.slice(-10),
    last20: values.slice(-20),
    last50: values.slice(-50),
    average: Number(average.toFixed(2)),
    median: Number(median.toFixed(2)),
    highest: Number(highest.toFixed(2)),
    lowest: Number(lowest.toFixed(2)),
    volatility: Number(((highest - lowest) / average).toFixed(2)),
    message:
      'Aviator outcomes are random. Historical data can show frequency patterns, but it cannot guarantee or reliably predict the next crash multiplier.'
  };
};

const ensureDemoUser = async () => {
  if (state.users.length === 0) {
    state.users.push(await createDemoUser());
  }
};

app.get('/api/health', async (req, res) => {
  await ensureDemoUser();
  res.json({ ok: true, app: 'SKYWIN', mode: 'demo', status: 'online' });
});

app.post('/api/auth/register', async (req, res) => {
  await ensureDemoUser();
  const { name, email, phone, password } = req.body || {};

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  const exists = state.users.some(
    user => user.email.toLowerCase() === String(email).toLowerCase() || user.phone === phone
  );

  if (exists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = {
    id: `u_${uuidv4()}`,
    name,
    email,
    phone,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'user',
    wallet: {
      balance: 0,
      bettingBalance: 0,
      pendingWithdrawals: 0
    },
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  return res.status(201).json({ message: 'Registration successful', user: sanitizeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  await ensureDemoUser();
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = state.users.find(
    item => item.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.json({ message: 'Login successful', user: sanitizeUser(user) });
});

app.get('/api/dashboard', async (req, res) => {
  await ensureDemoUser();
  const user = state.users[0];

  res.json({
    user: sanitizeUser(user),
    currentRound: state.rounds[0],
    predictor: predictorStats(),
    transactions: state.transactions.slice(0, 6),
    admin: state.admin
  });
});

app.get('/api/predictor', async (req, res) => {
  await ensureDemoUser();
  res.json(predictorStats());
});

app.get('/api/admin/overview', async (req, res) => {
  await ensureDemoUser();
  res.json({
    users: state.admin.totalUsers,
    activePlayers: state.admin.activePlayers,
    pendingWithdrawals: state.admin.pendingWithdrawals,
    recentActivity: [
      { id: 1, label: 'Wallet top-up', value: 'KES 18,500', time: '2 mins ago' },
      { id: 2, label: 'Withdrawal review', value: '6 pending', time: '12 mins ago' },
      { id: 3, label: 'New sign-up', value: '21 new users', time: '30 mins ago' }
    ]
  });
});

app.get('/api/game/rounds', async (req, res) => {
  await ensureDemoUser();
  res.json({ current: state.rounds[0], history: buildRoundHistory() });
});

app.post('/api/game/bet', async (req, res) => {
  await ensureDemoUser();
  const { userId, amount, autoCashout, predictedMultiplier } = req.body || {};

  if (!userId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid bet payload' });
  }

  const user = state.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const value = Number(amount);
  if (user.wallet.balance < value) {
    return res.status(400).json({ error: 'Insufficient wallet balance' });
  }

  user.wallet.balance -= value;
  user.wallet.bettingBalance += value;

  const bet = {
    id: `bet_${uuidv4()}`,
    userId,
    amount: value,
    autoCashout: autoCashout ? Number(autoCashout) : null,
    predictedMultiplier: predictedMultiplier ? Number(predictedMultiplier) : null,
    status: 'active',
    round: state.rounds[0]?.id || 'r_demo',
    createdAt: new Date().toISOString()
  };

  state.bets.unshift(bet);

  return res.status(201).json({ message: 'Bet placed successfully', bet });
});

app.post('/api/game/cashout', async (req, res) => {
  await ensureDemoUser();
  const { userId, betId, currentMultiplier } = req.body || {};

  if (!userId || !betId || !currentMultiplier) {
    return res.status(400).json({ error: 'Cash-out requires userId, betId, and currentMultiplier' });
  }

  const bet = state.bets.find(
    item => item.id === betId && item.userId === userId && item.status === 'active'
  );

  if (!bet) {
    return res.status(404).json({ error: 'Active bet not found' });
  }

  const user = state.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const payout = Number((bet.amount * Number(currentMultiplier)).toFixed(2));
  user.wallet.balance += payout;
  user.wallet.bettingBalance = Math.max(0, user.wallet.bettingBalance - bet.amount);
  bet.status = 'cashed_out';
  bet.payout = payout;

  state.transactions.unshift({
    id: `tx_${uuidv4()}`,
    userId,
    type: 'cashout',
    amount: payout,
    status: 'completed',
    reference: `CASH-${Date.now()}`,
    method: 'Cashout',
    createdAt: new Date().toISOString()
  });

  return res.json({ success: true, message: 'Cash-out processed', payout });
});

app.get('/api/wallet/history', async (req, res) => {
  await ensureDemoUser();
  res.json({ transactions: state.transactions });
});

app.post('/api/wallet/deposit', async (req, res) => {
  await ensureDemoUser();
  const { amount, method = 'M-Pesa', phone } = req.body || {};

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  const user = state.users[0];
  const tx = {
    id: `tx_${uuidv4()}`,
    userId: user.id,
    type: 'deposit',
    amount: Number(amount),
    status: 'pending_verification',
    reference: `DEP-${Date.now()}`,
    method,
    phone,
    createdAt: new Date().toISOString()
  };

  state.transactions.unshift(tx);
  return res.status(201).json({ message: 'Deposit initiated', transaction: tx });
});

app.post('/api/mpesa/initiate', async (req, res) => {
  await ensureDemoUser();
  const { amount, phone } = req.body || {};

  if (!amount || !phone) {
    return res.status(400).json({ error: 'Amount and phone are required' });
  }

  const payment = {
    id: `pay_${uuidv4()}`,
    type: 'stk_push',
    amount: Number(amount),
    phone,
    reference: `MPESA-${Date.now()}`,
    status: 'initiated',
    result: null,
    createdAt: new Date().toISOString()
  };

  state.payments.push(payment);

  return res.json({
    success: true,
    message: 'STK push initiated in sandbox mode. Real payment verification requires Daraja setup and secure callback verification.',
    reference: payment.reference,
    payment
  });
});

app.post('/api/mpesa/callback', async (req, res) => {
  await ensureDemoUser();
  const body = req.body || {};
  const { MerchantRequestID, ResultCode, ResultDesc, CheckoutRequestID } = body;

  if (!MerchantRequestID && !CheckoutRequestID) {
    return res.status(400).json({ success: false, message: 'Invalid callback payload' });
  }

  const payment = state.payments.find(
    item => item.reference === MerchantRequestID || item.id === CheckoutRequestID
  );

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Unknown payment reference' });
  }

  const status = ResultCode === 0 ? 'completed' : 'failed';
  payment.status = status;
  payment.result = ResultDesc || 'Processed';

  if (status === 'completed') {
    const user = state.users[0];
    user.wallet.balance += Number(payment.amount);

    state.transactions.unshift({
      id: `tx_${uuidv4()}`,
      userId: user.id,
      type: 'deposit',
      amount: Number(payment.amount),
      status: 'completed',
      reference: payment.reference,
      method: 'M-Pesa',
      createdAt: new Date().toISOString()
    });
  }

  return res.json({ success: true, message: 'Callback processed', payment });
});

app.post('/api/wallet/withdraw', async (req, res) => {
  await ensureDemoUser();
  const { userId, amount, phone } = req.body || {};

  if (!userId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal request' });
  }

  const user = state.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const value = Number(amount);
  if (user.wallet.balance < value) {
    return res.status(400).json({ error: 'Insufficient available balance' });
  }

  user.wallet.balance -= value;
  user.wallet.pendingWithdrawals += value;

  const tx = {
    id: `tx_${uuidv4()}`,
    userId,
    type: 'withdrawal',
    amount: value,
    status: 'pending_review',
    reference: `WDR-${Date.now()}`,
    method: 'M-Pesa',
    phone,
    createdAt: new Date().toISOString()
  };

  state.transactions.unshift(tx);
  return res.json({ success: true, message: 'Withdrawal request submitted', transaction: tx });
});

app.listen(PORT, () => {
  console.log(`SKYWIN API running on http://localhost:${PORT}`);
});
