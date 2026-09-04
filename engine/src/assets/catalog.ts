export type MADAssetType =
  | "TEST_ASSET"
  | "ROBINHOOD_STOCK_TOKEN"
  | "TOKEN"
  | "REFERENCE_ASSET";

export interface MADAssetDefinition {
  id: string;
  symbol: string;
  name: string;
  type: MADAssetType;

  chainId: number;
  address: string;

  underlyingSymbol?: string;
  oracleFeedAddress?: string;

  description?: string;
}

export const MAD_ASSETS: MADAssetDefinition[] = [
  {
    id: "tpons",
    symbol: "tPONS",
    name: "PONS Test Asset",
    type: "TEST_ASSET",
    chainId: 46630,
    address:
      "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36",
    description:
      "Controlled testnet-only asset used for MAD integration testing. Not an official PONS token.",
  },

  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple • Robinhood Token",
    type: "ROBINHOOD_STOCK_TOKEN",
    chainId: 4663,
    address:
      "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    underlyingSymbol: "AAPL",
    oracleFeedAddress:
      "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",
    description:
      "Apple Stock Token on Robinhood Chain monitored by MAD.",
  },
];

export function getAssetById(
  id: string,
): MADAssetDefinition | undefined {
  return MAD_ASSETS.find(
    (asset) =>
      asset.id.toLowerCase() === id.toLowerCase(),
  );
}
