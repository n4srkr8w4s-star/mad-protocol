import type {
  RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  getRobinhoodAssetBySymbol,
} from "../adapters/robinhood/assets.js";

import type {
  RobinhoodPriceQuote,
} from "../adapters/robinhood/prices.js";

import {
  fetchRobinhoodPrice,
  normaliseRobinhoodPrice,
} from "../adapters/robinhood/prices.js";

import type {
  RobinhoodOracleState,
} from "../adapters/robinhood/oracle.js";

import {
  readRobinhoodOracle,
} from "../adapters/robinhood/oracle.js";

import {
  normaliseRobinhoodStockToken,
} from "../domain/stockTokenState.js";

import {
  evaluateOracleDeviation,
} from "../disorders/oracleDeviation.js";

type AssetLookup = (
  symbol: string,
) => Promise<RobinhoodStockTokenAsset | undefined>;

type PriceLookup = (
  symbol: string,
) => Promise<RobinhoodPriceQuote>;

type OracleReader = (config: {
  feedAddress: string;
  rpcUrl: string;
}) => Promise<RobinhoodOracleState>;

export interface RobinhoodPriceCoherenceDependencies {
  getAsset?: AssetLookup;
  getPrice?: PriceLookup;
  readOracle?: OracleReader;
}

export async function evaluateRobinhoodPriceCoherence(
  input: {
    symbol: string;
    feedAddress: string;
    rpcUrl: string;
  },
  dependencies: RobinhoodPriceCoherenceDependencies = {},
) {
  const getAsset =
    dependencies.getAsset ??
    ((symbol: string) =>
      getRobinhoodAssetBySymbol(symbol));

  const getPrice =
    dependencies.getPrice ??
    ((symbol: string) =>
      fetchRobinhoodPrice(symbol));

  const readOracle =
    dependencies.readOracle ??
    readRobinhoodOracle;

  const [
    rawAsset,
    rawPrice,
  ] = await Promise.all([
    getAsset(input.symbol),
    getPrice(input.symbol),
  ]);

  if (!rawAsset) {
    throw new Error(
      `Robinhood Stock Token not found: ${input.symbol}`,
    );
  }

  const stockToken =
    normaliseRobinhoodStockToken(rawAsset);

  const underlying =
    normaliseRobinhoodPrice(rawPrice);

  const priceDeployment =
    rawPrice.deployments.find(
      (deployment) =>
        deployment.chainId ===
        stockToken.deployment.chainId,
    );

  if (!priceDeployment) {
    throw new Error(
      `${stockToken.asset.symbol} price quote has no Robinhood Chain deployment`,
    );
  }

  if (
    priceDeployment.contractAddress.toLowerCase() !==
    stockToken.deployment.contractAddress.toLowerCase()
  ) {
    throw new Error(
      `${stockToken.asset.symbol} deployment mismatch between Robinhood assets and prices`,
    );
  }

  const oracle =
    await readOracle({
      feedAddress: input.feedAddress,
      rpcUrl: input.rpcUrl,
    });

  const evaluation =
    evaluateOracleDeviation({
      underlyingMidpointE6:
        underlying.midpointE6,

      multiplierE18:
        BigInt(
          stockToken.multiplier.currentE18,
        ),

      oracleAnswer:
        oracle.answer,

      oracleDecimals:
        oracle.decimals,
    });

  return {
    asset: {
      symbol:
        stockToken.asset.symbol,

      name:
        stockToken.asset.name,

      isin:
        stockToken.asset.isin,

      contractAddress:
        stockToken.deployment.contractAddress,

      chainId:
        stockToken.deployment.chainId,
    },

    sources: {
      robinhoodAsset: {
        currentMultiplier:
          stockToken.multiplier.current,

        currentMultiplierE18:
          stockToken.multiplier.currentE18,

        pendingMultiplier:
          stockToken.multiplier.pending,
      },

      robinhoodPrice: {
        bid:
          underlying.bid,

        ask:
          underlying.ask,

        midpointE6:
          underlying.midpointE6.toString(),

        currency:
          underlying.currency,

        generatedAt:
          underlying.generatedAt,

        isTradingHalt:
          underlying.isTradingHalt,
      },

      robinhoodOracle: {
        feedAddress:
          oracle.feedAddress,

        description:
          oracle.description,

        price:
          oracle.price,

        answerRaw:
          oracle.answerRaw,

        decimals:
          oracle.decimals,

        updatedAt:
          oracle.updatedAtIso,
      },
    },

    evaluation,
  };
}
