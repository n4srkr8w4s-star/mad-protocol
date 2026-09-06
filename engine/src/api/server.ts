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
  resolveRobinhoodCapability,
  type RobinhoodAssetCapability,
} from "../engine/resolveRobinhoodCapability.js";

import {
  scanRobinhoodUniverse,
} from "../engine/scanRobinhoodUniverse.js";

import {
  createMADRadarSnapshotProvider,
} from "../engine/madRadarSnapshotProvider.js";

import type {
  MADRadarInput,
  MADRadarSnapshot,
} from "../engine/buildMADRadar.js";

import {
  presentRobinhoodCompositeState,
} from "./presenters.js";

type ApiAssetCapability =
  Pick<
    RobinhoodAssetCapability,
    | "symbol"
    | "name"
    | "assetId"
    | "capability"
    | "supportedDisorders"
    | "totalDisorders"
  >;

export interface MADApiDependencies {
  readSnapshot?: (config: {
    registryAddress: string;
    assetAddress: string;
    rpcUrl: string;
  }) => Promise<MADOnchainSnapshot>;

  evaluateRobinhoodComposite?: typeof evaluateRobinhoodCompositeState;
  resolveRobinhoodCapability?: (
    symbol: string,
  ) => Promise<ApiAssetCapability | undefined>;
  searchRobinhoodAssets?: typeof searchRobinhoodAssets;
  scanRobinhoodUniverse?: typeof scanRobinhoodUniverse;
  getRadarSnapshot?: (
    input: MADRadarInput,
  ) => Promise<MADRadarSnapshot>;

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

function allowedCorsOrigins(): string[] {
  const configured =
    process.env.MAD_CORS_ORIGINS
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

  if (
    configured &&
    configured.length > 0
  ) {
    return configured;
  }

  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
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

  const resolveCapability =
    dependencies.resolveRobinhoodCapability ??
    resolveRobinhoodCapability;

  const searchAssets =
    dependencies.searchRobinhoodAssets ??
    searchRobinhoodAssets;

  const scanUniverse =
    dependencies.scanRobinhoodUniverse ??
    scanRobinhoodUniverse;

  const radarProvider =
    createMADRadarSnapshotProvider({
      ttlMs: 60_000,
    });

  const getRadarSnapshot =
    dependencies.getRadarSnapshot ??
    ((input: MADRadarInput) =>
      radarProvider.getSnapshot(input));

  const app = Fastify({
    logger: dependencies.logger ?? true,
  });

  app.register(cors, {
    origin:
      allowedCorsOrigins(),
    methods: ["GET"],
  });

  app.get("/health", async () => {
    return {
      service: "MAD API",
      status: "ok",
    };
  });

  app.get(
    "/api/v1/radar",
    async () => {
      return getRadarSnapshot({
        rpcUrl:
          process.env
            .ROBINHOOD_MAINNET_RPC ??
          "https://rpc.mainnet.chain.robinhood.com",

        concurrency: 4,
      });
    },
  );

  app.get("/api/v1/assets", async () => {
    const universe =
      await scanUniverse();

    const robinhoodAssets =
      universe.assets.map(
        ({
          capability,
          feedResolution,
        }) => ({
          id:
            capability.symbol.toLowerCase(),

          symbol:
            capability.symbol,

          name:
            capability.name,

          type:
            "ROBINHOOD_STOCK_TOKEN",

          address:
            capability.deployment?.address ??
            null,

          chainId:
            capability.deployment?.chainId ??
            null,

          underlyingSymbol:
            capability.symbol,

          robinhoodAssetId:
            capability.assetId,

          isin:
            capability.isin,

          status:
            capability.status.replace(
              "ASSET_STATUS_",
              "",
            ),

          monitoring:
            capability.capability,

          supportedDisorders:
            capability.supportedDisorders,

          totalDisorders:
            capability.totalDisorders,

          feedResolution,
        }),
      );

    return {
      generatedAt:
        universe.generatedAt,

      counts: {
        total:
          MAD_ASSETS.length +
          robinhoodAssets.length,

        madSpecific:
          MAD_ASSETS.length,

        robinhood:
          universe.counts,
      },

      assets: [
        ...MAD_ASSETS,
        ...robinhoodAssets,
      ],
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
      const identifier =
        request.params.assetId.trim();

      /*
       * MAD-specific catalogue assets such as tPONS
       * retain their registry-backed path.
       *
       * Robinhood Stock Tokens deliberately bypass
       * catalogue membership.
       */
      const catalogAsset =
        getAssetById(identifier);

      if (
        catalogAsset &&
        catalogAsset.type !==
          "ROBINHOOD_STOCK_TOKEN"
      ) {
        const snapshot =
          await readSnapshot({
            registryAddress:
              requireEnv("MAD_REGISTRY"),
            assetAddress:
              catalogAsset.address,
            rpcUrl:
              requireEnv(
                "ROBINHOOD_TESTNET_RPC",
              ),
          });

        return {
          asset: {
            id:
              catalogAsset.id,
            symbol:
              catalogAsset.symbol,
            name:
              catalogAsset.name,
            type:
              catalogAsset.type,
            address:
              catalogAsset.address,
            chainId:
              catalogAsset.chainId,
            underlyingSymbol:
              catalogAsset.underlyingSymbol ??
              null,
          },

          mad:
            snapshot.mad,

          provenance:
            snapshot.provenance,

          network:
            snapshot.network,
        };
      }

      /*
       * Every Robinhood Stock Token is now resolved
       * dynamically from Robinhood rather than from
       * the MAD static catalogue.
       */
      const capability =
        await resolveCapability(
          identifier,
        );

      if (!capability) {
        return reply.code(404).send({
          error:
            "MAD_ASSET_NOT_FOUND",
          message:
            "The requested asset is not monitored by MAD.",
        });
      }

      /*
       * A recognised PARTIAL/DISCOVERABLE asset is
       * not the same thing as an unknown asset.
       *
       * The current composite evaluator requires FULL
       * structural capability.
       */
      if (
        capability.capability !==
        "FULL"
      ) {
        return reply.code(422).send({
          error:
            "MAD_ASSET_STATE_UNAVAILABLE",

          message:
            "The requested Robinhood asset does not currently have full MAD state capability.",

          asset: {
            id:
              capability.symbol.toLowerCase(),
            symbol:
              capability.symbol,
            name:
              capability.name,
            robinhoodAssetId:
              capability.assetId,
          },

          capability: {
            level:
              capability.capability,
            supportedDisorders:
              capability.supportedDisorders,
            totalDisorders:
              capability.totalDisorders,
          },
        });
      }

      const composite =
        await evaluateRobinhoodComposite({
          symbol:
            capability.symbol,

          rpcUrl:
            process.env
              .ROBINHOOD_MAINNET_RPC ??
            "https://rpc.mainnet.chain.robinhood.com",
        });

      return presentRobinhoodCompositeState(
        composite,
        {
          level:
            capability.capability,
          supportedDisorders:
            capability.supportedDisorders,
          totalDisorders:
            capability.totalDisorders,
        },
      );
    },
  );

  return app;
}
