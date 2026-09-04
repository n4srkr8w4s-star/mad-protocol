import { describe, expect, it } from "vitest";

import {
  fetchRobinhoodAssets,
  getRobinhoodAssetBySymbol,
  getRobinhoodChainDeployment,
} from "../src/adapters/robinhood/assets.js";

const AAPL = {
  id: "0x00000000000000000000000000000000c2425be3658540dd8e2424cbf3c5c649",
  tokenSymbol: "AAPL",
  tokenName: "Apple • Robinhood Token",
  deployments: [
    {
      contractAddress:
        "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
      chainId: 4663,
      networkName: "Robinhood Chain",
    },
  ],
  currentMultiplier:
    "1.000566080061092436",
  pendingMultiplier: "",
  status: "ASSET_STATUS_ACTIVE",
  logoUrl:
    "https://cdn.robinhood.com/ncw_assets/logos/0xaf3d76f1834a1d425780943c99ea8a608f8a93f9.png",
  tradingCapabilities: {
    market: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },
    extended: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },
    overnight: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },
  },
  tokenDecimals: 18,
  isin: "US0378331005",
};

function createMockFetch(): typeof fetch {
  return (async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      assets: [AAPL],
    }),
  })) as unknown as typeof fetch;
}

describe("Robinhood Stock Token asset adapter", () => {
  it("fetches Robinhood Stock Token metadata", async () => {
    const assets =
      await fetchRobinhoodAssets(
        createMockFetch(),
      );

    expect(assets).toHaveLength(1);

    expect(assets[0]).toMatchObject({
      tokenSymbol: "AAPL",
      tokenName: "Apple • Robinhood Token",
      currentMultiplier:
        "1.000566080061092436",
      pendingMultiplier: "",
      status: "ASSET_STATUS_ACTIVE",
      tokenDecimals: 18,
      isin: "US0378331005",
    });
  });

  it("finds a Stock Token by symbol case-insensitively", async () => {
    const asset =
      await getRobinhoodAssetBySymbol(
        "aapl",
        createMockFetch(),
      );

    expect(asset?.tokenSymbol).toBe(
      "AAPL",
    );

    expect(asset?.currentMultiplier).toBe(
      "1.000566080061092436",
    );
  });

  it("resolves the canonical Robinhood Chain deployment", () => {
    const deployment =
      getRobinhoodChainDeployment(AAPL);

    expect(deployment).toEqual({
      contractAddress:
        "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
      chainId: 4663,
      networkName: "Robinhood Chain",
    });
  });

  it("does not confuse Robinhood Chain mainnet with testnet", () => {
    const deployment =
      getRobinhoodChainDeployment(
        AAPL,
        46630,
      );

    expect(deployment).toBeUndefined();
  });
});
