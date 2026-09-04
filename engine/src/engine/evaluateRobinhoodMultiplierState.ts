import type {
  RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  getRobinhoodAssetBySymbol,
} from "../adapters/robinhood/assets.js";

import type {
  RobinhoodOnchainMultiplier,
} from "../adapters/robinhood/onchainMultiplier.js";

import {
  readRobinhoodUiMultiplier,
} from "../adapters/robinhood/onchainMultiplier.js";

import {
  normaliseRobinhoodStockToken,
} from "../domain/stockTokenState.js";

import {
  evaluateMultiplierTransition,
} from "../disorders/multiplierTransition.js";

type AssetLookup = (
  symbol: string,
) => Promise<RobinhoodStockTokenAsset | undefined>;

type MultiplierReader = (config: {
  contractAddress: string;
  rpcUrl: string;
}) => Promise<RobinhoodOnchainMultiplier>;

export interface RobinhoodMultiplierStateDependencies {
  getAsset?: AssetLookup;
  readMultiplier?: MultiplierReader;
}

export async function evaluateRobinhoodMultiplierState(
  input: {
    symbol: string;
    rpcUrl: string;
  },
  dependencies: RobinhoodMultiplierStateDependencies = {},
) {
  const getAsset =
    dependencies.getAsset ??
    ((symbol: string) =>
      getRobinhoodAssetBySymbol(symbol));

  const readMultiplier =
    dependencies.readMultiplier ??
    readRobinhoodUiMultiplier;

  const rawAsset =
    await getAsset(input.symbol);

  if (!rawAsset) {
    throw new Error(
      `Robinhood Stock Token not found: ${input.symbol}`,
    );
  }

  const stockToken =
    normaliseRobinhoodStockToken(rawAsset);

  const onchain =
    await readMultiplier({
      contractAddress:
        stockToken.deployment.contractAddress,
      rpcUrl: input.rpcUrl,
    });

  const evaluation =
    evaluateMultiplierTransition({
      expectedCurrentE18:
        BigInt(
          stockToken.multiplier.currentE18,
        ),

      observedOnchainE18:
        onchain.valueE18,

      pendingE18:
        stockToken.multiplier.pendingE18 === null
          ? null
          : BigInt(
              stockToken.multiplier.pendingE18,
            ),
    });

  return {
    asset: {
      symbol: stockToken.asset.symbol,
      name: stockToken.asset.name,
      assetId: stockToken.asset.assetId,
      isin: stockToken.asset.isin,
      contractAddress:
        stockToken.deployment.contractAddress,
      chainId:
        stockToken.deployment.chainId,
    },

    sources: {
      robinhoodApi: {
        currentMultiplier:
          stockToken.multiplier.current,
        currentMultiplierE18:
          stockToken.multiplier.currentE18,
        pendingMultiplier:
          stockToken.multiplier.pending,
        pendingMultiplierE18:
          stockToken.multiplier.pendingE18,
      },

      robinhoodChain: {
        uiMultiplierE18:
          onchain.valueE18String,
      },
    },

    evaluation,
  };
}
