"use strict";
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
const mongodb_1 = require("mongodb");
const MongoDbStore_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/MongoDbStore"));
class MongoDbLockTransactionStore extends MongoDbStore_1.default {
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbLockTransactionStore.lockCollectionName, databaseName);
    }
    addLock(transactionLock) {
        return __awaiter(this, void 0, void 0, function* () {
            const lockInMongoDb = {
                desiredLockAmountInSatoshis: transactionLock.desiredLockAmountInAda,
                transactionId: transactionLock.transactionHash,
                rawTransaction: transactionLock.rawTransaction,
                redeemScriptAsHex: transactionLock.redeemScriptAsHex,
                createTimestamp: mongodb_1.Long.fromNumber(transactionLock.createTimestamp),
                type: transactionLock.type
            };
            yield this.collection.insertOne(lockInMongoDb);
        });
    }
    getLastLock() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastLocks = yield this.collection
                .find()
                .limit(1)
                .sort({ createTimestamp: -1 })
                .toArray();
            if (!lastLocks || lastLocks.length <= 0) {
                return undefined;
            }
            return lastLocks[0];
        });
    }
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ createTimestamp: -1 });
        });
    }
}
exports.default = MongoDbLockTransactionStore;
MongoDbLockTransactionStore.lockCollectionName = 'locks';
//# sourceMappingURL=MongoDbLockTransactionStore.js.map