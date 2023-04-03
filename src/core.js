"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = __importStar(require("koa"));
const Router = __importStar(require("koa-router"));
const getRawBody = __importStar(require("raw-body"));
const sidetree_1 = require("@k-solutions/sidetree");
const Ipfs_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/ipfs/Ipfs"));
const ResponseStatus_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/enums/ResponseStatus"));
const cors = require('koa2-cors');
let configFilePath = '../json/testnet-core-config.json';
if (process.env.CORE_CONFIG_FILE_PATH === undefined) {
    console.log(`Environment variable CORE_CONFIG_FILE_PATH undefined, using default core config path ${configFilePath} instead.`);
}
else {
    configFilePath = process.env.CORE_CONFIG_FILE_PATH;
    console.log(`Loading core config from ${configFilePath}...`);
}
const config = require(configFilePath);
console.log(`Sidetree config: ${config}`);
let versioningConfigFilePath = '../json/testnet-core-versioning.json';
if (process.env.CORE_VERSIONING_CONFIG_FILE_PATH === undefined) {
    console.log(`Environment variable CORE_VERSIONING_CONFIG_FILE_PATH 
  undefined, using default core versioning config path ${versioningConfigFilePath} instead.`);
}
else {
    versioningConfigFilePath = process.env.CORE_VERSIONING_CONFIG_FILE_PATH;
    console.log(`Loading core versioning config from ${versioningConfigFilePath}...`);
}
const coreVersions = require(versioningConfigFilePath);
const ipfsFetchTimeoutInSeconds = 10;
const cas = new Ipfs_1.default(config.ipfsHttpApiEndpointUri, ipfsFetchTimeoutInSeconds);
const sidetreeCore = new sidetree_1.SidetreeCore(config, coreVersions, cas);
const app = new Koa();
app.use(cors());
app.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.body = yield getRawBody(ctx.req);
    yield next();
}));
const router = new Router();
router.post('/operations', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield sidetreeCore.handleOperationRequest(ctx.body);
    setKoaResponse(response, ctx.response);
}));
router.get('/version', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield sidetreeCore.handleGetVersionRequest();
    setKoaResponse(response, ctx.response);
}));
const resolvePath = '/identifiers/';
router.get(`${resolvePath}:did`, (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const didOrDidDocument = ctx.url.split(resolvePath)[1];
    const response = yield sidetreeCore.handleResolveRequest(decodeURIComponent(didOrDidDocument));
    setKoaResponse(response, ctx.response);
}));
router.get('/monitor/operation-queue-size', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = yield sidetreeCore.monitor.getOperationQueueSize();
    const response = { status: ResponseStatus_1.default.Succeeded, body };
    setKoaResponse(response, ctx.response);
}));
router.get('/monitor/writer-max-batch-size', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = yield sidetreeCore.monitor.getWriterMaxBatchSize();
    const response = { status: ResponseStatus_1.default.Succeeded, body };
    setKoaResponse(response, ctx.response);
}));
app.use(router.routes())
    .use(router.allowedMethods());
app.use((ctx, _next) => {
    ctx.response.status = 400;
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sidetreeCore.initialize();
        const port = config.port;
        app.listen(port, () => {
            console.log(`Sidetree node running on port: ${port}`);
        });
    }
    catch (error) {
        console.log(`Sidetree node initialization failed with error ${error}`);
        process.exit(1);
    }
}))();
const setKoaResponse = (response, koaResponse) => {
    koaResponse.status = sidetree_1.SidetreeResponse.toHttpStatus(response.status);
    if (response.body) {
        koaResponse.set('Content-Type', 'application/json');
        koaResponse.body = response.body;
    }
    else {
        koaResponse.body = '';
    }
};
//# sourceMappingURL=core.js.map