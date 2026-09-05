import Fastify from "fastify";
import cors from "@fastify/cors";

import {
  MAD_ASSETS,
  getAssetById,
} from "../assets/catalog.js";

import {
  searchRobinhoodAssets,
} from "../assets/discovery.js";

import {
  readMADOnchainSnapshot,
  type MADOnchainSnapshot,
} from "../read/registryReader.js";

import {
  evaluateRobinhoodCompositeState,
} from "../engine/evaluateRobinhoodCompositeState.js";

import {
  presentRobinhoodCompositeState,
} from "./presenters.js";

export interface MADApiDependencies {
  readSnapshot?: (config: {
    registryAddress: string;
    assetAddress: string;
    rpcUrl: string;
  }) => Promise<MADOnchainSnapshot>;

  evaluateRobinhoodComposite?: typeof evaluateRobinhoodCompositeState;
  searchRobinhoodAssets?: typeof searchRobinhoodAssets;

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

  const evaluateRobinhoodComposite =
    dependencies.evaluateRobinhoodComposite ??
    evaluateRobinhoodCompositeState;

  const searchAssets =
    dependencies.searchRobinhoodAssets ??
    searchRobinhoodAssets;

  const app = Fastify({
    logger: dependencies.logger ?? true,
  });

  app.register(cors, {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    methods: ["GET"],
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
    Querystring: {
      q?: string;
    };
  }>(
    "/api/v1/assets/search",
    async (request, reply) => {
      const query =
        request.query.q?.trim();

      if (!query) {
        return reply.code(400).send({
          error: "MAD_SEARCH_QUERY_REQUIRED",
          message:
            "A non-empty search query is required.",
        });
      }

      const results =
        await searchAssets(query);

      return {
        query,
        count: results.length,
        results,
      };
    },
  );

  app.get<{
    Params: {
      assetId: string;
    };
  }>(
    "/api/v1/assets/:assetId/state",
    async (request, reply) => {
      const asset =
        getAssetById(
          request.params.assetId,
        );

      if (!asset) {
        return reply.code(404).send({
          error: "MAD_ASSET_NOT_FOUND",
          message:
            "The requested asset is not monitored by MAD.",
        });
      }

      if (
        asset.type ===
        "ROBINHOOD_STOCK_TOKEN"
      ) {
        const composite =
          await evaluateRobinhoodComposite({
            symbol: asset.symbol,
            rpcUrl:
              process.env
                .ROBINHOOD_MAINNET_RPC ??
              "https://rpc.mainnet.chain.robinhood.com",
          });

        return presentRobinhoodCompositeState(
          asset,
          composite,
        );
      }

      const snapshot =
        await readSnapshot({
          registryAddress:
            requireEnv("MAD_REGISTRY"),
          assetAddress:
            asset.address,
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
        provenance:
          snapshot.provenance,
        network:
          snapshot.network,
      };
    },
  );

  return app;
}
