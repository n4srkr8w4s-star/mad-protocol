import { useEffect, useMemo, useState } from "react";

type Asset = {
  symbol: string;
  name: string;
  type: "TOKEN" | "STOCK";
  marketCap: string;
  liquidity: string;
  volume: string;
  ath: string;
  price: string;
  change: string;
  age: string;
  accent: string;
  description: string;
  demoMad?: {
    label: string;
    score: number | null;
  };
};

type MADState = {
  asset?: {
    symbol?: string;
    name?: string;
    robinhoodAssetId?: string;
  };
  mad?: {
    score?: number;
    severity?: string;
    activeDisorders?: number[];
  };
  evidence?: {
    disorders?: Array<{
      id: number;
      code: string;
      status: string;
      reason: string;
    }>;
  };
};

const assets: Asset[] = [
  {
    symbol: "PONS",
    name: "Pons",
    type: "TOKEN",
    marketCap: "$707.51M",
    liquidity: "$6.99M",
    volume: "$8.76M",
    ath: "$972.57M",
    price: "$707.51M",
    change: "-1.80%",
    age: "56d ago",
    accent: "P",
    description: "The home for onchain culture.",
    demoMad: { label: "CAPABILITY PENDING", score: null },
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    type: "STOCK",
    marketCap: "$432.18M",
    liquidity: "$12.4M",
    volume: "$18.7M",
    ath: "$972.57M",
    price: "$432.18M",
    change: "-2.14%",
    age: "2d ago",
    accent: "N",
    description: "Tokenised exposure to NVIDIA.",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    type: "TOKEN",
    marketCap: "$1.32B",
    liquidity: "$34.8M",
    volume: "$88.2M",
    ath: "$1.48B",
    price: "$1.32B",
    change: "+0.82%",
    age: "12d ago",
    accent: "₿",
    description: "Bitcoin ecosystem asset.",
    demoMad: { label: "NOT CONNECTED", score: null },
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    type: "TOKEN",
    marketCap: "$980.4M",
    liquidity: "$28.2M",
    volume: "$64.1M",
    ath: "$1.12B",
    price: "$980.4M",
    change: "+1.20%",
    age: "10d ago",
    accent: "◆",
    description: "Ethereum ecosystem asset.",
    demoMad: { label: "NOT CONNECTED", score: null },
  },
  {
    symbol: "SOL",
    name: "Solana",
    type: "TOKEN",
    marketCap: "$514.2M",
    liquidity: "$14.9M",
    volume: "$31.5M",
    ath: "$602.8M",
    price: "$514.2M",
    change: "+2.08%",
    age: "8d ago",
    accent: "S",
    description: "Solana ecosystem asset.",
    demoMad: { label: "NOT CONNECTED", score: null },
  },
  {
    symbol: "BUN",
    name: "Bundle Cat",
    type: "TOKEN",
    marketCap: "$20.99M",
    liquidity: "$1.8M",
    volume: "$3.2M",
    ath: "$29.4M",
    price: "$20.99M",
    change: "+4.28%",
    age: "5d ago",
    accent: "B",
    description: "Community token.",
    demoMad: { label: "NOT CONNECTED", score: null },
  },
  {
    symbol: "SHROOM",
    name: "MUSHROOM",
    type: "TOKEN",
    marketCap: "$20.92M",
    liquidity: "$1.6M",
    volume: "$2.9M",
    ath: "$26.2M",
    price: "$20.92M",
    change: "+1.72%",
    age: "6d ago",
    accent: "M",
    description: "Community token.",
    demoMad: { label: "NOT CONNECTED", score: null },
  },
  {
    symbol: "OPTIMUS",
    name: "Optimus",
    type: "TOKEN",
    marketCap: "$12.74M",
    liquidity: "$920K",
    volume: "$1.7M",
    ath: "$18.9M",
    price: "$12.74M",
    change: "-0.66%",
    age: "10d ago",
    accent: "O",
    description: "Community token.",
    demoMad: { label: "NOT CONNECTED", score: null },
  },
];

const sparkPaths = [
  "M0 68 C30 66 45 57 70 60 S115 49 145 54 S185 42 220 45 S270 36 300 18",
  "M0 58 C25 67 50 42 78 50 S120 28 155 40 S198 34 225 46 S265 25 300 18",
  "M0 70 C35 72 50 65 72 56 S120 60 145 42 S185 50 220 41 S265 35 300 20",
  "M0 63 C28 69 58 49 88 55 S133 31 168 47 S218 37 245 42 S280 24 300 17",
];

function Sparkline({ index = 0 }: { index?: number }) {
  return (
    <svg className="spark" viewBox="0 0 300 90" preserveAspectRatio="none">
      <path d={sparkPaths[index % sparkPaths.length]} />
    </svg>
  );
}

