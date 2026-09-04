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
];

export function getAssetById(
  id: string,
): MADAssetDefinition | undefined {
  return MAD_ASSETS.find(
    (asset) =>
      asset.id.toLowerCase() === id.toLowerCase(),
  );
}
