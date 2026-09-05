import { useEffect, useState } from "react";
import { AssetSearch } from "./components/AssetSearch.js";
import "./App.css";

const API_URL =
  "http://127.0.0.1:3000/api/v1/assets/aapl/state";

interface Disorder {
  id: number;
  code: string;
  active: boolean;
  score: number;
  severityCode: number;
  severity: string;
  reason: string;
}

interface MADState {
  asset: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    address: string;
    chainId: number;
    underlyingSymbol: string;
    robinhoodAssetId: string;
    isin: string;
    status: string;
  };

  observations: {
    underlying: {
      bid: string;
      ask: string;
      midpointE6: string;
      currency: string;
      isTradingHalt: boolean;
      generatedAt: string;
    };

    multiplier: {
      robinhoodApi: string;
      robinhoodApiE18: string;
      onchainE18: string;
      pending: string | null;
    };

    oracle: {
      feedAddress: string;
      description: string;
      price: string;
      answerRaw: string;
      decimals: number;
      updatedAt: string;
      heartbeatSeconds: number;
      marketHours: string;
      marketAvailability: string;
      threshold: number;
    };

    timing: {
      evaluationTimeUnix: string;
      robinhoodPriceGeneratedAtUnix: string;
      oracleUpdatedAtUnix: string;
      robinhoodPriceAgeSeconds: number;
      oracleAgeSeconds: number;
      sourceSkewSeconds: number;
    };
  };

  disorders: {
    assessed: Disorder[];
    unassessed: unknown[];
  };

  mad: {
    score: number;
    severityCode: number;
    severity: string;
    isDisordered: boolean;
    disorderBitmap: string;
    activeDisorders: unknown[];
    assessedDisorders: number;
    unassessedDisorders: number;
  };
}

