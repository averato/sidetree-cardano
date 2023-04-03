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
const semver = __importStar(require("semver"));
const timeSpan = __importStar(require("time-span"));
const CardanoClient_1 = __importDefault(require("./CardanoClient"));
const ErrorCode_1 = __importDefault(require("./ErrorCode"));
const EventCode_1 = __importDefault(require("./EventCode"));
const EventEmitter_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/EventEmitter"));
const LogColor_1 = __importDefault(require("@k-solutions/sidetree/dist/lib//common/LogColor"));
const Logger_1 = __importDefault(require("@k-solutions/sidetree/dist/lib//common/Logger"));
const MongoDbTransactionMetadataStore_1 = __importDefault(require("./MongoDbTransactionMetadataStore"));
const MongoDbServiceStateStore_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/MongoDbServiceStateStore"));
const MongoDbTransactionStore_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/MongoDbTransactionStore"));
const Monitor_1 = __importDefault(require("./Monitor"));
const RequestError_1 = __importDefault(require("./RequestError"));
const ResponseStatus_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/enums/ResponseStatus"));
const ServiceInfoProvider_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/ServiceInfoProvider"));
const SharedErrorCode_1 = __importDefault(require("@k-solutions/sidetree/dist/lib//common/SharedErrorCode"));
const SidetreeError_1 = __importDefault(require("@k-solutions/sidetree/dist/lib//common/SidetreeError"));
class CardanoProcessor {
    constructor(config) {
        this.config = config;
        this.serviceStateStore = new MongoDbServiceStateStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.transactionMetadataStore = new MongoDbTransactionMetadataStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.transactionStore = new MongoDbTransactionStore_1.default(config.mongoDbConnectionString, config.databaseName);
        this.serviceInfoProvider = new ServiceInfoProvider_1.default('cardano');
        this.minConfirmations = config.minimunConfirmationToValidateTransaction;
        this.cardanoClient =
            new CardanoClient_1.default(config.cardanoWalletMnemonic, config.blockfrostProjectId, config.cardanoNetwork, config.cardanoMetadataLabel);
        this.monitor = new Monitor_1.default(this.cardanoClient);
    }
    initialize(customLogger, customEventEmitter) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.initialize(customLogger);
            EventEmitter_1.default.initialize(customEventEmitter);
            yield this.serviceStateStore.initialize();
            yield this.transactionMetadataStore.initialize();
            yield this.transactionStore.initialize();
            yield this.cardanoClient.initialize();
            yield this.upgradeDatabaseIfNeeded();
            if (this.config.transactionPollPeriodInSeconds > 0) {
                Logger_1.default.warn(LogColor_1.default.yellow(`Transaction observer is enabled.`));
                this.periodicPoll();
            }
            else {
                Logger_1.default.warn(LogColor_1.default.yellow(`Transaction observer is disabled.`));
            }
        });
    }
    upgradeDatabaseIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            const expectedDbVersion = '1.0.0';
            const savedServiceState = yield this.serviceStateStore.get();
            const actualDbVersion = savedServiceState.databaseVersion;
            if (expectedDbVersion === actualDbVersion) {
                return;
            }
            if (actualDbVersion !== undefined && semver.lt(expectedDbVersion, actualDbVersion)) {
                Logger_1.default.error(LogColor_1.default.red(`Downgrading DB from version ${LogColor_1.default.green(actualDbVersion)} to  ${LogColor_1.default.green(expectedDbVersion)} is not allowed.`));
                throw new SidetreeError_1.default(ErrorCode_1.default.DatabaseDowngradeNotAllowed);
            }
            Logger_1.default.warn(LogColor_1.default.yellow(`Upgrading DB from version ${LogColor_1.default.green(actualDbVersion)} to ${LogColor_1.default.green(expectedDbVersion)}...`));
            const timer = timeSpan();
            yield this.serviceStateStore.put({ databaseVersion: expectedDbVersion });
            Logger_1.default.warn(LogColor_1.default.yellow(`DB upgraded in: ${LogColor_1.default.green(timer.rounded())} ms.`));
        });
    }
    processSidetreeTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sidetreeTx = {
                    transactionNumber: transaction.transactionNumber,
                    transactionTime: transaction.blockHeight,
                    transactionTimeHash: transaction.blockHash,
                    anchorString: transaction.metadata.replace(this.config.sidetreeTransactionPrefix, ''),
                    transactionFeePaid: transaction.fees,
                    writer: transaction.inputs[0].address
                };
                Logger_1.default.info(LogColor_1.default.lightBlue(`Sidetree transaction found; adding ${LogColor_1.default.green(JSON.stringify(sidetreeTx))}`));
                yield this.transactionStore.addTransaction(sidetreeTx);
            }
            catch (e) {
                Logger_1.default.info(`An error happened when trying to add sidetree transaction to the store. Moving on to the next transaction. ` +
                    `Full error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                throw e;
            }
        });
    }
    time(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Getting time ${hash ? 'of time hash ' + hash : ''}`);
            if (!hash) {
                const latestBLock = yield this.cardanoClient.getLedgerTip();
                return {
                    time: latestBLock.height,
                    hash: latestBLock.hash
                };
            }
            const tx = yield this.cardanoClient.getTransaction(hash);
            return {
                hash: hash,
                time: tx.blockHeight
            };
        });
    }
    writeTransaction(anchorString) {
        return __awaiter(this, void 0, void 0, function* () {
            const sidetreeTransactionString = `${this.config.sidetreeTransactionPrefix}${anchorString}`;
            const sidetreeTransaction = yield this.cardanoClient.createSidetreeTransaction(sidetreeTransactionString);
            const transactionFee = sidetreeTransaction.fees;
            Logger_1.default.info(`Fee: ${transactionFee}. Anchoring string ${anchorString}`);
            const totalLovelaces = yield this.cardanoClient.getBalanceInLovelaces();
            if (totalLovelaces < transactionFee + 1000000) {
                const error = new Error(`Not enough lovelaces to submit transaction. Failed to broadcast anchor string ${anchorString}`);
                Logger_1.default.error(error);
                throw new RequestError_1.default(ResponseStatus_1.default.BadRequest, SharedErrorCode_1.default.NotEnoughBalanceForWrite);
            }
            const transactionHash = yield this.cardanoClient.submitSidetreeTransaction(sidetreeTransaction);
            Logger_1.default.info(LogColor_1.default.lightBlue(`Successfully submitted transaction [hash: ${LogColor_1.default.green(transactionHash)}]`));
        });
    }
    getServiceVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.serviceInfoProvider.getServiceVersion();
        });
    }
    periodicPoll(interval = this.config.transactionPollPeriodInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.pollTimeoutId) {
                    clearTimeout(this.pollTimeoutId);
                }
                yield this.processTransactions();
                EventEmitter_1.default.emit(EventCode_1.default.CardanoObservingLoopSuccess);
            }
            catch (error) {
                EventEmitter_1.default.emit(EventCode_1.default.CardanoObservingLoopFailure);
                Logger_1.default.error(error);
            }
            finally {
                this.pollTimeoutId = setTimeout(this.periodicPoll.bind(this), 1000 * interval, interval);
            }
        });
    }
    processTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Starting processTransaction at: ${Date.now()}`);
            const txMetadatas = yield this.getTransactionMetadatas();
            Logger_1.default.info(`Processing ${txMetadatas.length} new transactions`);
            for (const txm of txMetadatas) {
                const cardanoTransaction = yield this.cardanoClient.getTransaction(txm.toString());
                if (this.validateTransaction(cardanoTransaction)) {
                    this.transactionMetadataStore.add([cardanoTransaction]);
                    this.processSidetreeTransaction(cardanoTransaction);
                }
            }
            Logger_1.default.info(`Finished processing ${txMetadatas.length} transactions`);
        });
    }
    validateTransaction(cardanoTransaction) {
        Logger_1.default.info(`Cardano Transaction Metadata: ${cardanoTransaction.metadata}`);
        let validated = true;
        if (cardanoTransaction.metadata == null || !cardanoTransaction.metadata.startsWith(this.config.sidetreeTransactionPrefix)) {
            validated = false;
        }
        if (cardanoTransaction.inputs[0].address !== cardanoTransaction.outputs[0].address) {
            validated = false;
        }
        if (cardanoTransaction.blockConfirmations < this.minConfirmations) {
            validated = false;
        }
        return validated;
    }
    getTransactionMetadatas() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastProcessedTransaction = yield this.transactionMetadataStore.getLast();
            let lastTransactionFound = false;
            let batchSize = 10;
            let page = 1;
            const metadataArray = [];
            while (!lastTransactionFound) {
                const txMetadatas = yield this.cardanoClient.getTxMetadataPage(page, batchSize);
                for (const txMeta of txMetadatas) {
                    if (txMeta.txHash === (lastProcessedTransaction === null || lastProcessedTransaction === void 0 ? void 0 : lastProcessedTransaction.hash)) {
                        lastTransactionFound = true;
                        break;
                    }
                    else {
                        metadataArray.push(txMeta.txHash);
                    }
                }
                if (txMetadatas.length < batchSize) {
                    lastTransactionFound = true;
                }
                if (lastTransactionFound === false && batchSize === 10) {
                    batchSize = 100;
                }
                if (lastTransactionFound === false && batchSize === 100) {
                    page++;
                }
            }
            return metadataArray.reverse();
        });
    }
    transactions(since, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(LogColor_1.default.lightBlue(`Transactions request: since transaction number ${LogColor_1.default.green(since)}, block hash '${LogColor_1.default.green(hash)}'...`));
            if ((since && !hash) ||
                (!since && hash)) {
                throw new RequestError_1.default(ResponseStatus_1.default.BadRequest);
            }
            let transactions;
            if (!since) {
                transactions = yield this.transactionStore.getTransactions();
            }
            else {
                transactions = yield this.transactionStore.getTransactionsLaterThan(since, undefined);
            }
            const moreTransactions = false;
            return {
                transactions,
                moreTransactions
            };
        });
    }
    getNormalizedFee(_block) {
        return __awaiter(this, void 0, void 0, function* () {
            return { normalizedTransactionFee: 1 };
        });
    }
    getValueTimeLock(lockIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currLock = yield this.monitor.getCurrentValueTimeLock();
                if (!currLock) {
                    throw new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
                }
                return currLock;
            }
            catch (e) {
                Logger_1.default.info(`Value time lock not found. Identifier: ${lockIdentifier}. Error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                throw new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
            }
        });
    }
    getActiveValueTimeLockForThisNode() {
        return __awaiter(this, void 0, void 0, function* () {
            let currentLock;
            try {
                currentLock = yield this.monitor.getCurrentValueTimeLock();
            }
            catch (e) {
                if (e instanceof SidetreeError_1.default && e.code === ErrorCode_1.default.LockMonitorCurrentValueTimeLockInPendingState) {
                    throw new RequestError_1.default(ResponseStatus_1.default.NotFound, ErrorCode_1.default.ValueTimeLockInPendingState);
                }
                Logger_1.default.error(`Current value time lock retrieval failed with error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
                throw new RequestError_1.default(ResponseStatus_1.default.ServerError);
            }
            if (!currentLock) {
                throw new RequestError_1.default(ResponseStatus_1.default.NotFound, SharedErrorCode_1.default.ValueTimeLockNotFound);
            }
            return currentLock;
        });
    }
}
exports.default = CardanoProcessor;
//# sourceMappingURL=CardanoProcessor.js.map