import { parseUnits } from "viem";

import type {
  RobinhoodStockTokenAsset,
} from "../adapters/robinhood/assets.js";

import {
  getRobinhoodChainDeployment,
} from "../adapters/robinhood/assets.js";

export interface MADStockTokenState {
  asset: {
    source: "ROBINHOOD";
    assetId: string;
    symbol: string;
    name: string;
    isin: string;
    decimals: number;
    status: string;
  };

  deployment: {
    networkName: string;
    chainId: number;
    contractAddress: string;
  };

  multiplier: {
    current: string;
    currentE18: string;
    pending: string | null;
    pendingE18: string | null;
    transitionPending: boolean;
  };

  trading: {
    market: {
      whole: string;
      fractional: string;
    };
    extended: {
      whole: string;
      fractional: string;
    };
    overnight: {
      whole: string;
      fractional: string;
    };
  };
}

function multiplierToE18(
  value: string,
): string {
  if (!value) {
    throw new Error(
      "Multiplier must not be empty",
    );
  }

  const parsed = parseUnits(value, 18);

  if (parsed <= 0n) {
    throw new Error(
      "Multiplier must be greater than zero",
    );
  }

  return parsed.toString();
}

export function normaliseRobinhoodStockToken(
  asset: RobinhoodStockTokenAsset,
): MADStockTokenState {
  const deployment =
    getRobinhoodChainDeployment(asset, 4663);

  if (!deployment) {
    throw new Error(
      `${asset.tokenSymbol} has no Robinhood Chain mainnet deployment`,
    );
  }

  const pending =
    asset.pendingMultiplier.trim() === ""
      ? null
      : asset.pendingMultiplier;

  return {
    asset: {
      source: "ROBINHOOD",
      assetId: asset.id,
      symbol: asset.tokenSymbol,
      name: asset.tokenName,
      isin: asset.isin,
      decimals: asset.tokenDecimals,
      status: asset.status,
    },

    deployment: {
      networkName: deployment.networkName,
      chainId: deployment.chainId,
      contractAddress:
        deployment.contractAddress,
    },

    multiplier: {
      current: asset.currentMultiplier,
      currentE18:
        multiplierToE18(
          asset.currentMultiplier,
        ),
      pending,
      pendingE18:
        pending === null
          ? null
          : multiplierToE18(pending),
      transitionPending:
        pending !== null,
    },

    trading: {
      market: {
        whole:
          asset.tradingCapabilities.market.whole,
        fractional:
          asset.tradingCapabilities.market.fractional,
      },

      extended: {
        whole:
          asset.tradingCapabilities.extended.whole,
        fractional:
          asset.tradingCapabilities.extended.fractional,
      },

      overnight: {
        whole:
          asset.tradingCapabilities.overnight.whole,
        fractional:
          asset.tradingCapabilities.overnight.fractional,
      },
    },
  };
}
