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
  RobinhoodOnchainMultiplier,
} from "../adapters/robinhood/onchainMultiplier.js";

import {
  readRobinhoodUiMultiplier,
} from "../adapters/robinhood/onchainMultiplier.js";

import type {
  RobinhoodOracleState,
} from "../adapters/robinhood/oracle.js";

import {
  readRobinhoodOracle,
} from "../adapters/robinhood/oracle.js";

import {
  ActiveDisorderId,
} from "../domain/types.js";

import {
  normaliseRobinhoodStockToken,
} from "../domain/stockTokenState.js";

import {
  evaluateMultiplierTransition,
} from "../disorders/multiplierTransition.js";

import {
  evaluateOracleDeviation,
} from "../disorders/oracleDeviation.js";

import {
  aggregateDisorders,
} from "./aggregateDisorders.js";

import {
  observeSourceTiming,
} from "./sourceTiming.js";

type AssetLookup = (
  symbol: string,
) => Promise<RobinhoodStockTokenAsset | undefined>;

type PriceLookup = (
  symbol: string,
) => Promise<RobinhoodPriceQuote>;

type MultiplierReader = (config: {
  contractAddress: string;
  rpcUrl: string;
}) => Promise<RobinhoodOnchainMultiplier>;

type OracleReader = (config: {
  feedAddress: string;
  rpcUrl: string;
}) => Promise<RobinhoodOracleState>;

export interface RobinhoodCompositeDependencies {
  getAsset?: AssetLookup;
  getPrice?: PriceLookup;
  readMultiplier?: MultiplierReader;
  readOracle?: OracleReader;
}

export async function evaluateRobinhoodCompositeState(
  input: {
    symbol: string;
    feedAddress: string;
    rpcUrl: string;
    evaluationTimeUnix?: bigint;
  },
  dependencies: RobinhoodCompositeDependencies = {},
) {
  const getAsset =
    dependencies.getAsset ??
    ((symbol: string) =>
      getRobinhoodAssetBySymbol(symbol));

  const getPrice =
    dependencies.getPrice ??
    ((symbol: string) =>
      fetchRobinhoodPrice(symbol));

  const readMultiplier =
    dependencies.readMultiplier ??
    readRobinhoodUiMultiplier;

  const readOracle =
    dependencies.readOracle ??
    readRobinhoodOracle;

  /*
   * One observation cycle:
   * fetch each external source once.
   */
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

  const [
    onchainMultiplier,
    oracle,
  ] = await Promise.all([
    readMultiplier({
      contractAddress:
        stockToken.deployment.contractAddress,
      rpcUrl: input.rpcUrl,
    }),

    readOracle({
      feedAddress: input.feedAddress,
      rpcUrl: input.rpcUrl,
    }),
  ]);

  const multiplierEvaluation =
    evaluateMultiplierTransition({
      expectedCurrentE18:
        BigInt(
          stockToken.multiplier.currentE18,
        ),

      observedOnchainE18:
        onchainMultiplier.valueE18,

      pendingE18:
        stockToken.multiplier.pendingE18 === null
          ? null
          : BigInt(
              stockToken.multiplier.pendingE18,
            ),
    });

  const oracleEvaluation =
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

  const composite =
    aggregateDisorders([
      multiplierEvaluation,
      oracleEvaluation,
    ]);

  const evaluationTimeUnix =
    input.evaluationTimeUnix ??
    BigInt(
      Math.floor(Date.now() / 1000),
    );

  const timing =
    observeSourceTiming({
      evaluationTimeUnix,

      robinhoodPriceGeneratedAt:
        underlying.generatedAt,

      oracleUpdatedAtUnix:
        BigInt(
          oracle.updatedAtUnix,
        ),
    });

  return {
    asset: {
      symbol:
        stockToken.asset.symbol,

      name:
        stockToken.asset.name,

      assetId:
        stockToken.asset.assetId,

      isin:
        stockToken.asset.isin,

      status:
        stockToken.asset.status,

      contractAddress:
        stockToken.deployment.contractAddress,

      chainId:
        stockToken.deployment.chainId,
    },

    observations: {
      underlying: {
        bid:
          underlying.bid,

        ask:
          underlying.ask,

        midpointE6:
          underlying.midpointE6.toString(),

        currency:
          underlying.currency,

        isTradingHalt:
          underlying.isTradingHalt,

        generatedAt:
          underlying.generatedAt,
      },

      multiplier: {
        robinhoodApi:
          stockToken.multiplier.current,

        robinhoodApiE18:
          stockToken.multiplier.currentE18,

        onchainE18:
          onchainMultiplier.valueE18String,

        pending:
          stockToken.multiplier.pending,
      },

      oracle: {
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

      timing,
    },

    disorders: {
      assessed: [
        {
          id:
            ActiveDisorderId.MULTIPLIER_TRANSITION,

          code:
            "MULTIPLIER_TRANSITION",

          evaluation:
            multiplierEvaluation,
        },

        {
          id:
            ActiveDisorderId.ORACLE_DEVIATION,

          code:
            "ORACLE_DEVIATION",

          evaluation:
            oracleEvaluation,
        },
      ],

      unassessed: [
        {
          id:
            ActiveDisorderId.UNDERLYING_TRADING_HALT,

          code:
            "UNDERLYING_TRADING_HALT",

          reason:
            "Source observation is available, but the MAD evaluator has not yet been applied.",
        },

        {
          id:
            ActiveDisorderId.REFERENCE_DATA_STALE,

          code:
            "REFERENCE_DATA_STALE",

          reason:
            "Source timing is measured, but no production freshness policy is configured yet.",
        },
      ],
    },

    mad: {
      disorderScore:
        composite.disorderScore,

      severity:
        composite.severity,

      disorderBitmap:
        composite.disorderBitmap,

      activeDisorders:
        composite.activeDisorders,

      assessedDisorders:
        composite.assessedDisorders,

      unassessedDisorders: 2,
    },
  };
}
