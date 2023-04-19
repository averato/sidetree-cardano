// deno-lint-ignore-file no-explicit-any
 
import Koa from "npm:koa";
import Router from "npm:koa-router";
import getRawBody from "npm:raw-body";
import querystring from "node:querystring";
import ISidetreeCardanoConfig from "./cardano/ICardanoConfig.ts";
import SidetreeCardanoProcessor from "./cardano/CardanoProcessor.ts";
import { exit } from "https://deno.land/x/exit@0.0.4/mod.ts";
import { Buffer } from 'node:buffer';

/** Cardano Service  */
interface ICardanoServiceConfig extends ISidetreeCardanoConfig {
  /** Boolean to control if error thrown by request handler is logged. */
  logRequestError?: boolean;
  /** Port number used by the service. */
  port: number;
}

/**
 * Handles the request using the given request handler then assigns the returned value as the body.
 * NOTE: The value of this method is really the unified handling of errors thrown.
 * @param requestHandler Request handler.
 * @param koaResponse Response object to update.
 */
async function handleRequestAndSetKoaResponse(
  requestHandler: () => Promise<any>,
  koaResponse: Koa.Response,
) {
  try {
    const responseBody = await requestHandler();
    koaResponse.status = 200;
    koaResponse.set("Content-Type", "application/json");

    if (responseBody) {
      koaResponse.body = JSON.stringify(responseBody);
    } else {
      // Need to set the body explicitly, otherwise Koa will return HTTP 204
      koaResponse.body = "";
    }
  } catch (error: any) {
    // console
    if ("status" in error) {
      koaResponse.status = error.status;
    } else {
      // This is an unknown/unexpected error.
      koaResponse.status = 500;

      // Log error if the config flag is switched on.
      if (config.logRequestError) {
        console.error(error);
      }
    }

    if ("code" in error) {
      koaResponse.body = JSON.stringify({
        code: error.code,
      });
    }
  }
}

// Selecting configuration file, environment variable overrides default config file.
let configFilePath = "../json/testnet-cardano-config.json";
const cardanoConfigPath = Deno.env.get("CARDANO_CONFIG_FILE_PATH"); 
if (cardanoConfigPath === undefined) {
  console.log(
    `Environment variable CARDANO_CONFIG_FILE_PATH undefined, using default path ${configFilePath} instead.`,
  );
} else {
  configFilePath = cardanoConfigPath;
  console.log(`Loading configuration from ${configFilePath}...`);
}

const configFile = await import(configFilePath, { assert: { type: "json" }});
const config: ISidetreeCardanoConfig = configFile.default;
const app = new Koa();

// Raw body parser.
app.use(async (ctx, next) => {
  ctx.body = await getRawBody(ctx.req);
  await next();
});

const router = new Router();

router.get("/transactions", async (ctx, _next) => {
  const params = querystring.parse(ctx.querystring);
  console.log(`Cardano transactions params: ${ctx}`);
  let requestHandler;
  if ("since" in params && "transaction-time-hash" in params) {
    const since = Number(params["since"]);
    const transactionTimeHash = String(params["transaction-time-hash"]);
    requestHandler = () =>
      blockchainService.transactions(since, transactionTimeHash);
  } else {
    requestHandler = () => blockchainService.transactions();
  }

  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/version", async (ctx, _next) => {
  const requestHandler = () => blockchainService.getServiceVersion();
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/fee/:blockchainTime", async (ctx, _next) => {
  const requestHandler = () =>
    blockchainService.getNormalizedFee(ctx.params.blockchainTime);
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.post("/transactions", async (ctx, _next) => {
  const writeRequest = JSON.parse(ctx.body);
  console.log(`Tansaction anchor string: ${writeRequest.anchorString}`);
  const requestHandler = () =>
    blockchainService.writeTransaction(writeRequest.anchorString);
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/time", async (ctx, _next) => {
  const requestHandler = () => blockchainService.time();
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/time/:hash", async (ctx, _next) => {
  const requestHandler = () => blockchainService.time(ctx.params.hash);
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/locks/:identifier", async (ctx, _next) => {
  const requestHandler = () =>
    blockchainService.getValueTimeLock(ctx.params.identifier);
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/writerlock", async (ctx, _next) => {
  const requestHandler = () =>
    blockchainService.getActiveValueTimeLockForThisNode();
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

router.get("/monitors/balance", async (ctx, _next) => {
  const requestHandler = () => blockchainService.monitor.getWalletBalance();
  await handleRequestAndSetKoaResponse(requestHandler, ctx.response);
});

app.use(router.routes())
  .use(router.allowedMethods());

// Handler to return bad request for all unhandled paths.
app.use((ctx, _next) => {
  ctx.response.status = 400;
});

const port = Deno.env.get("SIDETREE_CARDANO_PORT") || config.port;

// initialize the blockchain service and kick-off background tasks
let server: any;
let blockchainService: SidetreeCardanoProcessor;
try {
  console.log(`Current parsed log: ${config}`);
  blockchainService = new SidetreeCardanoProcessor(config);

  // SIDETREE_TEST_MODE enables unit testing of this file by bypassing blockchain service initialization.
  if (Deno.env.get("SIDETREE_TEST_MODE") === "true") {
    server = app.listen(port);
  } else {
    blockchainService.initialize()
      .then(() => {
        server = app.listen(port, () => {
          console.log(`Sidetree-Cardano node running on port: ${port}`);
        });
      })
      .catch((error) => {
        console.error(
          `Sidetree-Cardano node initialization failed with error: ${
            JSON.stringify(error, Object.getOwnPropertyNames(error))
          }`,
        );
        exit(1);
      });
  }
} catch (error: any) {
  console.log(error.toString());
  exit(1);
}
// console.info('Sidetree Cardano service configuration:');
// console.info(config);

export { blockchainService, server };
