import {
  getRobinhoodAssetBySymbol,
  getRobinhoodChainDeployment,
  type RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  fetchRobinhoodFeedMetadataBySymbol,
  type RobinhoodFeedMetadata,
} from "../adapters/robinhood/feedDirectory.js";

import {
  ActiveDisorderId,
} from "../domain/types.js";

export type MADCapabilityLevel =
  | "FULL"
  | "PARTIAL"
  | "DISCOVERABLE";

export interface MADDisorderCapability {
  id: ActiveDisorderId;
  code: string;
  supported: boolean;
  reason: string;
}

export interface RobinhoodAssetCapability {
  symbol: string;
  name: string;
  assetId: string;
  isin: string;
  status: string;

  deployment: {
    address: string;
    chainId: number;
  } | null;

  feed: {
    proxyAddress: string;
    heartbeatSeconds: number;
    marketHours: string | null;
    productTypeCode: string | null;
  } | null;

  capability: MADCapabilityLevel;

  supportedDisorders: number;
  totalDisorders: number;

  disorders: MADDisorderCapability[];
}

type AssetLookup = (
  symbol: string,
) => Promise<RobinhoodStockTokenAsset | undefined>;

type FeedLookup = (
  symbol: string,
) => Promise<RobinhoodFeedMetadata | undefined>;

export interface RobinhoodCapabilityDependencies {
  getAsset?: AssetLookup;
  getFeed?: FeedLookup;
}

async function defaultFeedLookup(
  symbol: string,
): Promise<RobinhoodFeedMetadata | undefined> {
  try {
    return await fetchRobinhoodFeedMetadataBySymbol(
      symbol,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "primary tokenized price feed not found",
      )
    ) {
      return undefined;
    }

    throw error;
  }
}

function capabilityLevel(
  supported: number,
  total: number,
): MADCapabilityLevel {
  if (supported === total) {
    return "FULL";
  }

  if (supported > 0) {
    return "PARTIAL";
  }

  return "DISCOVERABLE";
}

export async function resolveRobinhoodCapability(
  symbol: string,
  dependencies: RobinhoodCapabilityDependencies = {},
): Promise<RobinhoodAssetCapability | undefined> {
  const getAsset =
    dependencies.getAsset ??
    ((value: string) =>
      getRobinhoodAssetBySymbol(value));

  const getFeed =
    dependencies.getFeed ??
    defaultFeedLookup;

  const asset =
    await getAsset(symbol);

  if (!asset) {
    return undefined;
  }

  const deployment =
    getRobinhoodChainDeployment(asset);

  /*
   * Without a Robinhood Chain deployment MAD can
   * discover the asset but cannot perform the current
   * onchain Stock Token disorder model.
   */
  if (!deployment) {
    const disorders: MADDisorderCapability[] = [
      {
        id:
          ActiveDisorderId.UNDERLYING_TRADING_HALT,
        code:
          "UNDERLYING_TRADING_HALT",
        supported: false,
        reason:
          "No Robinhood Chain deployment is available.",
      },
      {
        id:
          ActiveDisorderId.MULTIPLIER_TRANSITION,
        code:
          "MULTIPLIER_TRANSITION",
        supported: false,
        reason:
          "No Robinhood Chain deployment is available.",
      },
      {
        id:
          ActiveDisorderId.REFERENCE_DATA_STALE,
        code:
          "REFERENCE_DATA_STALE",
        supported: false,
        reason:
          "No Robinhood Chain deployment is available.",
      },
      {
        id:
          ActiveDisorderId.ORACLE_DEVIATION,
        code:
          "ORACLE_DEVIATION",
        supported: false,
        reason:
          "No Robinhood Chain deployment is available.",
      },
    ];

    return {
      symbol: asset.tokenSymbol,
      name: asset.tokenName,
      assetId: asset.id,
      isin: asset.isin,
      status: asset.status,
      deployment: null,
      feed: null,
      capability: "DISCOVERABLE",
      supportedDisorders: 0,
      totalDisorders: disorders.length,
      disorders,
    };
  }

  const feed =
    await getFeed(asset.tokenSymbol);

  /*
   * AD-002 and AD-004 are supported by the Robinhood
   * Stock Token + Robinhood Chain deployment model.
   *
   * AD-005 and AD-008 additionally require canonical
   * feed metadata and known market-hour semantics.
   */
  const hasCanonicalFeed =
    feed !== undefined;

  const hasMarketSemantics =
    feed?.marketHours !== null &&
    feed?.marketHours !== undefined;

  const supportsReferenceDisorders =
    hasCanonicalFeed &&
    hasMarketSemantics;

  const disorders: MADDisorderCapability[] = [
    {
      id:
        ActiveDisorderId.UNDERLYING_TRADING_HALT,
      code:
        "UNDERLYING_TRADING_HALT",
      supported: true,
      reason:
        "Robinhood Stock Token price state supports trading-halt assessment.",
    },
    {
      id:
        ActiveDisorderId.MULTIPLIER_TRANSITION,
      code:
        "MULTIPLIER_TRANSITION",
      supported: true,
      reason:
        "Robinhood Chain deployment supports onchain multiplier assessment.",
    },
    {
      id:
        ActiveDisorderId.REFERENCE_DATA_STALE,
      code:
        "REFERENCE_DATA_STALE",
      supported:
        supportsReferenceDisorders,
      reason:
        supportsReferenceDisorders
          ? "Canonical feed heartbeat and market-hours metadata are available."
          : "Canonical feed metadata with market-hours semantics is unavailable.",
    },
    {
      id:
        ActiveDisorderId.ORACLE_DEVIATION,
      code:
        "ORACLE_DEVIATION",
      supported:
        supportsReferenceDisorders,
      reason:
        supportsReferenceDisorders
          ? "Canonical tokenized-price feed and market-hours metadata are available."
          : "Canonical feed metadata with market-hours semantics is unavailable.",
    },
  ];

  const supportedDisorders =
    disorders.filter(
      (disorder) => disorder.supported,
    ).length;

  return {
    symbol: asset.tokenSymbol,
    name: asset.tokenName,
    assetId: asset.id,
    isin: asset.isin,
    status: asset.status,

    deployment: {
      address:
        deployment.contractAddress,
      chainId:
        deployment.chainId,
    },

    feed:
      feed === undefined
        ? null
        : {
            proxyAddress:
              feed.proxyAddress,
            heartbeatSeconds:
              feed.heartbeatSeconds,
            marketHours:
              feed.marketHours,
            productTypeCode:
              feed.productTypeCode,
          },

    capability:
      capabilityLevel(
        supportedDisorders,
        disorders.length,
      ),

    supportedDisorders,
    totalDisorders:
      disorders.length,

    disorders,
  };
}
