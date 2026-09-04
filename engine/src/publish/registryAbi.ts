export const MAD_STATE_REGISTRY_ABI = [
  {
    type: "function",
    name: "updateState",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "disorderScore", type: "uint8" },
      { name: "disorderBitmap", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
      { name: "rulesetHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;