function severityClass(value?: string) {
  const v = (value ?? "").toUpperCase();
  if (v === "HIGH" || v === "CRITICAL") return "mad-high";
  if (v === "ELEVATED" || v === "MODERATE") return "mad-elevated";
  if (v === "NORMAL" || v === "LOW") return "mad-normal";
  return "mad-pending";
}

function App() {
  const [selected, setSelected] = useState<Asset | null>(null);
  const [mad, setMad] = useState<MADState | null>(null);
  const [madLoading, setMadLoading] = useState(false);
  const [madError, setMadError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setMad(null);
    setMadError(false);
    setDetailsOpen(false);

    if (!selected || selected.symbol !== "NVDA") return;

    setMadLoading(true);

    fetch("http://127.0.0.1:3000/api/v1/assets/NVDA/state")
      .then((r) => {
        if (!r.ok) throw new Error("MAD API unavailable");
        return r.json();
      })
      .then((data) => setMad(data))
      .catch(() => setMadError(true))
      .finally(() => setMadLoading(false));
  }, [selected]);

  const madSummary = useMemo(() => {
    if (!selected) return null;

    if (selected.symbol === "NVDA") {
      if (madLoading)
        return { severity: "ASSESSING", score: null, active: null };

      if (madError || !mad)
        return { severity: "API UNAVAILABLE", score: null, active: null };

      return {
        severity: mad.mad?.severity ?? "UNKNOWN",
        score: mad.mad?.score ?? null,
        active: mad.mad?.activeDisorders?.length ?? 0,
      };
    }

    return {
      severity: selected.demoMad?.label ?? "NOT CONNECTED",
      score: selected.demoMad?.score ?? null,
      active: null,
    };
  }, [selected, mad, madLoading, madError]);

  if (!selected) {
    return (
      <main className="page">
        <Header />

        <section className="explore-tools">
          <div className="search">⌕ &nbsp; Search tokens, stocks, or creators...</div>
          <button className="pill">⌘ Stocks</button>
          <button className="pill">＋ Create</button>
        </section>

        <div className="filters">
          <button className="filter active">All</button>
          <button className="filter">Graduated</button>
          <button className="filter">New</button>
          <button className="filter">Stocks</button>
          <button className="filter">AI</button>
          <button className="filter">DeFi</button>
          <button className="filter">Culture</button>
          <button className="filter">RWA</button>
        </div>

        <section className="graduated">
          <div className="section-heading">
            <div>
              <h1>Graduated <span>922</span></h1>
              <p>Tokens that cleared the graduation threshold.</p>
            </div>
            <button className="pill">Market cap⌄</button>
          </div>

          <div className="asset-grid">
            {assets.map((asset, index) => (
              <button
                className="asset-card"
                key={asset.symbol}
                onClick={() => setSelected(asset)}
              >
                <div className="asset-art">
                  <div className="asset-symbol">{asset.accent}</div>
                  <span className="graduated-tag">
                    {asset.type === "STOCK" ? "Stock" : "Graduated"}
                  </span>
                </div>

                <div className={`mad-chip ${
                  asset.symbol === "NVDA"
                    ? "mad-live"
                    : "mad-pending"
                }`}>
                  <span className="dot" />
                  {asset.symbol === "NVDA"
                    ? "MAD LIVE"
                    : "MAD NOT CONNECTED"}
                </div>

                <strong>{asset.name}</strong>
                <small>${asset.symbol}</small>

                <div className="cap">
                  {asset.marketCap} <small>MC</small>
                </div>

                <Sparkline index={index} />

                <div className="card-bottom">
                  <span>0x{asset.symbol.toLowerCase()}...mad</span>
                  <span>{asset.age}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pagination">
            <button className="page-active">1</button>
            <button>2</button>
            <span>…</span>
            <button>93</button>
          </div>
        </section>

        <footer>
          <span>PONS × MAD · Unofficial concept integration</span>
          <span>Market values shown for interface demonstration.</span>
        </footer>
      </main>
    );
  }

  return (
    <main className="page">
      <Header />

      <button className="back" onClick={() => setSelected(null)}>
        ‹ Back
      </button>

      <section className="asset-hero">
        <div className="hero-identity">
          <div className="hero-logo">{selected.accent}</div>
          <div>
            <div className="hero-title">
              <h1>{selected.name}</h1>
              <span>{selected.type === "STOCK" ? "Stock" : "Graduated"}</span>
              <span className="v2">V2</span>
            </div>
            <div className="ticker">${selected.symbol}</div>
            <p>{selected.description}</p>
          </div>
        </div>

        <button className="trade">Trade</button>
      </section>

      <section className="market-panel">
        <div className="stats">
          <Stat label="Market cap" value={selected.marketCap} />
          <Stat label="Liquidity" value={selected.liquidity} />
          <Stat label="24h volume" value={selected.volume} />
          <Stat label="ATH" value={selected.ath} />
        </div>

        <div className="price-row">
          <div>
            <div className="big-price">{selected.price}</div>
            <div className="negative">{selected.change} <span>1H</span></div>
          </div>

          <div className="time-pills">
            <span>5M</span>
            <span className="selected-time">1H</span>
            <span>6H</span>
            <span>1D</span>
            <span>ALL</span>
          </div>
        </div>

        <div className="chart">
          <svg viewBox="0 0 1000 320" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c8ff36" stopOpacity=".35" />
                <stop offset="100%" stopColor="#c8ff36" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="chart-fill"
              d="M0 70 C35 100 45 95 75 110 S130 72 170 105 S230 93 270 132 S330 150 360 205 S425 166 470 205 S535 225 575 208 S640 220 690 203 S760 146 805 158 S875 125 920 140 S970 132 1000 135 L1000 320 L0 320 Z"
            />
            <path
              className="chart-line"
              d="M0 70 C35 100 45 95 75 110 S130 72 170 105 S230 93 270 132 S330 150 360 205 S425 166 470 205 S535 225 575 208 S640 220 690 203 S760 146 805 158 S875 125 920 140 S970 132 1000 135"
            />
          </svg>
        </div>
      </section>

      <section className="lower-grid">
        <div className="trade-panel">
          <div className="trade-tabs">
            <span className="active-tab">Buy</span>
            <span>Sell</span>
          </div>

          <div className="trade-input">
            <small>Amount</small>
            <strong>0</strong>
            <span>$0.00</span>
          </div>

          <div className="percentages">
            <span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>

          <button className="connect-wallet">Connect wallet</button>
        </div>

        <div className={`mad-panel ${severityClass(madSummary?.severity)}`}>
          <div className="mad-panel-header">
            <strong>◩ MAD Intelligence</strong>
            <button onClick={() => setDetailsOpen((v) => !v)}>
              {detailsOpen ? "Hide details ↑" : "View details →"}
            </button>
          </div>

          <div className="mad-summary">
            <div>
              <div className="severity">
                <span className="status-dot" />
                {madSummary?.severity}
              </div>

              {madSummary?.score !== null ? (
                <div className="mad-score">
                  {madSummary?.score}<span>/100</span>
                </div>
              ) : (
                <div className="mad-score unavailable">—</div>
              )}

              <p>
                {selected.symbol === "NVDA" && madSummary?.active !== null && madSummary?.active !== undefined
                  ? `${madSummary.active} market disorder${
                      madSummary.active === 1 ? "" : "s"
                    } active.`
                  : selected.symbol === "NVDA"
                    ? "MAD state could not be loaded."
                    : "MAD assessment is not connected for this asset yet."}
              </p>
            </div>

            <div className="assessment">
              <small>Assessment</small>
              <strong>
                {selected.symbol === "NVDA" && !madError
                  ? "LIVE MAD API"
                  : "DEMO SHELL"}
              </strong>
            </div>
          </div>

          {detailsOpen && (
            <div className="mad-details">
              {selected.symbol === "NVDA" && mad?.evidence?.disorders ? (
                <>
                  <div className="details-title">WHY MAD SAID THIS</div>
                  {mad.evidence.disorders.map((d) => (
                    <div className="evidence-row" key={d.id}>
                      <div>
                        <strong>AD-{String(d.id + 1).padStart(3, "0")}</strong>
                        <span>{d.code.replaceAll("_", " ")}</span>
                      </div>
                      <span className="evidence-status">{d.status}</span>
                      <p>{d.reason}</p>
                    </div>
                  ))}
                  <div className="future-actions">
                    <button>WHY</button>
                    <button disabled>WHAT CHANGED</button>
                    <button disabled>REPLAY</button>
                  </div>
                </>
              ) : (
                <div className="not-connected">
                  <strong>MAD capability not connected</strong>
                  <p>
                    This concept deliberately does not invent disorder evidence
                    for {selected.name}. Once MAD can observe this asset, the
                    same panel will expose Evidence DNA, State Diff and Flight
                    Recorder history.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="about">
        <div>
          <strong>About</strong>
          <p>{selected.description}</p>
        </div>
        <div className="links">
          <span>Dexscreener</span>
          <span>GeckoTerminal</span>
          <span>Contract</span>
          <span>Pool</span>
        </div>
      </section>

      <footer>
        <span>PONS × MAD · Unofficial concept integration</span>
        <span>Market values shown for interface demonstration.</span>
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header>
      <div className="brand">P</div>
      <nav>
        <span className="nav-active">Explore</span>
        <span>Forum</span>
        <span>Analytics</span>
      </nav>

      <div className="header-actions">
        <button className="theme">☼</button>
        <button className="connect">Connect</button>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
