import {
  createPublicClient,
  getAddress,
  http,
} from "viem";

const STOCK_TOKEN_MULTIPLIER_ABI = [
  {
    type: "function",
    name: "uiMultiplier",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
] as const;

export interface RobinhoodOnchainMultiplier {
  contractAddress: string;
  valueE18: bigint;
  valueE18String: string;
}

export async function readRobinhoodUiMultiplier(
  config: {
    contractAddress: string;
    rpcUrl: string;
  },
): Promise<RobinhoodOnchainMultiplier> {
  const contractAddress =
    getAddress(config.contractAddress);

  const client = createPublicClient({
    transport: http(config.rpcUrl),
  });

  const valueE18 =
    await client.readContract({
      address: contractAddress,
      abi: STOCK_TOKEN_MULTIPLIER_ABI,
      functionName: "uiMultiplier",
    });

  if (valueE18 <= 0n) {
    throw new Error(
      `Invalid Robinhood uiMultiplier for ${contractAddress}`,
    );
  }

  return {
    contractAddress,
    valueE18,
    valueE18String: valueE18.toString(),
  };
}
