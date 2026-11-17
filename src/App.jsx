import { useCallback, useEffect, useState } from 'react';

const initial = {
  mode: 'practice-only',
  user: { name: 'Loading player…', points: 0 },
  currentRound: { number: 0, status: 'waiting', multiplier: 1 },
  predictor: { history: [], average: null, median: null, highest: null, lowest: null, message: '' },
  bets: [],
  transactions: []
};

const money = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function App() {
  const [data, setData] = useState(initial);
  const [betAmount, setBetAmount] = useState(100);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Could not load the practice game. Is the API running?');
      setData(await response.json());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 400);
    return () => clearInterval(timer);
  }, [refresh]);

  const request = async (path, body) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Request failed');
      setNotice(path.endsWith('/bet') ? 'Practice bet placed.' : `Cashed out at ${result.bet.cashoutAt.toFixed(2)}×.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const activeBet = data.bets.find(bet => bet.status === 'active' && bet.roundId === data.currentRound.id);
  const round = data.currentRound;
  const canBet = round.status === 'waiting' && !activeBet && !busy;
  const canCashout = round.status === 'flying' && Boolean(activeBet) && !busy;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-wrap" href="#home" aria-label="SKYWIN home">
          <span className="brand-mark">S</span><span className="brand-text">SKYWIN</span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#game">Game</a><a href="#history">History</a><a href="#analytics">Analytics</a>
        </nav>
        <span className="practice-tag">PRACTICE MODE</span>
      </header>

      <main className="dashboard" id="home">
        <div className="safety-banner"><strong>Practice simulation only.</strong> Points are fictional; no deposits, withdrawals, or real-money play. Results are random and past rounds do not predict future outcomes.</div>
        {error && <div className="message error" role="alert">{error}</div>}
        {notice && <div className="message success" role="status">{notice}</div>}

        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Aviator-style practice game</p>
            <h1>Watch the flight.<br />Choose when to cash out.</h1>
            <p>Server-driven demo rounds with fictional practice points. This is an independent simulation, not the Aviator game or brand of another operator.</p>
          </div>
          <div className="wallet-card">
            <span className="card-label">Practice points</span>
            <strong>{money(data.user.points)} <small>pts</small></strong>
            <small>{data.user.name} · non-transferable demo balance</small>
          </div>
        </section>

        <div className="split-layout">
          <section className="panel game-panel" id="game">
            <div className="section-head">
              <div><p className="eyebrow">Round {round.number || '—'}</p><h2>Aviator</h2></div>
              <span className={`pill ${round.status === 'flying' ? 'pill-live' : ''}`}>{round.status}</span>
            </div>
            <div className={`flight-stage ${round.status}`}>
              <span className="stage-stars" aria-hidden="true">✦　 ·　 ✧　 ·　 ✦</span>
              <span className="plane" aria-hidden="true">✈</span>
              <div className="multiplier-wrap">
                {round.status === 'crashed' ? <><span>CRASHED</span><strong className="crash-value">{Number(round.multiplier).toFixed(2)}×</strong></> : <><span>{round.status === 'waiting' ? 'NEXT ROUND' : 'CURRENT MULTIPLIER'}</span><strong>{Number(round.multiplier || 1).toFixed(2)}×</strong></>}
              </div>
              {activeBet && <div className="active-bet">Your practice bet: {money(activeBet.amount)} pts</div>}
            </div>
            <div className="bet-controls">
              <label htmlFor="bet-amount">Practice bet (1–1,000 pts)</label>
              <div className="bet-entry"><input id="bet-amount" type="number" min="1" max="1000" step="1" value={betAmount} onChange={event => setBetAmount(event.target.value)} /><button className="primary-btn" disabled={!canBet || Number(betAmount) < 1 || Number(betAmount) > 1000} onClick={() => request('/api/game/bet', { amount: Number(betAmount) })}>Place practice bet</button></div>
              <button className="cashout-btn" disabled={!canCashout} onClick={() => request('/api/game/cashout', { betId: activeBet?.id })}>Cash out{activeBet ? ` · ${money(activeBet.amount * round.multiplier)} pts` : ''}</button>
              <p className="hint">Bet during countdown; cash out before the server-generated crash.</p>
            </div>
          </section>

          <section className="panel" id="history">
            <div className="section-head"><div><p className="eyebrow">Completed rounds</p><h2>Recent results</h2></div></div>
            <div className="result-list">
              {data.predictor.history?.length ? data.predictor.history.slice(0, 15).map(item => <div className="result-row" key={item.id}><span>Round {item.number}</span><strong className={item.multiplier < 2 ? 'low-result' : 'high-result'}>{Number(item.multiplier).toFixed(2)}×</strong></div>) : <p className="hint">Round history will appear after the first round ends.</p>}
            </div>
          </section>
        </div>

        <section className="panel" id="analytics">
          <div className="section-head"><div><p className="eyebrow">Descriptive only</p><h2>Historical analytics</h2></div></div>
          <div className="stat-grid">
            <Stat label="Average" value={data.predictor.average} />
            <Stat label="Median" value={data.predictor.median} />
            <Stat label="Highest" value={data.predictor.highest} />
            <Stat label="Lowest" value={data.predictor.lowest} />
          </div>
          <p className="note-box">{data.predictor.message}</p>
        </section>

        <section className="panel">
          <div className="section-head"><div><p className="eyebrow">Demo ledger</p><h2>Recent activity</h2></div></div>
          <div className="result-list">
            {data.transactions?.length ? data.transactions.slice(0, 8).map(tx => <div className="result-row" key={tx.id}><span>{tx.type} · {new Date(tx.createdAt).toLocaleTimeString()}</span><strong>{tx.amount < 0 ? '−' : '+'}{money(Math.abs(tx.amount))} pts</strong></div>) : <p className="hint">No activity yet.</p>}
          </div>
        </section>
        <footer className="footer">SKYWIN Practice · volatile demo data resets when the server restarts · not for real-money use.</footer>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="stat-box"><span>{label}</span><strong>{value == null ? '—' : `${Number(value).toFixed(2)}×`}</strong></div>;
}
