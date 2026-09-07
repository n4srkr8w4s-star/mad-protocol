import { useEffect, useState } from "react";
import {
  AssetSearch,
  type SearchResult,
} from "./components/AssetSearch.js";
import {
  MAD_API_BASE_URL,
} from "./config/api.js";

import {
  MADRadar,
} from "./components/MADRadar.js";

import "./App.css";

const API_BASE_URL =
  `${MAD_API_BASE_URL}/api/v1/assets`;

interface Disorder {
  id: number;
  code: string;
  active: boolean;
  score: number;
  severityCode: number;
  severity: string;
  reason: string;
}

type EvidenceDNAStatus =
  | "DOMINANT"
  | "ACTIVE"
  | "INACTIVE"
  | "UNASSESSED";

type EvidenceDNAValue =
  | string
  | number
  | boolean
  | null;

interface EvidenceDNA {
  asset: {
    symbol: string;
    assetId: string;
  };
  mad: {
    score: number;
    severityCode: number;
    severity: string;
    dominantDisorders: number[];
  };
  disorders: {
    id: number;
    code: string;
    status: EvidenceDNAStatus;
    score: number | null;
    severityCode: number | null;
    severity: string | null;
    reason: string;
    evidence: {
      key: string;
      value: EvidenceDNAValue;
    }[];
  }[];
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