function formatAge(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

function formatUnderlying(midpointE6: string): string {
  return (Number(midpointE6) / 1_000_000).toFixed(2);
}

function formatMultiplier(value: string): string {
  return Number(value).toFixed(8);
}

function publicDisorderCode(id: number): string {
  return `AD-${String(id + 1).padStart(3, "0")}`;
}

function App() {
  const [state, setState] = useState<MADState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadState() {
      try {
        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `MAD API returned HTTP ${response.status}`,
          );
        }

        const payload =
          (await response.json()) as MADState;

        if (active) {
          setState(payload);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load MAD state.",
          );
        }
      }
    }

    void loadState();

    const refreshTimer = window.setInterval(
      () => void loadState(),
      60_000,
    );

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  if (!state) {
    return (
      <main className="observatory">
        <header className="topbar">
          <div className="brand">
            <img className="brand-logo" src="/mad-logo.png" alt="MAD — Ministry of Active Disorder" />

            <div>
              <div className="brand-title">
                MINISTRY OF ACTIVE DISORDER
              </div>
              <div className="brand-subtitle">
                MAD OBSERVATORY
              </div>
            </div>
          </div>

          <AssetSearch />

        <div className="network">
            <span className="network-dot" />
            ROBINHOOD CHAIN
          </div>
        </header>

        <section className="hero">
          <div>
            <span className="eyebrow">
              CONNECTING TO MAD ENGINE
            </span>
            <h1>Loading live state…</h1>

            {error && (
              <p style={{ color: "#a0a0a0" }}>
                {error}
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  const midpoint = formatUnderlying(
    state.observations.underlying.midpointE6,
  );

  const multiplier = formatMultiplier(
    state.observations.multiplier.robinhoodApi,
  );

  const allNormal = !state.mad.isDisordered;

  return (
    <main className="observatory">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/mad-logo.png" alt="MAD — Ministry of Active Disorder" />

          <div>
            <div className="brand-title">
              MINISTRY OF ACTIVE DISORDER
            </div>
            <div className="brand-subtitle">
              MAD OBSERVATORY
            </div>
          </div>
        </div>

        <AssetSearch />

        <div className="network">
          <span className="network-dot" />
          ROBINHOOD CHAIN · LIVE
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">
            LIVE ASSET STATE
          </div>

          <div className="asset-heading">
            <h1>{state.asset.symbol}</h1>

            <div className="asset-meta">
              <span>{state.asset.name}</span>
              <span>{state.asset.isin}</span>
            </div>
          </div>
        </div>

        <div className="state-panel">
          <div className="state-orb">
            <span>{state.mad.score}</span>
          </div>

          <div>
            <div className="state-label">
              MAD SCORE
            </div>

            <div className="state-value">
              {state.mad.severity}
            </div>

            <div className="coverage">
              {state.mad.assessedDisorders} /{" "}
              {state.mad.assessedDisorders +
                state.mad.unassessedDisorders}{" "}
              disorders assessed
            </div>
          </div>
        </div>
      </section>

      <section className="metrics">
        <article className="metric">
          <span className="metric-label">
            UNDERLYING
          </span>

          <strong>
            ${midpoint}
          </strong>

          <small>
            Bid {state.observations.underlying.bid}
            {" · "}
            Ask {state.observations.underlying.ask}
          </small>
        </article>

        <article className="metric">
          <span className="metric-label">
            ORACLE
          </span>

          <strong>
            ${state.observations.oracle.price}
          </strong>

          <small>
            {state.observations.oracle.description}
          </small>
        </article>

        <article className="metric">
          <span className="metric-label">
            MULTIPLIER
          </span>

          <strong>{multiplier}</strong>

          <small>
            {state.observations.multiplier.robinhoodApiE18 ===
            state.observations.multiplier.onchainE18
              ? "REST = onchain"
              : "REST ≠ onchain"}
          </small>
        </article>

        <article className="metric">
          <span className="metric-label">
            ORACLE AGE
          </span>

          <strong>
            {formatAge(
              state.observations.timing.oracleAgeSeconds,
            )}
          </strong>

          <small>
            Heartbeat{" "}
            {formatAge(
              state.observations.oracle.heartbeatSeconds,
            )}
          </small>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                ACTIVE DISORDER MATRIX
              </span>
              <h2>State Assessment</h2>
            </div>

            <span className="all-clear">
              {allNormal
                ? "ALL ASSESSED NORMAL"
                : "ACTIVE DISORDER DETECTED"}
            </span>
          </div>

          <div className="disorder-list">
            {state.disorders.assessed.map(
              (disorder) => (
                <div
                  className="disorder-row"
                  key={disorder.id}
                >
                  <div className="disorder-code">
                    {publicDisorderCode(
                      disorder.id,
                    )}
                  </div>

                  <div className="disorder-main">
                    <strong>
                      {disorder.code.replaceAll(
                        "_",
                        " ",
                      )}
                    </strong>

                    <span>{disorder.reason}</span>
                  </div>

                  <div className="disorder-state">
                    <span
                      className={`status-dot severity-${disorder.severity.toLowerCase()}`}
                    />
                    {disorder.severity}
                  </div>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="panel evidence">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                SOURCE INTEGRITY
              </span>
              <h2>Evidence</h2>
            </div>
          </div>

          <dl>
            <div>
              <dt>Stock Token</dt>
              <dd>{state.asset.status.replace("ASSET_STATUS_", "")}</dd>
            </div>

            <div>
              <dt>Price quote</dt>
              <dd>
                {formatAge(
                  state.observations.timing
                    .robinhoodPriceAgeSeconds,
                )}{" "}
                old
              </dd>
            </div>

            <div>
              <dt>Oracle age</dt>
              <dd>
                {formatAge(
                  state.observations.timing
                    .oracleAgeSeconds,
                )}
              </dd>
            </div>

            <div>
              <dt>Published heartbeat</dt>
              <dd>
                {state.observations.oracle
                  .heartbeatSeconds.toLocaleString()}{" "}
                sec
              </dd>
            </div>

            <div>
              <dt>Market window</dt>
              <dd>
                {
                  state.observations.oracle
                    .marketAvailability
                }
              </dd>
            </div>

            <div>
              <dt>Multiplier coherence</dt>
              <dd>
                {state.observations.multiplier
                  .robinhoodApiE18 ===
                state.observations.multiplier
                  .onchainE18
                  ? "EXACT MATCH"
                  : "MISMATCH"}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <footer>
        <span>
          EXPECTED STATE − OBSERVED STATE = DISORDER
        </span>

        <span>
          LIVE · REFRESH 60S · MAD / ROBINHOOD CHAIN
        </span>
      </footer>
    </main>
  );
}

export default App;
