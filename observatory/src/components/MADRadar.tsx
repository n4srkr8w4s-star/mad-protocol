import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MAD_API_BASE_URL,
} from "../config/api.js";

type Capability =
  | "FULL"
  | "PARTIAL"
  | "DISCOVERABLE";

type RadarStateStatus =
  | "ASSESSED"
  | "CAPABILITY_ONLY"
  | "ERROR";

type SourceHealthStatus =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE";

interface RadarAssetState {
  score: number;

  severityCode: number;

  severity: string;

  assessedDisorders: number;

  unassessedDisorders: number;

  marketAvailability: string;

  activeDisorders: {
    id: number;
    score: number;
    severityCode: number;
    severity: string;
  }[];
}

type RadarChangeType =
  | "SCORE_CHANGED"
  | "SEVERITY_CHANGED"
  | "DISORDER_ACTIVATED"
  | "DISORDER_CLEARED"
  | "DISORDER_CHANGED"
  | "ASSESSMENT_CHANGED"
  | "MULTIPLIER_CHANGED"
  | "MARKET_AVAILABILITY_CHANGED";

interface RadarTransition {
  status:
    | "BASELINE_ESTABLISHED"
    | "DIFF_AVAILABLE";

  changed:
    boolean | null;

  changeTypes:
    RadarChangeType[];

  scoreDelta:
    number | null;

  severity: {
    previous:
      number | null;
    current:
      number | null;
    changed: boolean;
  };

  disorders: {
    activated: number[];
    cleared: number[];
  };
}

interface RadarAsset {
  symbol: string;

  name: string;

  assetId: string;

  isin: string;

  address: string | null;

  chainId: number | null;

  capability: Capability;

  supportedDisorders: number;

  totalDisorders: number;

  feedResolution:
    | "RESOLVED"
    | "MISSING"
    | "AMBIGUOUS";

  stateStatus:
    RadarStateStatus;

  state:
    RadarAssetState | null;

  transition:
    RadarTransition | null;

  reason:
    string | null;
}

interface RobinhoodPriceSourceHealth {
  source:
    "ROBINHOOD_PRICES";

  status:
    SourceHealthStatus;

  assetsRequested: number;

  successfulAssets: number;

  failedAssets: number;

  requestAttempts: number;

  rateLimitEvents: number;

  recoveredAssets: number;

  affectedAssets: string[];
}

interface RadarSnapshot {
  generatedAt: string;

  counts: {
    discovered: number;

    full: number;

    partial: number;

    discoverable: number;

    assessed: number;

    capabilityOnly: number;

    errors: number;

    disordered: number;

    normal: number;
  };

  sourceHealth: {
    robinhoodPrices:
      RobinhoodPriceSourceHealth;
  };

  assets:
    RadarAsset[];
}

function operationalRank(
  asset: RadarAsset,
): number {
  if (
    asset.stateStatus === "ERROR"
  ) {
    return 0;
  }

  if (
    asset.stateStatus ===
      "ASSESSED" &&
    (asset.state?.score ?? 0) > 0
  ) {
    return 1;
  }

  if (
    asset.stateStatus ===
    "ASSESSED"
  ) {
    return 2;
  }

  return 3;
}

function severityLabel(
  code: number | null,
): string {
  if (code === null) {
    return "—";
  }

  const labels: Record<
    number,
    string
  > = {
    0: "NORMAL",
    1: "WATCH",
    2: "ELEVATED",
    3: "HIGH",
    4: "CRITICAL",
  };

  return labels[code] ?? String(code);
}

function disorderLabel(
  id: number,
): string {
  return `AD-${String(
    id + 1,
  ).padStart(3, "0")}`;
}

