import {
  MADSeverity,
} from "../domain/types.js";

import {
  evaluateRobinhoodCompositeState,
} from "./evaluateRobinhoodCompositeState.js";

import {
  createPacedRobinhoodPriceLookup,
  type RobinhoodPriceLookup,
} from "./pacedRobinhoodPriceLookup.js";

import {
  createRetryingRobinhoodPriceLookup,
} from "./retryingRobinhoodPriceLookup.js";

import type {
  RobinhoodPriceRetryEvent,
} from "./retryingRobinhoodPriceLookup.js";

import {
  buildRobinhoodPriceSourceHealth,
  type RobinhoodPriceSourceHealth,
} from "./robinhoodPriceSourceHealth.js";

import {
  scanRobinhoodUniverse,
  type MADFeedResolution,
  type RobinhoodUniverseScan,
} from "./scanRobinhoodUniverse.js";

export type MADRadarStateStatus =
  | "ASSESSED"
  | "CAPABILITY_ONLY"
  | "ERROR";

export interface MADRadarActiveDisorder {
  id: number;
  score: number;
  severityCode: MADSeverity;
  severity: string;
}

export interface MADRadarAsset {
  symbol: string;
  name: string;
  assetId: string;
  isin: string;

  address: string | null;
  chainId: number | null;

  capability:
    | "FULL"
    | "PARTIAL"
    | "DISCOVERABLE";

  supportedDisorders: number;
  totalDisorders: number;

  feedResolution:
    MADFeedResolution;

  stateStatus:
    MADRadarStateStatus;

  state: {
    score: number;
    severityCode: MADSeverity;
    severity: string;

    assessedDisorders: number;
    unassessedDisorders: number;

    marketAvailability: string;

    activeDisorders:
      MADRadarActiveDisorder[];
  } | null;

  reason: string | null;
}

export interface MADRadarSnapshot {
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

  assets: MADRadarAsset[];
}

export interface MADRadarInput {
  rpcUrl: string;
  concurrency?: number;
  evaluationTimeUnix?: bigint;
}

export interface MADRadarDependencies {

  scanUniverse?:
    () => Promise<RobinhoodUniverseScan>;

  getPrice?: RobinhoodPriceLookup;

  evaluateComposite?:
    typeof evaluateRobinhoodCompositeState;

  now?: () => Date;

}

function severityName(
  severity: MADSeverity,
): string {
  const value =
    MADSeverity[severity];

  return typeof value === "string"
    ? value
    : "UNKNOWN";
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (
    value: T,
    index: number,
  ) => Promise<R>,
): Promise<R[]> {
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1
  ) {
    throw new Error(
      "Radar concurrency must be a positive integer.",
    );
  }

  const results =
    new Array<R>(values.length);

  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const index =
        nextIndex++;

      if (index >= values.length) {
        return;
      }

      results[index] =
        await worker(
          values[index]!,
          index,
        );
    }
  }

  const workerCount =
    Math.min(
      concurrency,
      values.length,
    );

  await Promise.all(
    Array.from(
      {
        length: workerCount,
      },
      () => runWorker(),
    ),
  );

  return results;
}

