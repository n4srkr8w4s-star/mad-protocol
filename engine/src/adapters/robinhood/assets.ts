const ROBINHOOD_ASSETS_URL =
  "https://api.robinhood.com/rhj/assets";

export interface RobinhoodDeployment {
  contractAddress: string;
  chainId: number;
  networkName: string;
}

export interface RobinhoodTradingCapability {
  whole: string;
  fractional: string;
}

export interface RobinhoodTradingCapabilities {
  market: RobinhoodTradingCapability;
  extended: RobinhoodTradingCapability;
  overnight: RobinhoodTradingCapability;
}

export interface RobinhoodStockTokenAsset {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  deployments: RobinhoodDeployment[];
  currentMultiplier: string;
  pendingMultiplier: string;
  status: string;
  logoUrl: string;
  tradingCapabilities: RobinhoodTradingCapabilities;
  tokenDecimals: number;
  isin: string;
}

interface RobinhoodAssetsResponse {
  assets: RobinhoodStockTokenAsset[];
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseRobinhoodAssetsResponse(
  value: unknown,
): RobinhoodAssetsResponse {
  if (!isRecord(value)) {
    throw new Error(
      "Invalid Robinhood assets response",
    );
  }

  if (!Array.isArray(value.assets)) {
    throw new Error(
      "Robinhood assets response does not contain an assets array",
    );
  }

  return {
    assets:
      value.assets as RobinhoodStockTokenAsset[],
  };
}

export async function fetchRobinhoodAssets(
  fetchFn: typeof fetch = fetch,
): Promise<RobinhoodStockTokenAsset[]> {
  const response = await fetchFn(
    ROBINHOOD_ASSETS_URL,
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Robinhood assets request failed: HTTP ${response.status}`,
    );
  }

  const payload: unknown =
    await response.json();

  return parseRobinhoodAssetsResponse(
    payload,
  ).assets;
}

export async function getRobinhoodAssetBySymbol(
  symbol: string,
  fetchFn: typeof fetch = fetch,
): Promise<RobinhoodStockTokenAsset | undefined> {
  const assets =
    await fetchRobinhoodAssets(fetchFn);

  return assets.find(
    (asset) =>
      asset.tokenSymbol.toUpperCase() ===
      symbol.toUpperCase(),
  );
}

export function getRobinhoodChainDeployment(
  asset: RobinhoodStockTokenAsset,
  chainId = 4663,
): RobinhoodDeployment | undefined {
  return asset.deployments.find(
    (deployment) =>
      deployment.chainId === chainId,
  );
}
