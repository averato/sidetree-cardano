import Koa from 'koa';
import Router from 'koa-router';
import getRawBody from 'npm:raw-body';
import {
  SidetreeConfig,
  SidetreeCore,
  SidetreeResponse,
  SidetreeResponseModel,
  SidetreeVersionModel
} from 'sidetree/index.ts';
import Ipfs from 'sidetree/ipfs/Ipfs.ts';
import ResponseStatus from 'sidetree/common/enums/ResponseStatus.ts';
import cors from 'npm:koa2-cors';
import { exit } from "https://deno.land/x/exit@0.0.4/mod.ts";

/** Sidetree Core Service */
interface ServerConfig extends SidetreeConfig {
  /** IPFS HTTP API endpoint URI. */
  ipfsHttpApiEndpointUri: string;

  /** Port to be used by the server. */
  port: number;
}

// Selecting core config file, environment variable overrides default config file.
let configFilePath: string | undefined = '../json/testnet-core-config.json';

if (Deno.env.get("CORE_CONFIG_FILE_PATH") === undefined) {
  console.log(`Environment variable CORE_CONFIG_FILE_PATH undefined, using default core config path ${configFilePath} instead.`);
} else {
  configFilePath = Deno.env.get("CORE_CONFIG_FILE_PATH");
  console.log(`Loading core config from ${configFilePath}...`);
}

const configFile = await import(configFilePath, { assert: { type: "json" } });
const config: SidetreeConfig = configFile.default;
// console.log(`Sidetree config: ${config}`);

// Selecting versioning file, environment variable overrides default config file.
let versioningConfigFilePath: string | undefined = '../json/testnet-core-versioning.json';

if (Deno.env.get("CORE_VERSIONING_CONFIG_FILE_PATH") === undefined) {
  console.log(`Environment variable CORE_VERSIONING_CONFIG_FILE_PATH 
  undefined, using default core versioning config path ${versioningConfigFilePath} instead.`);
} else {
  versioningConfigFilePath = Deno.env.get("CORE_VERSIONING_CONFIG_FILE_PATH");
  console.log(`Loading core versioning config from ${versioningConfigFilePath}...`);
}

const coreVersionFile = await import(versioningConfigFilePath, { assert: { type: "json" } });
const coreVersions: SidetreeVersionModel[] = coreVersionFile.default;

// console.log(`Loaded configs: ${[JSON.stringify(coreVersions), JSON.stringify(config)]}`);

const ipfsFetchTimeoutInSeconds = 10;
const cas = new Ipfs(config.ipfsHttpApiEndpointUri, ipfsFetchTimeoutInSeconds);
const sidetreeCore = new SidetreeCore(config, coreVersions, cas);

const app = new Koa();
app.use(cors());

// Raw body parser.
app.use(async (ctx, next) => {
  ctx.body = await getRawBody(ctx.req);
  await next();
});

const router = new Router();
router.post('/operations', async (ctx, _next) => {
  const response = await sidetreeCore.handleOperationRequest(ctx.body);

  console.log(`DiD Operation response: ${JSON.stringify(response)}`);    

  setKoaResponse(response, ctx.response);
});

router.get('/version', async (ctx, _next) => {
  const response = await sidetreeCore.handleGetVersionRequest();
  setKoaResponse(response, ctx.response);
});

const resolvePath = '/identifiers/';
router.get(`${resolvePath}:did`, async (ctx, _next) => {
  // Strip away the first '/identifiers/' string.
  const didOrDidDocument = ctx.url.split(resolvePath)[1];
  const response = await sidetreeCore.handleResolveRequest(decodeURIComponent(didOrDidDocument));
  setKoaResponse(response, ctx.response);
});

router.get('/monitor/operation-queue-size', async (ctx, _next) => {
  const body = await sidetreeCore.monitor.getOperationQueueSize();
  const response = { status: RggesponseStatus.Succeeded, body };
  setKoaResponse(response, ctx.response);
});

router.get('/monitor/writer-max-batch-size', async (ctx, _next) => {
  const body = await sidetreeCore.monitor.getWriterMaxBatchSize();
  const response = { status: ResponseStatus.Succeeded, body };
  setKoaResponse(response, ctx.response);
});

app.use(router.routes())
  .use(router.allowedMethods());

// Handler to return bad request for all unhandled paths.
app.use((ctx, _next) => {
  ctx.response.status = 400;
});

(async () => {
  try {
    await sidetreeCore.initialize();

    const port = config.port;
    app.listen(port, () => {
      console.log(`Sidetree node running on port: ${port}`);
    });
  } catch (error) {
    console.log(`Sidetree node initialization failed with error ${error}`);
    exit(1);
  }
})();

/**
 * Sets the koa response according to the Sidetree response object given.
 */
const setKoaResponse = (response: SidetreeResponseModel, koaResponse: Koa.Response) => {
  koaResponse.status = SidetreeResponse.toHttpStatus(response.status);

  if (response.body) {
    koaResponse.set('Content-Type', 'application/json');
    koaResponse.body = response.body;
  } else {
    // Need to set the body explicitly to empty string, else koa will echo the request as the response.
    koaResponse.body = '';
  }
};
