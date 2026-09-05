import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  searchRobinhoodAssetDirectory,
} from "./discovery.js";

function asset(
  overrides: Partial<RobinhoodStockTokenAsset>,
): RobinhoodStockTokenAsset {
  return {
    id: "asset-id",
    tokenSymbol: "TSLA",
    tokenName: "Tesla • Robinhood Token",
    deployments: [
      {
        contractAddress:
          "0x1111111111111111111111111111111111111111",
        chainId: 4663,
        networkName: "Robinhood Chain",
      },
    ],
    currentMultiplier: "1",
    pendingMultiplier: "",
    status: "ASSET_STATUS_ACTIVE",
    logoUrl: "https://example.com/logo.png",
    tradingCapabilities: {
      market: {
        whole: "TRADING_CAPABILITY_ENABLED",
        fractional:
          "TRADING_CAPABILITY_ENABLED",
      },
      extended: {
        whole: "TRADING_CAPABILITY_ENABLED",
        fractional:
          "TRADING_CAPABILITY_ENABLED",
      },
      overnight: {
        whole: "TRADING_CAPABILITY_ENABLED",
        fractional:
          "TRADING_CAPABILITY_ENABLED",
      },
    },
    tokenDecimals: 18,
    isin: "US88160R1014",
    ...overrides,
  };
}

describe(
  "searchRobinhoodAssetDirectory",
  () => {
    it(
      "searches by symbol and ranks exact symbol first",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [
              asset({
                tokenSymbol: "TSLAX",
                tokenName:
                  "Tesla Example Token",
              }),
              asset({
                tokenSymbol: "TSLA",
              }),
            ],
            "TSLA",
          );

        expect(results).toHaveLength(2);

        expect(
          results[0]?.symbol,
        ).toBe("TSLA");
      },
    );

    it(
      "searches by token name",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [
              asset({
                tokenSymbol: "NVDA",
                tokenName:
                  "NVIDIA • Robinhood Token",
              }),
            ],
            "nvidia",
          );

        expect(
          results[0]?.symbol,
        ).toBe("NVDA");
      },
    );

    it(
      "searches by ISIN",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],
            "US88160R1014",
          );

        expect(results).toHaveLength(1);
      },
    );

    it(
      "searches by contract address",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],
            "0x1111111111111111111111111111111111111111",
          );

        expect(results).toHaveLength(1);
      },
    );

    it(
      "marks catalogued Robinhood assets as fully monitored",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [
              asset({
                tokenSymbol: "AAPL",
                tokenName:
                  "Apple • Robinhood Token",
                isin: "US0378331005",
                deployments: [
                  {
                    contractAddress:
                      "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
                    chainId: 4663,
                    networkName:
                      "Robinhood Chain",
                  },
                ],
              }),
            ],
            "AAPL",
          );

        expect(
          results[0]?.monitoring,
        ).toBe("FULL");
      },
    );

    it(
      "marks uncatalogued assets as discoverable",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],
            "TSLA",
          );

        expect(
          results[0]?.monitoring,
        ).toBe("DISCOVERABLE");
      },
    );

    it(
      "ignores assets without a Robinhood Chain deployment",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [
              asset({
                deployments: [
                  {
                    contractAddress:
                      "0x2222222222222222222222222222222222222222",
                    chainId: 1,
                    networkName: "Ethereum",
                  },
                ],
              }),
            ],
            "TSLA",
          );

        expect(results).toEqual([]);
      },
    );
  },
);
