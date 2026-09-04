import Fastify from "fastify";

import {
  MAD_ASSETS,
  getAssetById,
} from "../assets/catalog.js";

import {
  readMADOnchainSnapshot,
  type MADOnchainSnapshot,
} from "../read/registryReader.js";

export interface MADApiDependencies {
  readSnapshot?: (config: {
    registryAddress: string;
    assetAddress: string;
    rpcUrl: string;
  }) => Promise<MADOnchainSnapshot>;

  logger?: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

export function createMADApi(
  dependencies: MADApiDependencies = {},
) {
  const readSnapshot =
    dependencies.readSnapshot ??
    readMADOnchainSnapshot;

  const app = Fastify({
    logger: dependencies.logger ?? true,
  });

  app.get("/health", async () => {
    return {
      service: "MAD API",
      status: "ok",
    };
  });

  app.get("/api/v1/assets", async () => {
    return {
      assets: MAD_ASSETS,
    };
  });

  app.get<{
    Params: {
      assetId: string;
    };
  }>(
    "/api/v1/assets/:assetId/state",
    async (request, reply) => {
      const asset = getAssetById(
        request.params.assetId,
      );

      if (!asset) {
        return reply.code(404).send({
          error: "MAD_ASSET_NOT_FOUND",
          message:
            "The requested asset is not monitored by MAD.",
        });
      }

      const snapshot =
        await readSnapshot({
          registryAddress:
            requireEnv("MAD_REGISTRY"),
          assetAddress: asset.address,
          rpcUrl:
            requireEnv(
              "ROBINHOOD_TESTNET_RPC",
            ),
        });

      return {
        asset: {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          address: asset.address,
          chainId: asset.chainId,
          underlyingSymbol:
            asset.underlyingSymbol ?? null,
        },

        mad: snapshot.mad,
        provenance: snapshot.provenance,
        network: snapshot.network,
      };
    },
  );

  return app;
}
