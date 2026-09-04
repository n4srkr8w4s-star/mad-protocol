import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
} from "viem";

const AGGREGATOR_V3_ABI = [
  {
    type: "function",
    name: "description",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "latestRoundData",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

export interface RobinhoodOracleState {
  feedAddress: string;
  description: string;
  decimals: number;

  roundId: string;

  answer: bigint;
  answerRaw: string;
  price: string;

  startedAtUnix: string;
  updatedAtUnix: string;

  startedAtIso: string;
  updatedAtIso: string;

  answeredInRound: string;
}

export interface RawRobinhoodOracleState {
  feedAddress: string;
  description: string;
  decimals: number;

  roundId: bigint;
  answer: bigint;
  startedAt: bigint;
  updatedAt: bigint;
  answeredInRound: bigint;
}

export function normaliseRobinhoodOracle(
  raw: RawRobinhoodOracleState,
): RobinhoodOracleState {
  const feedAddress =
    getAddress(raw.feedAddress);

  if (
    !Number.isInteger(raw.decimals) ||
    raw.decimals < 0
  ) {
    throw new Error(
      "Oracle decimals must be a non-negative integer",
    );
  }

  if (raw.answer <= 0n) {
    throw new Error(
      `Invalid oracle answer for ${feedAddress}`,
    );
  }

  if (raw.updatedAt <= 0n) {
    throw new Error(
      `Oracle has no valid update timestamp for ${feedAddress}`,
    );
  }

  if (
    raw.answeredInRound < raw.roundId
  ) {
    throw new Error(
      `Oracle answeredInRound is behind roundId for ${feedAddress}`,
    );
  }

  return {
    feedAddress,

    description:
      raw.description,

    decimals:
      raw.decimals,

    roundId:
      raw.roundId.toString(),

    answer:
      raw.answer,

    answerRaw:
      raw.answer.toString(),

    price:
      formatUnits(
        raw.answer,
        raw.decimals,
      ),

    startedAtUnix:
      raw.startedAt.toString(),

    updatedAtUnix:
      raw.updatedAt.toString(),

    startedAtIso:
      new Date(
        Number(raw.startedAt) * 1000,
      ).toISOString(),

    updatedAtIso:
      new Date(
        Number(raw.updatedAt) * 1000,
      ).toISOString(),

    answeredInRound:
      raw.answeredInRound.toString(),
  };
}

export async function readRobinhoodOracle(
  config: {
    feedAddress: string;
    rpcUrl: string;
  },
): Promise<RobinhoodOracleState> {
  const feedAddress =
    getAddress(config.feedAddress);

  const client =
    createPublicClient({
      transport:
        http(config.rpcUrl),
    });

  const [
    description,
    decimals,
    round,
  ] = await Promise.all([
    client.readContract({
      address: feedAddress,
      abi: AGGREGATOR_V3_ABI,
      functionName: "description",
    }),

    client.readContract({
      address: feedAddress,
      abi: AGGREGATOR_V3_ABI,
      functionName: "decimals",
    }),

    client.readContract({
      address: feedAddress,
      abi: AGGREGATOR_V3_ABI,
      functionName:
        "latestRoundData",
    }),
  ]);

  const [
    roundId,
    answer,
    startedAt,
    updatedAt,
    answeredInRound,
  ] = round;

  return normaliseRobinhoodOracle({
    feedAddress,
    description,
    decimals,
    roundId,
    answer,
    startedAt,
    updatedAt,
    answeredInRound,
  });
}
