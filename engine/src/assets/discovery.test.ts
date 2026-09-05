import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import type {
  RobinhoodFeedMetadata,
} from "../adapters/robinhood/feedDirectory.js";

import {
  searchRobinhoodAssetDirectory,
} from "./discovery.js";

function asset(
  overrides: Partial<RobinhoodStockTokenAsset>,
): RobinhoodStockTokenAsset {
  return {
    id: "asset-id",
    tokenSymbol: "TSLA",
    tokenName:
      "Tesla • Robinhood Token",

    deployments: [
      {
        contractAddress:
          "0x1111111111111111111111111111111111111111",
        chainId: 4663,
        networkName:
          "Robinhood Chain",
      },
    ],

    currentMultiplier: "1",
    pendingMultiplier: "",

    status:
      "ASSET_STATUS_ACTIVE",

    logoUrl:
      "https://example.com/logo.png",

    tradingCapabilities: {
      market: {
        whole:
          "TRADING_CAPABILITY_ENABLED",
        fractional:
          "TRADING_CAPABILITY_ENABLED",
      },

      extended: {
        whole:
          "TRADING_CAPABILITY_ENABLED",
        fractional:
          "TRADING_CAPABILITY_ENABLED",
      },

      overnight: {
        whole:
          "TRADING_CAPABILITY_ENABLED",
        fractional:
          "TRADING_CAPABILITY_ENABLED",
      },
    },

    tokenDecimals: 18,
    isin: "US88160R1014",

    ...overrides,
  };
}

function feed(
  overrides:
    Partial<RobinhoodFeedMetadata> = {},
): RobinhoodFeedMetadata {
  return {
    name:
      "Robinhood TSLA / USD",

    proxyAddress:
      "0x2222222222222222222222222222222222222222",

    contractAddress:
      "0x3333333333333333333333333333333333333333",

    secondaryProxyAddress:
      null,

    heartbeatSeconds:
      86400,

    threshold:
      0.5,

    decimals:
      8,

    assetClass:
      "Equity",

    assetSubClass:
      "US",

    baseAsset:
      "TSLA",

    quoteAsset:
      "USD",

    marketHours:
      "us_equities_24/5",

    productType:
      "Price",

    productTypeCode:
      "primaryTokenizedPrice",

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
                tokenSymbol:
                  "TSLAX",
                tokenName:
                  "Tesla Example Token",
              }),

              asset({
                tokenSymbol:
                  "TSLA",
              }),
            ],

            [
              feed({
                baseAsset:
                  "TSLA",
              }),
            ],

            "TSLA",
          );

        expect(
          results,
        ).toHaveLength(2);

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
                tokenSymbol:
                  "NVDA",

                tokenName:
                  "NVIDIA • Robinhood Token",
              }),
            ],

            [
              feed({
                baseAsset:
                  "NVDA",
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
            [feed()],
            "US88160R1014",
          );

        expect(
          results,
        ).toHaveLength(1);
      },
    );

    it(
      "searches by contract address",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],
            [feed()],
            "0x1111111111111111111111111111111111111111",
          );

        expect(
          results,
        ).toHaveLength(1);
      },
    );

    it(
      "marks an asset with canonical feed capability as FULL",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],
            [feed()],
            "TSLA",
          );

        expect(
          results[0]?.monitoring,
        ).toBe("FULL");

        expect(
          results[0]
            ?.supportedDisorders,
        ).toBe(4);

        expect(
          results[0]
            ?.totalDisorders,
        ).toBe(4);

        expect(
          results[0]
            ?.feedResolution,
        ).toBe("RESOLVED");
      },
    );

    it(
      "marks an asset without canonical feed metadata as PARTIAL",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],
            [],
            "TSLA",
          );

        expect(
          results[0]?.monitoring,
        ).toBe("PARTIAL");

        expect(
          results[0]
            ?.supportedDisorders,
        ).toBe(2);

        expect(
          results[0]
            ?.totalDisorders,
        ).toBe(4);

        expect(
          results[0]
            ?.feedResolution,
        ).toBe("MISSING");
      },
    );

    it(
      "does not silently choose an ambiguous canonical feed",
      () => {
        const results =
          searchRobinhoodAssetDirectory(
            [asset({})],

            [
              feed(),

              feed({
                proxyAddress:
                  "0x4444444444444444444444444444444444444444",
              }),
            ],

            "TSLA",
          );

        expect(
          results[0]?.monitoring,
        ).toBe("PARTIAL");

        expect(
          results[0]
            ?.feedResolution,
        ).toBe("AMBIGUOUS");
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
                    networkName:
                      "Ethereum",
                  },
                ],
              }),
            ],

            [feed()],

            "TSLA",
          );

        expect(
          results,
        ).toEqual([]);
      },
    );
  },
);
