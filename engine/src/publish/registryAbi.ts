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
  {
    type: "function",
    name: "getState",
    stateMutability: "view",
    inputs: [
      { name: "asset", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "disorderScore", type: "uint8" },
          { name: "severity", type: "uint8" },
          { name: "disorderBitmap", type: "uint256" },
          { name: "evidenceHash", type: "bytes32" },
          { name: "rulesetHash", type: "bytes32" },
          { name: "updatedAt", type: "uint256" },
          { name: "sequence", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "isDisordered",
    stateMutability: "view",
    inputs: [
      { name: "asset", type: "address" },
    ],
    outputs: [
      { name: "", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "latestSequence",
    stateMutability: "view",
    inputs: [
      { name: "asset", type: "address" },
    ],
    outputs: [
      { name: "", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "supportedAssets",
    stateMutability: "view",
    inputs: [
      { name: "asset", type: "address" },
    ],
    outputs: [
      { name: "", type: "bool" },
    ],
  },
] as const;
