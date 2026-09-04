export interface RegistryUpdatePayload {
  asset: string;
  disorderScore: number;
  disorderBitmap: bigint;
  evidenceHash: `0x${string}`;
  rulesetHash: `0x${string}`;
}

export interface PublishResult {
  transactionHash: `0x${string}`;
}

export interface RegistryPublisher {
  publish(update: RegistryUpdatePayload): Promise<PublishResult>;
}
