import {
  fetchRobinhoodAssets,
  getRobinhoodChainDeployment,
  type RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  fetchRobinhoodPrimaryTokenizedPriceFeeds,
  type RobinhoodFeedMetadata,
} from "../adapters/robinhood/feedDirectory.js";

import {
  buildRobinhoodCapability,
  type MADCapabilityLevel,
} from "../engine/resolveRobinhoodCapability.js";

export type MADMonitoringStatus =
  MADCapabilityLevel;

export type MADFeedResolution =
  | "RESOLVED"
  | "MISSING"
  | "AMBIGUOUS";

export interface MADDiscoveredAsset {
  symbol: string;
  name: string;
  isin: string;
  address: string;
  chainId: number;
  status: string;
  logoUrl: string;

  /*
   * Kept as "monitoring" for Observatory/API
   * compatibility, but now derived from the real
   * MAD capability model rather than catalogue
   * membership.
   */
  monitoring: MADMonitoringStatus;

  supportedDisorders: number;
  totalDisorders: number;
  feedResolution: MADFeedResolution;
}

function cleanRobinhoodStatus(
  status: string,
): string {
  return status.replace(
    "ASSET_STATUS_",
    "",
  );
}

function matchesQuery(
  asset: RobinhoodStockTokenAsset,
  address: string,
  query: string,
): boolean {
  const needle =
    query.trim().toLowerCase();

  if (!needle) {
    return false;
  }

  return [
    asset.tokenSymbol,
    asset.tokenName,
    asset.isin,
    address,
  ].some((value) =>
    value
      .toLowerCase()
      .includes(needle),
  );
}

function searchRank(
  asset: RobinhoodStockTokenAsset,
  query: string,
): number {
  const needle =
    query.trim().toLowerCase();

  const symbol =
    asset.tokenSymbol.toLowerCase();

  const name =
    asset.tokenName.toLowerCase();

  const isin =
    asset.isin.toLowerCase();

  if (symbol === needle) {
    return 0;
  }

  if (isin === needle) {
    return 1;
  }

  if (symbol.startsWith(needle)) {
    return 2;
  }

  if (name.startsWith(needle)) {
    return 3;
  }

  return 4;
}

function feedsBySymbol(
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

export function searchRobinhoodAssetDirectory(
  assets: RobinhoodStockTokenAsset[],
  feeds: RobinhoodFeedMetadata[],
  query: string,
  limit = 20,
): MADDiscoveredAsset[] {
  const feedIndex =
    feedsBySymbol(feeds);

  const results: Array<{
    asset: MADDiscoveredAsset;
    rank: number;
  }> = [];

  for (const asset of assets) {
    const deployment =
      getRobinhoodChainDeployment(asset);

    if (!deployment) {
      continue;
    }

    if (
      !matchesQuery(
        asset,
        deployment.contractAddress,
        query,
      )
    ) {
      continue;
    }

    const candidates =
      feedIndex.get(
        asset.tokenSymbol.toUpperCase(),
      ) ?? [];

    const feed =
      candidates.length === 1
        ? candidates[0]
        : undefined;

    const feedResolution:
      MADFeedResolution =
        candidates.length === 0
          ? "MISSING"
          : candidates.length === 1
            ? "RESOLVED"
            : "AMBIGUOUS";

    const capability =
      buildRobinhoodCapability(
        asset,
        feed,
      );

    results.push({
      rank:
        searchRank(
          asset,
          query,
        ),

      asset: {
        symbol:
          asset.tokenSymbol,

        name:
          asset.tokenName,

        isin:
          asset.isin,

        address:
          deployment.contractAddress,

        chainId:
          deployment.chainId,

        status:
          cleanRobinhoodStatus(
            asset.status,
          ),

        logoUrl:
          asset.logoUrl,

        monitoring:
          capability.capability,

        supportedDisorders:
          capability.supportedDisorders,

        totalDisorders:
          capability.totalDisorders,

        feedResolution,
      },
    });
  }

  return results
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }

      return a.asset.symbol.localeCompare(
        b.asset.symbol,
      );
    })
    .slice(0, limit)
    .map(
      (result) =>
        result.asset,
    );
}

export async function searchRobinhoodAssets(
  query: string,
  fetchFn: typeof fetch = fetch,
): Promise<MADDiscoveredAsset[]> {
  /*
   * Search uses the same scalable model as the
   * universe scanner:
   *
   * one Robinhood asset-directory request
   * plus one canonical feed-directory request.
   */
  const [
    assets,
    feeds,
  ] = await Promise.all([
    fetchRobinhoodAssets(
      fetchFn,
    ),

    fetchRobinhoodPrimaryTokenizedPriceFeeds(
      fetchFn,
    ),
  ]);

  return searchRobinhoodAssetDirectory(
    assets,
    feeds,
    query,
  );
}
