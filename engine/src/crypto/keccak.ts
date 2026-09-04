import { keccak256, stringToBytes } from "viem";

export function keccakUtf8(value: string): `0x${string}` {
  return keccak256(stringToBytes(value));
}