function RadarChange({
  transition,
}: {
  transition:
    RadarTransition | null;
}) {
  if (!transition) {
    return (
      <span className="radar-change-unavailable">
        —
      </span>
    );
  }

  if (
    transition.status ===
    "BASELINE_ESTABLISHED"
  ) {
    return (
      <div className="radar-change radar-change-baseline">
        <strong>BASELINE</strong>
        <span>
          Awaiting comparison
        </span>
      </div>
    );
  }

  if (
    transition.changed === false
  ) {
    return (
      <div className="radar-change radar-change-stable">
        <strong>STABLE</strong>
        <span>
          No material change
        </span>
      </div>
    );
  }

  if (
    transition.changed !== true
  ) {
    return (
      <div className="radar-change radar-change-baseline">
        <strong>UNKNOWN</strong>
        <span>
          Comparison unavailable
        </span>
      </div>
    );
  }

  const details: string[] = [];

  if (
    transition.scoreDelta !==
      null &&
    transition.scoreDelta !== 0
  ) {
    details.push(
      `${
        transition.scoreDelta > 0
          ? "+"
          : ""
      }${transition.scoreDelta} score`,
    );
  }

  if (
    transition.severity.changed
  ) {
    details.push(
      `${severityLabel(
        transition.severity.previous,
      )} → ${severityLabel(
        transition.severity.current,
      )}`,
    );
  }

  for (
    const id of
    transition.disorders.activated
  ) {
    details.push(
      `${disorderLabel(id)} +`,
    );
  }

  for (
    const id of
    transition.disorders.cleared
  ) {
    details.push(
      `${disorderLabel(id)} cleared`,
    );
  }

  if (details.length === 0) {
    details.push(
      transition.changeTypes
        .map((type) =>
          type
            .replaceAll("_", " ")
            .toLowerCase(),
        )
        .join(" · "),
    );
  }

  return (
    <div className="radar-change radar-change-active">
      <strong>CHANGED</strong>
      <span>
        {details.join(" · ")}
      </span>
    </div>
  );
}

