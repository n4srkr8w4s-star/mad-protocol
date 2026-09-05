import {
  fetchRobinhoodAssets,
  getRobinhoodChainDeployment,
  type RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  MAD_ASSETS,
} from "./catalog.js";

export type MADMonitoringStatus =
  | "FULL"
  | "DISCOVERABLE";

export interface MADDiscoveredAsset {
  symbol: string;
  name: string;
  isin: string;
  address: string;
  chainId: number;
  status: string;
  logoUrl: string;
  monitoring: MADMonitoringStatus;
}

function cleanRobinhoodStatus(
  status: string,
): string {
  return status.replace("ASSET_STATUS_", "");
}

function monitoringStatus(
  asset: RobinhoodStockTokenAsset,
  address: string,
): MADMonitoringStatus {
  const monitored = MAD_ASSETS.some(
    (madAsset) =>
      madAsset.type ===
        "ROBINHOOD_STOCK_TOKEN" &&
      (
        madAsset.address.toLowerCase() ===
          address.toLowerCase() ||
        madAsset.symbol.toUpperCase() ===
          asset.tokenSymbol.toUpperCase()
      ),
  );

  return monitored
    ? "FULL"
    : "DISCOVERABLE";
}

function matchesQuery(
  asset: RobinhoodStockTokenAsset,
  address: string,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return false;
  }

  return [
    asset.tokenSymbol,
    asset.tokenName,
    asset.isin,
    address,
  ].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

function searchRank(
  asset: RobinhoodStockTokenAsset,
  query: string,
): number {
  const needle = query.trim().toLowerCase();

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

export function searchRobinhoodAssetDirectory(
  assets: RobinhoodStockTokenAsset[],
  query: string,
  limit = 20,
): MADDiscoveredAsset[] {
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

    results.push({
      rank: searchRank(asset, query),
      asset: {
        symbol: asset.tokenSymbol,
        name: asset.tokenName,
        isin: asset.isin,
        address:
          deployment.contractAddress,
        chainId: deployment.chainId,
        status:
          cleanRobinhoodStatus(asset.status),
        logoUrl: asset.logoUrl,
        monitoring: monitoringStatus(
          asset,
          deployment.contractAddress,
        ),
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
    .map((result) => result.asset);
}

export async function searchRobinhoodAssets(
  query: string,
  fetchFn: typeof fetch = fetch,
): Promise<MADDiscoveredAsset[]> {
  const assets =
    await fetchRobinhoodAssets(fetchFn);

  return searchRobinhoodAssetDirectory(
    assets,
    query,
  );
}
