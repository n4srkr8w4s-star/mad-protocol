import {
  fetchRobinhoodAssets,
  type RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  fetchRobinhoodPrimaryTokenizedPriceFeeds,
  type RobinhoodFeedMetadata,
} from "../adapters/robinhood/feedDirectory.js";

import {
  buildRobinhoodCapability,
  type RobinhoodAssetCapability,
} from "./resolveRobinhoodCapability.js";

export type MADFeedResolution =
  | "RESOLVED"
  | "MISSING"
  | "AMBIGUOUS";

export interface RobinhoodUniverseAsset {
  capability: RobinhoodAssetCapability;
  feedResolution: MADFeedResolution;
}

export interface RobinhoodUniverseScan {
  generatedAt: string;

  counts: {
    discovered: number;
    full: number;
    partial: number;
    discoverable: number;
    ambiguousFeeds: number;
  };

  assets: RobinhoodUniverseAsset[];
}

export interface RobinhoodUniverseDependencies {
  getAssets?: () => Promise<
    RobinhoodStockTokenAsset[]
  >;

  getFeeds?: () => Promise<
    RobinhoodFeedMetadata[]
  >;
}

function feedIndex(
  feeds: RobinhoodFeedMetadata[],
): Map<string, RobinhoodFeedMetadata[]> {
  const index =
    new Map<
      string,
      RobinhoodFeedMetadata[]
    >();

  for (const feed of feeds) {
    if (!feed.baseAsset) {
      continue;
    }

    const symbol =
      feed.baseAsset.toUpperCase();

    const existing =
      index.get(symbol) ?? [];

    existing.push(feed);

    index.set(
      symbol,
      existing,
    );
  }

  return index;
}

function capabilityRank(
  value:
    | "FULL"
    | "PARTIAL"
    | "DISCOVERABLE",
): number {
  switch (value) {
    case "FULL":
      return 0;

    case "PARTIAL":
      return 1;

    case "DISCOVERABLE":
      return 2;
  }
}

export async function scanRobinhoodUniverse(
  dependencies: RobinhoodUniverseDependencies = {},
): Promise<RobinhoodUniverseScan> {
  const getAssets =
    dependencies.getAssets ??
    (() =>
      fetchRobinhoodAssets());

  const getFeeds =
    dependencies.getFeeds ??
    (() =>
      fetchRobinhoodPrimaryTokenizedPriceFeeds());

  /*
   * Critical scalability rule:
   *
   * exactly one Robinhood asset-directory fetch
   * and one feed-directory fetch per scan.
   */
  const [
    assets,
    feeds,
  ] = await Promise.all([
    getAssets(),
    getFeeds(),
  ]);

  const feedsBySymbol =
    feedIndex(feeds);

  const results:
    RobinhoodUniverseAsset[] = [];

  for (const asset of assets) {
    const symbol =
      asset.tokenSymbol.toUpperCase();

    const candidates =
      feedsBySymbol.get(symbol) ?? [];

    const feed =
      candidates.length === 1
        ? candidates[0]
        : undefined;

    const capability =
      buildRobinhoodCapability(
        asset,
        feed,
      );

    const feedResolution:
      MADFeedResolution =
        candidates.length === 0
          ? "MISSING"
          : candidates.length === 1
            ? "RESOLVED"
            : "AMBIGUOUS";

    results.push({
      capability,
      feedResolution,
    });
  }

  results.sort(
    (a, b) => {
      const rank =
        capabilityRank(
          a.capability.capability,
        ) -
        capabilityRank(
          b.capability.capability,
        );

      if (rank !== 0) {
        return rank;
      }

      return a.capability.symbol.localeCompare(
        b.capability.symbol,
      );
    },
  );

  return {
    generatedAt:
      new Date().toISOString(),

    counts: {
      discovered:
        results.length,

      full:
        results.filter(
          (item) =>
            item.capability.capability ===
            "FULL",
        ).length,

      partial:
        results.filter(
          (item) =>
            item.capability.capability ===
            "PARTIAL",
        ).length,

      discoverable:
        results.filter(
          (item) =>
            item.capability.capability ===
            "DISCOVERABLE",
        ).length,

      ambiguousFeeds:
        results.filter(
          (item) =>
            item.feedResolution ===
            "AMBIGUOUS",
        ).length,
    },

    assets:
      results,
  };
}