function formatTimestamp(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

export function MADRadar() {
  const [
    snapshot,
    setSnapshot,
  ] = useState<RadarSnapshot | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadRadar =
    useCallback(
      async () => {
        setRefreshing(true);

        try {
          const response =
            await fetch(
              `${MAD_API_BASE_URL}/api/v1/radar`,
              {
                cache:
                  "no-store",
              },
            );

          if (!response.ok) {
            throw new Error(
              `MAD Radar API returned HTTP ${response.status}`,
            );
          }

          const payload =
            (await response.json()) as
              RadarSnapshot;

          setSnapshot(
            payload,
          );

          setError(null);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load MAD Radar.",
          );
        } finally {
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(
    () => {
      void loadRadar();

      const timer =
        window.setInterval(
          () => {
            void loadRadar();
          },
          60_000,
        );

      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [loadRadar],
  );

  const operationalAssets =
    useMemo(
      () =>
        snapshot?.assets
          .filter(
            (asset) =>
              asset.capability ===
              "FULL",
          )
          .toSorted(
            (a, b) => {
              const rank =
                operationalRank(a) -
                operationalRank(b);

              if (rank !== 0) {
                return rank;
              }

              const scoreA =
                a.state?.score ?? 0;

              const scoreB =
                b.state?.score ?? 0;

              if (
                scoreA !== scoreB
              ) {
                return (
                  scoreB -
                  scoreA
                );
              }

              return a.symbol.localeCompare(
                b.symbol,
              );
            },
          ) ?? [],
      [snapshot],
    );

  if (
    !snapshot &&
    !error
  ) {
    return (
      <section className="radar-view">
        <div className="radar-loading">
          <span className="eyebrow">
            MAD RADAR
          </span>

          <h1>
            Building live ecosystem snapshot…
          </h1>

          <p>
            Assessing current Robinhood Chain
            token state and evidence-source health.
          </p>
        </div>
      </section>
    );
  }

  if (
    !snapshot
  ) {
    return (
      <section className="radar-view">
        <div className="radar-loading">
          <span className="eyebrow">
            MAD RADAR
          </span>

          <h1>
            Radar unavailable
          </h1>

          <p>
            {error}
          </p>

          <button
            className="radar-refresh"
            type="button"
            onClick={
              () => void loadRadar()
            }
          >
            RETRY
          </button>
        </div>
      </section>
    );
  }

  const source =
    snapshot.sourceHealth
      .robinhoodPrices;

  const affected =
    new Set(
      source.affectedAssets,
    );

  return (
    <section className="radar-view">
      <div className="radar-heading">
        <div>
          <span className="eyebrow">
            ECOSYSTEM OBSERVATION
          </span>

          <h1>
            MAD RADAR
          </h1>

          <p>
            Live disorder and evidence-health
            view across the Robinhood Stock
            Token universe.
          </p>
        </div>

        <div className="radar-cycle">
          <span>
            OBSERVATION CYCLE
          </span>

          <strong>
            {formatTimestamp(
              snapshot.generatedAt,
            )}
          </strong>

          <button
            className="radar-refresh"
            type="button"
            disabled={refreshing}
            onClick={
              () => void loadRadar()
            }
          >
            {refreshing
              ? "REFRESHING"
              : "REFRESH"}
          </button>
        </div>
      </div>

      <section className="radar-summary">
        <article className="radar-summary-card">
          <span className="radar-card-label">
            UNIVERSE
          </span>

          <strong>
            {snapshot.counts.discovered}
          </strong>

          <div className="radar-card-detail">
            <span>
              {snapshot.counts.full} FULL
            </span>

            <span>
              {snapshot.counts.partial} PARTIAL
            </span>

            <span>
              {snapshot.counts.discoverable} DISCOVERABLE
            </span>
          </div>
        </article>

        <article className="radar-summary-card">
          <span className="radar-card-label">
            CURRENT ASSET STATE
          </span>

          <strong>
            {snapshot.counts.assessed}
            {" / "}
            {snapshot.counts.full}
          </strong>

          <div className="radar-card-detail">
            <span>
              {snapshot.counts.disordered} DISORDERED
            </span>

            <span>
              {snapshot.counts.normal} NORMAL
            </span>

            <span>
              {snapshot.counts.errors} UNAVAILABLE
            </span>
          </div>
        </article>

        <article
          className={`radar-summary-card source-health source-${source.status.toLowerCase()}`}
        >
          <span className="radar-card-label">
            SOURCE HEALTH
          </span>

          <strong>
            {source.status}
          </strong>

          <div className="radar-card-detail">
            <span>
              {source.rateLimitEvents} THROTTLES
            </span>

            <span>
              {source.recoveredAssets} RECOVERED
            </span>

            <span>
              {source.failedAssets} FAILED
            </span>
          </div>
        </article>
      </section>

      <section className="radar-source-panel">
        <div>
          <span className="eyebrow">
            COMMON EVIDENCE SOURCE
          </span>

          <h2>
            Robinhood Prices
          </h2>
        </div>

        <div className="radar-source-metrics">
          <div>
            <span>
              REQUESTED
            </span>

            <strong>
              {source.assetsRequested}
            </strong>
          </div>

          <div>
            <span>
              ATTEMPTS
            </span>

            <strong>
              {source.requestAttempts}
            </strong>
          </div>

          <div>
            <span>
              THROTTLES
            </span>

            <strong>
              {source.rateLimitEvents}
            </strong>
          </div>

          <div>
            <span>
              RECOVERED
            </span>

            <strong>
              {source.recoveredAssets}
            </strong>
          </div>

          <div>
            <span>
              FAILED
            </span>

            <strong>
              {source.failedAssets}
            </strong>
          </div>
        </div>

        {source.affectedAssets.length > 0 && (
          <div className="radar-source-impact">
            <span>
              AFFECTED OBSERVATIONS
            </span>

            <div>
              {source.affectedAssets.map(
                (symbol) => (
                  <b key={symbol}>
                    {symbol}
                  </b>
                ),
              )}
            </div>

            <p>
              Source degradation does not imply
              asset disorder. These observations
              required recovery or failed during
              this cycle.
            </p>
          </div>
        )}
      </section>

      <section className="radar-table-panel">
        <div className="radar-table-heading">
          <div>
            <span className="eyebrow">
              LIVE ASSET RADAR
            </span>

            <h2>
              FULL Capability Assets
            </h2>
          </div>

          <span>
            {
              operationalAssets.length
            }{" "}
            ASSETS
          </span>
        </div>

        <div className="radar-table">
          <div className="radar-row radar-row-header">
            <span>ASSET</span>
            <span>STATE</span>
            <span>SCORE</span>
            <span>COVERAGE</span>
            <span>MARKET</span>
            <span>SOURCE</span>
            <span>CHANGE</span>
          </div>

          {operationalAssets.map(
            (asset) => {
              const state =
                asset.state;

              const coverage =
                state
                  ? `${state.assessedDisorders}/${state.assessedDisorders + state.unassessedDisorders}`
                  : "—";

              const sourceAffected =
                affected.has(
                  asset.symbol,
                );

              return (
                <div
                  className="radar-row"
                  key={
                    asset.assetId
                  }
                >
                  <div className="radar-asset">
                    <strong>
                      {asset.symbol}
                    </strong>

                    <span>
                      {asset.name}
                    </span>
                  </div>

                  <span
                    className={`radar-state radar-state-${(
                      state?.severity ??
                      asset.stateStatus
                    ).toLowerCase()}`}
                  >
                    {state?.severity ??
                      asset.stateStatus}
                  </span>

                  <strong>
                    {state?.score ?? "—"}
                  </strong>

                  <span>
                    {coverage}
                  </span>

                  <span>
                    {state?.marketAvailability ??
                      "—"}
                  </span>

                  <span
                    className={
                      sourceAffected
                        ? "radar-source-affected"
                        : "radar-source-clear"
                    }
                  >
                    {sourceAffected
                      ? "RECOVERED / AFFECTED"
                      : "CLEAR"}
                  </span>
                  <RadarChange
                    transition={
                      asset.transition
                    }
                  />
                </div>
              );
            },
          )}
        </div>
      </section>
    </section>
  );
}
