import {
  describe,
  expect,
  it,
} from "vitest";

import {
  scanRobinhoodUniverse,
} from "../src/engine/scanRobinhoodUniverse.js";

const BASE_ASSET = {
  id: "asset",
  tokenSymbol: "AAA",
  tokenName:
    "AAA • Robinhood Token",
  deployments: [
    {
      contractAddress:
        "0x1111111111111111111111111111111111111111",
      chainId: 4663,
      networkName:
        "Robinhood Chain",
    },
  ],
  currentMultiplier:
    "1.000000000000000000",
  pendingMultiplier: "",
  status:
    "ASSET_STATUS_ACTIVE",
  logoUrl: "",
  tradingCapabilities: {
    market: {
      whole: "TRADABLE",
      fractional: "TRADABLE",
    },
    extended: {
      whole: "TRADABLE",
      fractional: "TRADABLE",
    },
    overnight: {
      whole: "TRADABLE",
      fractional: "TRADABLE",
    },
  },
  tokenDecimals: 18,
  isin: "AAA-ISIN",
};

const BASE_FEED = {
  name:
    "Robinhood AAA / USD",
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
    "AAA",
  quoteAsset:
    "USD",
  marketHours:
    "us_equities_24/5",
  productType:
    "Price",
  productTypeCode:
    "primaryTokenizedPrice",
};

describe(
  "Robinhood universe scanner",
  () => {
    it(
      "fetches each directory exactly once",
      async () => {
        let assetCalls = 0;
        let feedCalls = 0;

        await scanRobinhoodUniverse({
          getAssets:
            async () => {
              assetCalls += 1;
              return [BASE_ASSET];
            },

          getFeeds:
            async () => {
              feedCalls += 1;
              return [BASE_FEED];
            },
        });

        expect(assetCalls).toBe(1);
        expect(feedCalls).toBe(1);
      },
    );

    it(
      "classifies the entire universe in one scan",
      async () => {
        const result =
          await scanRobinhoodUniverse({
            getAssets:
              async () => [
                BASE_ASSET,

                {
                  ...BASE_ASSET,
                  id: "bbb",
                  tokenSymbol: "BBB",
                  tokenName:
                    "BBB • Robinhood Token",
                  isin: "BBB-ISIN",
                },

                {
                  ...BASE_ASSET,
                  id: "ccc",
                  tokenSymbol: "CCC",
                  tokenName:
                    "CCC • Robinhood Token",
                  isin: "CCC-ISIN",
                  deployments: [],
                },
              ],

            getFeeds:
              async () => [
                BASE_FEED,
              ],
          });

        expect(
          result.counts,
        ).toMatchObject({
          discovered: 3,
          full: 1,
          partial: 1,
          discoverable: 1,
        });
      },
    );

    it(
      "matches feed symbols case-insensitively",
      async () => {
        const result =
          await scanRobinhoodUniverse({
            getAssets:
              async () => [
                BASE_ASSET,
              ],

            getFeeds:
              async () => [
                {
                  ...BASE_FEED,
                  baseAsset:
                    "aaa",
                },
              ],
          });

        expect(
          result.assets[0]
            ?.feedResolution,
        ).toBe("RESOLVED");

        expect(
          result.assets[0]
            ?.capability.capability,
        ).toBe("FULL");
      },
    );

    it(
      "does not silently choose an ambiguous feed",
      async () => {
        const result =
          await scanRobinhoodUniverse({
            getAssets:
              async () => [
                BASE_ASSET,
              ],

            getFeeds:
              async () => [
                BASE_FEED,
                {
                  ...BASE_FEED,
                  proxyAddress:
                    "0x4444444444444444444444444444444444444444",
                },
              ],
          });

        expect(
          result.counts
            .ambiguousFeeds,
        ).toBe(1);

        expect(
          result.assets[0]
            ?.feedResolution,
        ).toBe("AMBIGUOUS");

        expect(
          result.assets[0]
            ?.capability.capability,
        ).toBe("PARTIAL");
      },
    );
  },
);
