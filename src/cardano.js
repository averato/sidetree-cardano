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
exports.blockchainService = exports.server = void 0;
const Koa = __importStar(require("koa"));
const Router = __importStar(require("koa-router"));
const getRawBody = __importStar(require("raw-body"));
const querystring = __importStar(require("querystring"));
const CardanoProcessor_1 = __importDefault(require("./cardano/CardanoProcessor"));
function handleRequestAndSetKoaResponse(requestHandler, koaResponse) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const responseBody = yield requestHandler();
            koaResponse.status = 200;
            koaResponse.set('Content-Type', 'application/json');
            if (responseBody) {
                koaResponse.body = JSON.stringify(responseBody);
            }
            else {
                koaResponse.body = '';
            }
        }
        catch (error) {
            if ('status' in error) {
                koaResponse.status = error.status;
            }
            else {
                koaResponse.status = 500;
                if (config.logRequestError) {
                    console.error(error);
                }
            }
            if ('code' in error) {
                koaResponse.body = JSON.stringify({
                    code: error.code
                });
            }
        }
    });
}
let configFilePath = '../json/testnet-cardano-config.json';
if (process.env.CARDANO_CONFIG_FILE_PATH === undefined) {
    console.log(`Environment variable CARDANO_CONFIG_FILE_PATH undefined, using default path ${configFilePath} instead.`);
}
else {
    configFilePath = process.env.CARDANO_CONFIG_FILE_PATH;
    console.log(`Loading configuration from ${configFilePath}...`);
}
const config = require(configFilePath);
const app = new Koa();
app.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.body = yield getRawBody(ctx.req);
    yield next();
}));
const router = new Router();
router.get('/transactions', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const params = querystring.parse(ctx.querystring);
    console.log(`Cardano transactions params: ${ctx}`);
    let requestHandler;
    if ('since' in params && 'transaction-time-hash' in params) {
        const since = Number(params['since']);
        const transactionTimeHash = String(params['transaction-time-hash']);
        requestHandler = () => blockchainService.transactions(since, transactionTimeHash);
    }
    else {
        requestHandler = () => blockchainService.transactions();
    }
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/version', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.getServiceVersion();
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/fee/:blockchainTime', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.getNormalizedFee(ctx.params.blockchainTime);
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.post('/transactions', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const writeRequest = JSON.parse(ctx.body);
    console.log(`Tansaction anchor string: ${writeRequest.anchorString}`);
    const requestHandler = () => blockchainService.writeTransaction(writeRequest.anchorString);
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/time', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.time();
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/time/:hash', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.time(ctx.params.hash);
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/locks/:identifier', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.getValueTimeLock(ctx.params.identifier);
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/writerlock', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.getActiveValueTimeLockForThisNode();
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
router.get('/monitors/balance', (ctx, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const requestHandler = () => blockchainService.monitor.getWalletBalance();
    yield handleRequestAndSetKoaResponse(requestHandler, ctx.response);
}));
app.use(router.routes())
    .use(router.allowedMethods());
app.use((ctx, _next) => {
    ctx.response.status = 400;
});
const port = process.env.SIDETREE_CARDANO_PORT || config.port;
let server;
exports.server = server;
let blockchainService;
exports.blockchainService = blockchainService;
try {
    exports.blockchainService = blockchainService = new CardanoProcessor_1.default(config);
    if (process.env.SIDETREE_TEST_MODE === 'true') {
        exports.server = server = app.listen(port);
    }
    else {
        blockchainService.initialize()
            .then(() => {
            exports.server = server = app.listen(port, () => {
                console.log(`Sidetree-Cardano node running on port: ${port}`);
            });
        })
            .catch((error) => {
            console.error(`Sidetree-Cardano node initialization failed with error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
            process.exit(1);
        });
    }
}
catch (error) {
    console.log(error.toString());
    process.exit(1);
}
//# sourceMappingURL=cardano.js.map