  capability: {
    level:
      | "FULL"
      | "PARTIAL"
      | "DISCOVERABLE";

    supportedDisorders: number;
    totalDisorders: number;
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

type ObservatoryView =
  | "ASSET"
  | "RADAR";

function ViewSwitch({
  view,
  onChange,
}: {
  view: ObservatoryView;
  onChange: (
    view: ObservatoryView,
  ) => void;
}) {
  return (
    <div
      className="view-switch"
      aria-label="Observatory view"
    >
      <button
        type="button"
        className={
          view === "ASSET"
            ? "view-switch-active"
            : ""
        }
        onClick={
          () =>
            onChange("ASSET")
        }
      >
        ASSET STATE
      </button>

      <button
        type="button"
        className={
          view === "RADAR"
            ? "view-switch-active"
            : ""
        }
        onClick={
          () =>
            onChange("RADAR")
        }
      >
        RADAR
      </button>
    </div>
  );
}

function App() {
  const [
    viewMode,
    setViewMode,
  ] = useState<ObservatoryView>(
    "ASSET",
  );

  const [state, setState] = useState<MADState | null>(null);
  const [evidenceDNA, setEvidenceDNA] =
    useState<EvidenceDNA | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [
    selectedAsset,
    setSelectedAsset,
  ] = useState<SearchResult | null>(
    null,
  );

  function handleSelectAsset(
    result: SearchResult,
  ) {
    setSelectedAsset(result);
    setState(null);
    setError(null);

    setViewMode("ASSET");
  }

  useEffect(() => {
    let active = true;

    if (
      viewMode === "RADAR"
    ) {
      return () => {
        active = false;
      };
    }


    /*
     * Capability and current state are different.
     * PARTIAL/DISCOVERABLE assets remain selectable,
     * but the FULL composite evaluator is not called.
     */
    if (
      selectedAsset &&
      selectedAsset.monitoring !== "FULL"
    ) {
      setState(null);
      setEvidenceDNA(null);
      setError(null);

      return () => {
        active = false;
      };
    }

    const symbol =
      selectedAsset?.symbol ??
      "AAPL";

    async function loadState() {
      try {
        const encodedSymbol =
          encodeURIComponent(symbol);

        const response = await fetch(
          `${API_BASE_URL}/${encodedSymbol}/state`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            `MAD state API returned HTTP ${response.status}`,
          );
        }

        const payload =
          (await response.json()) as MADState & {
            evidence: EvidenceDNA;
          };

        if (active) {
          setState(payload);
          setEvidenceDNA(payload.evidence);
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
  }, [selectedAsset, viewMode]);

  if (
    viewMode === "RADAR"
  ) {
    return (
      <main className="observatory">
        <header className="topbar">
          <div className="brand">
            <img
              className="brand-logo"
              src="/mad-logo.png"
              alt="MAD — Ministry of Active Disorder"
            />

            <div>
              <div className="brand-title">
                MINISTRY OF ACTIVE DISORDER
              </div>

              <div className="brand-subtitle">
                MAD OBSERVATORY
              </div>
            </div>
          </div>

          <AssetSearch
            onSelectAsset={
              handleSelectAsset
            }
          />

          <ViewSwitch

            view={viewMode}

            onChange={

              setViewMode

            }

          />


          <div className="network">
            <span className="network-dot" />
            ROBINHOOD CHAIN · LIVE
          </div>
        </header>

        <MADRadar />

        <footer>
          <span>
            EXPECTED STATE − OBSERVED STATE = DISORDER
          </span>

          <span>
            MAD RADAR · ROBINHOOD CHAIN
          </span>
        </footer>
      </main>
    );
  }

  /*
   * A PARTIAL asset is a valid Robinhood asset.
   * It is not an error and it is not FULL MAD state.
   */
  if (
    selectedAsset &&
    selectedAsset.monitoring !== "FULL"
  ) {
    const limitation =
      selectedAsset.feedResolution ===
      "MISSING"
        ? "Canonical primary tokenized-price feed metadata is not currently available for this asset."
        : selectedAsset.feedResolution ===
            "AMBIGUOUS"
          ? "More than one canonical feed candidate was found, so MAD will not choose one implicitly."
          : "The asset does not currently satisfy all MAD state capability requirements.";

    return (
      <main className="observatory">
        <header className="topbar">
          <div className="brand">
            <img
              className="brand-logo"
              src="/mad-logo.png"
              alt="MAD — Ministry of Active Disorder"
            />
            <div>
              <div className="brand-title">
                MINISTRY OF ACTIVE DISORDER
              </div>
              <div className="brand-subtitle">
                MAD OBSERVATORY
              </div>
            </div>
          </div>

          <AssetSearch
            onSelectAsset={
              handleSelectAsset
            }
          />

          <ViewSwitch

            view={viewMode}

            onChange={

              setViewMode

            }

          />


          <div className="network">
            <span className="network-dot" />
            ROBINHOOD CHAIN · LIVE
          </div>
        </header>

        <section className="hero">
          <div>
            <div className="eyebrow">
              ASSET CAPABILITY
            </div>

            <div className="asset-heading">
              <h1>
                {selectedAsset.symbol}
              </h1>

              <div className="asset-meta">
                <span>
                  {selectedAsset.name}
                </span>
                <span>
                  {selectedAsset.isin}
                </span>
              </div>
            </div>
          </div>

          <div className="state-panel">
            <div>
              <div className="state-label">
                MAD CAPABILITY
              </div>

              <div className="state-value">
                {
                  selectedAsset.monitoring
                }
              </div>

              <div className="coverage">
                {
                  selectedAsset.supportedDisorders
                }{" "}
                /{" "}
                {
                  selectedAsset.totalDisorders
                }{" "}
                disorder classes supported
              </div>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  CAPABILITY COVERAGE
                </span>
                <h2>
                  Full MAD state unavailable
                </h2>
              </div>
            </div>

            <p>
              {limitation}
            </p>

            <p>
              This does not indicate disorder.
              It describes MAD's current evidence
              capability for this asset.
            </p>
          </article>
        </section>

        <footer>
          <span>
            EXPECTED STATE − OBSERVED STATE = DISORDER
          </span>
          <span>
            MAD / ROBINHOOD CHAIN
          </span>
        </footer>
      </main>
    );
  }

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

          <AssetSearch
              onSelectAsset={
                handleSelectAsset
              }
            />

        <ViewSwitch

          view={viewMode}

          onChange={

            setViewMode

          }

        />


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

        <AssetSearch
              onSelectAsset={
                handleSelectAsset
              }
            />

        <ViewSwitch

          view={viewMode}

          onChange={

            setViewMode

          }

        />


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
              CAPABILITY{" "}
              {state.capability.level}
              {" · "}
              {
                state.capability.supportedDisorders
              }
              /
              {
                state.capability.totalDisorders
              }
            </div>

            <div className="coverage">
              CURRENT COVERAGE{" "}
              {
                state.mad.assessedDisorders
              }
              {" / "}
              {
                state.mad.assessedDisorders +
                state.mad.unassessedDisorders
              }
              {" ASSESSED"}
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

      {evidenceDNA && (
        <section className="dna-panel">
          <div className="dna-header">
            <div>
              <span className="eyebrow">
                EVIDENCE DNA
              </span>
              <h2>Why MAD Said This</h2>
            </div>

            <div className="dna-composite">
              <span>COMPOSITE</span>
              <strong>
                {evidenceDNA.mad.score}
                {" · "}
                {evidenceDNA.mad.severity}
              </strong>
            </div>
          </div>

          <div className="dna-disorders">
            {evidenceDNA.disorders.map(
              (disorder) => (
                <article
                  className={`dna-disorder dna-${disorder.status.toLowerCase()}`}
                  key={disorder.id}
                >
                  <div className="dna-disorder-heading">
                    <div>
                      <span className="dna-code">
                        {publicDisorderCode(
                          disorder.id,
                        )}
                      </span>
                      <strong>
                        {disorder.code.replaceAll(
                          "_",
                          " ",
                        )}
                      </strong>
                    </div>

                    <span className="dna-status">
                      {disorder.status}
                    </span>
                  </div>

                  <p className="dna-reason">
                    {disorder.reason}
                  </p>

                  {disorder.status ===
                  "UNASSESSED" ? (
                    <div className="dna-unassessed">
                      NOT EVALUATED · NO EVIDENCE
                      ASSERTED
                    </div>
                  ) : (
                    <dl className="dna-facts">
                      {disorder.evidence.map(
                        (fact) => (
                          <div key={fact.key}>
                            <dt>{fact.key}</dt>
                            <dd>
                              {fact.value === null
                                ? "null"
                                : String(
                                    fact.value,
                                  )}
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                  )}
                </article>
              ),
            )}
          </div>
        </section>
      )}

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