export async function buildMADRadar(
  input: MADRadarInput,
  dependencies: MADRadarDependencies = {},
): Promise<MADRadarSnapshot> {
  const scanUniverse =
    dependencies.scanUniverse ??
    (() =>
      scanRobinhoodUniverse());

  const evaluateComposite =
    dependencies.evaluateComposite ??
    evaluateRobinhoodCompositeState;

  const now =
    dependencies.now ??
    (() => new Date());

  const concurrency =
    input.concurrency ?? 4;

  const priceRetryEvents:
    RobinhoodPriceRetryEvent[] = [];

  const getPrice =
    dependencies.getPrice ??
    createRetryingRobinhoodPriceLookup({
      /*
       * Every attempt, including retries, enters
       * the same shared pacing queue.
       */
      lookup:
        createPacedRobinhoodPriceLookup({
          minIntervalMs: 250,
        }),

      maxAttempts: 3,

      baseBackoffMs: 1_000,

      onEvent:
        (event) => {
          priceRetryEvents.push(
            event,
          );
        },
    });

  const universe =
    await scanUniverse();

  const fullAssets =
    universe.assets.filter(
      (item) =>
        item.capability.capability ===
        "FULL",
    );

  const fullResults =
    await mapWithConcurrency(
      fullAssets,
      concurrency,
      async (item) => {
        const {
          capability,
          feedResolution,
        } = item;

        try {
          const resolvedFeed =
            item.source.feed;

          if (!resolvedFeed) {
            throw new Error(
              `${capability.symbol} is FULL but has no resolved feed metadata.`,
            );
          }

          const composite =
            await evaluateComposite(
              {
                symbol:
                  capability.symbol,

                rpcUrl:
                  input.rpcUrl,

                evaluationTimeUnix:
                  input.evaluationTimeUnix,
              },
              {
                getAsset:
                  async () =>
                    item.source.asset,

                getPrice,

                resolveFeedMetadata:
                  async () =>
                    resolvedFeed,
              },
            );

          return {
            symbol:
              capability.symbol,

            name:
              capability.name,

            assetId:
              capability.assetId,

            isin:
              capability.isin,

            address:
              capability.deployment
                ?.address ??
              null,

            chainId:
              capability.deployment
                ?.chainId ??
              null,

            capability:
              capability.capability,

            supportedDisorders:
              capability.supportedDisorders,

            totalDisorders:
              capability.totalDisorders,

            feedResolution,

            stateStatus:
              "ASSESSED" as const,

            state: {
              score:
                composite.mad
                  .disorderScore,

              severityCode:
                composite.mad
                  .severity,

              severity:
                severityName(
                  composite.mad
                    .severity,
                ),

              assessedDisorders:
                composite.mad
                  .assessedDisorders,

              unassessedDisorders:
                composite.mad
                  .unassessedDisorders,

              marketAvailability:
                composite.observations
                  .oracle
                  .marketAvailability,

              activeDisorders:
                composite.mad
                  .activeDisorders
                  .map(
                    (disorder) => ({
                      id:
                        disorder
                          .disorderId,

                      score:
                        disorder.score,

                      severityCode:
                        disorder
                          .severity,

                      severity:
                        severityName(
                          disorder
                            .severity,
                        ),
                    }),
                  ),
            },

            reason: null,
          } satisfies MADRadarAsset;
        } catch (error) {
          return {
            symbol:
              capability.symbol,

            name:
              capability.name,

            assetId:
              capability.assetId,

            isin:
              capability.isin,

            address:
              capability.deployment
                ?.address ??
              null,

            chainId:
              capability.deployment
                ?.chainId ??
              null,

            capability:
              capability.capability,

            supportedDisorders:
              capability.supportedDisorders,

            totalDisorders:
              capability.totalDisorders,

            feedResolution,

            stateStatus:
              "ERROR" as const,

            state: null,

            reason:
              error instanceof Error
                ? error.message
                : "MAD state evaluation failed.",
          } satisfies MADRadarAsset;
        }
      },
    );

  const capabilityOnly =
    universe.assets
      .filter(
        (item) =>
          item.capability
            .capability !==
          "FULL",
      )
      .map(
        ({
          capability,
          feedResolution,
        }): MADRadarAsset => ({
          symbol:
            capability.symbol,

          name:
            capability.name,

          assetId:
            capability.assetId,

          isin:
            capability.isin,

          address:
            capability.deployment
              ?.address ??
            null,

          chainId:
            capability.deployment
              ?.chainId ??
            null,

          capability:
            capability.capability,

          supportedDisorders:
            capability.supportedDisorders,

          totalDisorders:
            capability.totalDisorders,

          feedResolution,

          stateStatus:
            "CAPABILITY_ONLY",

          state: null,

          reason:
            capability.capability ===
            "PARTIAL"
              ? "MAD has partial structural capability for this asset."
              : "MAD can discover this asset but cannot currently produce supported live state.",
        }),
      );

  const assets = [
    ...fullResults,
    ...capabilityOnly,
  ];

  const assessed =
    assets.filter(
      (asset) =>
        asset.stateStatus ===
        "ASSESSED",
    );

  const robinhoodPriceSourceHealth =
    buildRobinhoodPriceSourceHealth(
      priceRetryEvents,
    );

  return {
    generatedAt:
      now().toISOString(),

    counts: {
      discovered:
        assets.length,

      full:
        universe.counts.full,

      partial:
        universe.counts.partial,

      discoverable:
        universe.counts
          .discoverable,

      assessed:
        assessed.length,

      capabilityOnly:
        assets.filter(
          (asset) =>
            asset.stateStatus ===
            "CAPABILITY_ONLY",
        ).length,

      errors:
        assets.filter(
          (asset) =>
            asset.stateStatus ===
            "ERROR",
        ).length,

      disordered:
        assessed.filter(
          (asset) =>
            (asset.state?.score ?? 0) >
            0,
        ).length,

      normal:
        assessed.filter(
          (asset) =>
            asset.state?.score === 0,
        ).length,
    },

    sourceHealth: {
      robinhoodPrices:
        robinhoodPriceSourceHealth,
    },

    assets,
  };
}
