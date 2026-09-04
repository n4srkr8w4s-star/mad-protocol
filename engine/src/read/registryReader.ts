import {
  createPublicClient,
  getAddress,
  http,
} from "viem";

import {
  ActiveDisorderId,
  MADSeverity,
} from "../domain/types.js";

import { MAD_STATE_REGISTRY_ABI } from "../publish/registryAbi.js";

const DISORDER_NAMES: Record<ActiveDisorderId, string> = {
  [ActiveDisorderId.PRICE_DISLOCATION]:
    "PRICE_DISLOCATION",
  [ActiveDisorderId.UNDERLYING_TRADING_HALT]:
    "UNDERLYING_TRADING_HALT",
  [ActiveDisorderId.CORPORATE_ACTION_PENDING]:
    "CORPORATE_ACTION_PENDING",
  [ActiveDisorderId.MULTIPLIER_TRANSITION]:
    "MULTIPLIER_TRANSITION",
  [ActiveDisorderId.REFERENCE_DATA_STALE]:
    "REFERENCE_DATA_STALE",
  [ActiveDisorderId.LIQUIDITY_STRESS]:
    "LIQUIDITY_STRESS",
  [ActiveDisorderId.MARKET_SESSION_DISLOCATION]:
    "MARKET_SESSION_DISLOCATION",
  [ActiveDisorderId.ORACLE_DEVIATION]:
    "ORACLE_DEVIATION",
};

export interface ActiveDisorderSnapshot {
  id: number;
  code: string;
}

export interface MADOnchainSnapshot {
  asset: {
    address: string;
    supported: boolean;
  };

  mad: {
    score: number;
    severityCode: number;
    severity: string;
    isDisordered: boolean;
    disorderBitmap: string;
    activeDisorders: ActiveDisorderSnapshot[];
    sequence: string;
  };

  provenance: {
    evidenceHash: string;
    rulesetHash: string;
    updatedAtUnix: string;
    updatedAtIso: string;
  };

  network: {
    name: "Robinhood Chain Testnet";
    chainId: 46630;
    registry: string;
  };
}

export function decodeActiveDisorders(
  bitmap: bigint,
): ActiveDisorderSnapshot[] {
  const active: ActiveDisorderSnapshot[] = [];

  for (let id = 0; id <= 7; id += 1) {
    if ((bitmap & (1n << BigInt(id))) !== 0n) {
      const disorderId = id as ActiveDisorderId;

      active.push({
        id,
        code: DISORDER_NAMES[disorderId],
      });
    }
  }

  return active;
}

export async function readMADOnchainSnapshot(config: {
  registryAddress: string;
  assetAddress: string;
  rpcUrl: string;
}): Promise<MADOnchainSnapshot> {
  const registryAddress = getAddress(
    config.registryAddress,
  );

  const assetAddress = getAddress(
    config.assetAddress,
  );

  const client = createPublicClient({
    transport: http(config.rpcUrl),
  });

  const supported = await client.readContract({
    address: registryAddress,
    abi: MAD_STATE_REGISTRY_ABI,
    functionName: "supportedAssets",
    args: [assetAddress],
  });

  if (!supported) {
    throw new Error(
      `Asset ${assetAddress} is not supported by MAD`,
    );
  }

  const [
    state,
    isDisordered,
    latestSequence,
  ] = await Promise.all([
    client.readContract({
      address: registryAddress,
      abi: MAD_STATE_REGISTRY_ABI,
      functionName: "getState",
      args: [assetAddress],
    }),

    client.readContract({
      address: registryAddress,
      abi: MAD_STATE_REGISTRY_ABI,
      functionName: "isDisordered",
      args: [assetAddress],
    }),

    client.readContract({
      address: registryAddress,
      abi: MAD_STATE_REGISTRY_ABI,
      functionName: "latestSequence",
      args: [assetAddress],
    }),
  ]);

  const severityCode = Number(state.severity);
  const updatedAtUnix = state.updatedAt.toString();

  if (state.sequence !== latestSequence) {
    throw new Error(
      "MAD registry sequence mismatch",
    );
  }

  return {
    asset: {
      address: assetAddress,
      supported,
    },

    mad: {
      score: Number(state.disorderScore),
      severityCode,
      severity:
        MADSeverity[severityCode] ?? "UNKNOWN",
      isDisordered,
      disorderBitmap:
        state.disorderBitmap.toString(),
      activeDisorders:
        decodeActiveDisorders(
          state.disorderBitmap,
        ),
      sequence: state.sequence.toString(),
    },

    provenance: {
      evidenceHash: state.evidenceHash,
      rulesetHash: state.rulesetHash,
      updatedAtUnix,
      updatedAtIso: new Date(
        Number(state.updatedAt) * 1000,
      ).toISOString(),
    },

    network: {
      name: "Robinhood Chain Testnet",
      chainId: 46630,
      registry: registryAddress,
    },
  };
}
