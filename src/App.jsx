import { useEffect, useMemo, useState } from 'react';

const defaultDashboard = {
  user: {
    id: 'u_demo_1',
    name: 'Demo Player',
    email: 'demo@skywin.app',
    phone: '+254700000001',
    role: 'user',
    wallet: {
      balance: 24500,
      bettingBalance: 5000,
      pendingWithdrawals: 0
    }
  },
  currentRound: {
    id: 'r_cur_01',
    roundNumber: 4021,
    status: 'live',
    multiplier: 1.87,
    countdown: 12,
    crashAt: 4.61,
    updatedAt: new Date().toISOString()
  },
  predictor: {
    average: 3.12,
    median: 2.91,
    highest: 7.14,
    lowest: 1.45,
    history: [],
    message: 'Aviator outcomes are random. Historical data cannot guarantee the next result.'
  },
  transactions: [],
  admin: {
    totalUsers: 1284,
    activePlayers: 764,
    pendingWithdrawals: 7
  }
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'game', label: 'Aviator' },
  { id: 'predictor', label: 'Predictor' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'admin', label: 'Admin' }
];

function App() {
  const [dashboard, setDashboard] = useState(defaultDashboard);
  const [view, setView] = useState('dashboard');
  const [betAmount, setBetAmount] = useState('250');
  const [autoCashout, setAutoCashout] = useState('2.00');
  const [depositAmount, setDepositAmount] = useState('2000');
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [mpesaPhone, setMpesaPhone] = useState('+254700000001');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: 'demo@skywin.app',
    phone: '+254700000001',
    password: 'Password123!'
  });

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      console.error('Dashboard fetch failed:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const predictorSummary = useMemo(
    () => ({
      average: dashboard.predictor?.average ?? 0,
      median: dashboard.predictor?.median ?? 0,
      highest: dashboard.predictor?.highest ?? 0,
      lowest: dashboard.predictor?.lowest ?? 0
    }),
    [dashboard]
  );

  const handleAuth = async () => {
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : {
            name: authForm.name,
            email: authForm.email,
            phone: authForm.phone,
            password: authForm.password
          };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      alert(`${authMode === 'login' ? 'Logged in' : 'Registration successful'} successfully`);
      await fetchDashboard();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePlaceBet = async () => {
    try {
      const res = await fetch('/api/game/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dashboard.user.id,
          amount: Number(betAmount),
          autoCashout: Number(autoCashout),
          predictedMultiplier: Number(autoCashout)
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Bet failed');

      alert(`Bet placed successfully: ${result.bet.amount} KES`);
      await fetchDashboard();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCashout = async () => {
    try {
      const res = await fetch('/api/game/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dashboard.user.id,
          betId: 'demo_bet_1',
          currentMultiplier: Number(dashboard.currentRound?.multiplier || 1.5)
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Cash-out failed');

      alert(`Cash-out processed: ${result.payout} KES`);
      await fetchDashboard();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeposit = async () => {
    try {
      const res = await fetch('/api/mpesa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(depositAmount), phone: mpesaPhone })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Deposit failed');

      alert(`M-Pesa sandbox start successful. Reference: ${result.reference}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleWithdraw = async () => {
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dashboard.user.id,
          amount: Number(withdrawAmount),
          phone: mpesaPhone
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Withdrawal failed');

      alert(`Withdrawal request submitted: ${result.transaction.reference}`);
      await fetchDashboard();
    } catch (error) {
      alert(error.message);
    }
  };

  const renderContent = () => {
    if (view === 'game') {
      return (
        <section className="panel">
          <div className="section-head">
            <h3>Aviator Live Round</h3>
            <span className="pill pill-live">Live</span>
          </div>

          <div className="plane-box">
            <div className="plane">✈️</div>
            <div className="multiplier-wrap">
              <span>Current Multiplier</span>
              <strong>{Number(dashboard.currentRound?.multiplier || 1.5).toFixed(2)}x</strong>
            </div>
          </div>

          <div className="field-row">
            <label>
              Bet Amount
              <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} />
            </label>
            <label>
              Auto Cash-Out
              <input type="number" step="0.01" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} />
            </label>
          </div>

          <div className="cta-stack">
            <button type="button" className="primary-btn" onClick={handlePlaceBet}>Place Bet</button>
            <button type="button" className="secondary-btn" onClick={handleCashout}>Cash Out</button>
          </div>
        </section>
      );
    }

    if (view === 'predictor') {
      return (
        <section className="panel">
          <div className="section-head">
            <h3>Predictor Dashboard</h3>
            <span className="pill">Historical</span>
          </div>
          <div className="stat-grid">
            <div className="stat-box">
              <span>Average</span>
              <strong>{predictorSummary.average.toFixed(2)}x</strong>
            </div>
            <div className="stat-box">
              <span>Median</span>
              <strong>{predictorSummary.median.toFixed(2)}x</strong>
            </div>
            <div className="stat-box">
              <span>Highest</span>
              <strong>{predictorSummary.highest.toFixed(2)}x</strong>
            </div>
            <div className="stat-box">
              <span>Lowest</span>
              <strong>{predictorSummary.lowest.toFixed(2)}x</strong>
            </div>
          </div>
          <p className="note-box">{dashboard.predictor?.message}</p>
          <div className="mini-list">
            {(dashboard.predictor?.history || []).slice(0, 5).map(item => (
              <div key={item.id} className="mini-row">
                <span>#{item.id}</span>
                <strong>{item.multiplier.toFixed(2)}x</strong>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (view === 'wallet') {
      return (
        <section className="panel">
          <div className="section-head">
            <h3>Wallet & M-Pesa</h3>
            <span className="pill">Secure</span>
          </div>
          <div className="field-stack">
            <label>
              M-Pesa phone
              <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} />
            </label>
            <label>
              Deposit amount
              <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
            </label>
            <button type="button" className="primary-btn" onClick={handleDeposit}>Initiate STK Push</button>
            <label>
              Withdraw amount
              <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
            </label>
            <button type="button" className="secondary-btn" onClick={handleWithdraw}>Request Withdrawal</button>
          </div>
          <div className="activity-box">
            <h4>Recent Transactions</h4>
            {(dashboard.transactions || []).slice(0, 6).map(tx => (
              <div key={tx.id} className="mini-row">
                <span>{tx.type}</span>
                <strong>{tx.amount} KES</strong>
                <small>{tx.status}</small>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (view === 'admin') {
      return (
        <section className="panel">
          <div className="section-head">
            <h3>Admin Overview</h3>
            <span className="pill">Protected</span>
          </div>
          <div className="stat-grid compact-grid">
            <div className="stat-box">
              <span>Users</span>
              <strong>{dashboard.admin.totalUsers}</strong>
            </div>
            <div className="stat-box">
              <span>Active</span>
              <strong>{dashboard.admin.activePlayers}</strong>
            </div>
            <div className="stat-box">
              <span>Withdrawals</span>
              <strong>{dashboard.admin.pendingWithdrawals}</strong>
            </div>
          </div>
          <ul className="admin-list">
            <li>New KYC review: 12</li>
            <li>Wallet anomalies flagged: 3</li>
            <li>Suspicious payment attempts: 1</li>
          </ul>
        </section>
      );
    }

    return (
      <>
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Aviator Gaming Platform</p>
            <h1>Play, predict, and manage the game securely.</h1>
            <p>
              Skywin provides a modern dashboard for users, wallet operations, predictor analytics,
              and secure admin oversight. This is a safe demo environment.
            </p>
          </div>

          <div className="wallet-card">
            <span className="card-label">Available Balance</span>
            <strong>KES {dashboard.user.wallet.balance.toLocaleString()}</strong>
            <small>Betting Balance: KES {dashboard.user.wallet.bettingBalance.toLocaleString()}</small>
            <div className="key-actions">
              <button type="button" onClick={() => setView('wallet')}>Deposit</button>
              <button type="button" className="secondary" onClick={() => setView('wallet')}>Withdraw</button>
            </div>
          </div>
        </section>

        <div className="split-layout">
          <section className="panel">
            <div className="section-head">
              <h3>Aviator Live Round</h3>
              <span className="pill pill-live">Live</span>
            </div>
            <div className="plane-box">
              <div className="plane">✈️</div>
              <div className="multiplier-wrap">
                <span>Current Multiplier</span>
                <strong>{Number(dashboard.currentRound?.multiplier || 1.5).toFixed(2)}x</strong>
              </div>
            </div>
            <div className="field-row">
              <label>
                Bet amount
                <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} />
              </label>
              <label>
                Auto cash-out
                <input type="number" step="0.01" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} />
              </label>
            </div>
            <div className="cta-stack">
              <button type="button" className="primary-btn" onClick={handlePlaceBet}>Place Bet</button>
              <button type="button" className="secondary-btn" onClick={handleCashout}>Cash Out</button>
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <h3>Predictor Dashboard</h3>
              <span className="pill">Historical</span>
            </div>
            <div className="stat-grid">
              <div className="stat-box">
                <span>Average</span>
                <strong>{predictorSummary.average.toFixed(2)}x</strong>
              </div>
              <div className="stat-box">
                <span>Median</span>
                <strong>{predictorSummary.median.toFixed(2)}x</strong>
              </div>
              <div className="stat-box">
                <span>Highest</span>
                <strong>{predictorSummary.highest.toFixed(2)}x</strong>
              </div>
              <div className="stat-box">
                <span>Lowest</span>
                <strong>{predictorSummary.lowest.toFixed(2)}x</strong>
              </div>
            </div>
            <p className="note-box">{dashboard.predictor?.message}</p>
          </section>
        </div>

        <div className="split-layout lower-layout">
          <section className="panel">
            <div className="section-head">
              <h3>Wallet</h3>
              <span className="pill">Secure</span>
            </div>
            <div className="field-stack">
              <label>
                M-Pesa phone
                <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} />
              </label>
              <label>
                Deposit amount
                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
              </label>
              <button type="button" className="primary-btn" onClick={handleDeposit}>Initiate STK Push</button>
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <h3>Admin Overview</h3>
              <span className="pill">Protected</span>
            </div>
            <div className="stat-grid compact-grid">
              <div className="stat-box">
                <span>Users</span>
                <strong>{dashboard.admin.totalUsers}</strong>
              </div>
              <div className="stat-box">
                <span>Active</span>
                <strong>{dashboard.admin.activePlayers}</strong>
              </div>
              <div className="stat-box">
                <span>Withdrawals</span>
                <strong>{dashboard.admin.pendingWithdrawals}</strong>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">S</div>
          <span className="brand-text">SKYWIN</span>
        </div>

        <nav className="nav">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="ghost-btn">Logout</button>
      </header>

      <main className="dashboard">
        {renderContent()}

        <section className="panel auth-panel">
          <div className="section-head">
            <h3>{authMode === 'login' ? 'Login' : 'Create Account'}</h3>
            <span className="pill">Auth</span>
          </div>

          <div className="auth-toggle">
            <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
          </div>

          <div className="field-stack">
            {authMode === 'register' && (
              <>
                <label>
                  Full name
                  <input value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
                </label>
                <label>
                  Phone number
                  <input value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} />
                </label>
              </>
            )}

            <label>
              Email
              <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
            </label>

            <label>
              Password
              <input type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} />
            </label>

            <button type="button" className="primary-btn" onClick={handleAuth}>{authMode === 'login' ? 'Login' : 'Register'}</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
