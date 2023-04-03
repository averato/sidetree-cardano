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
const MongoDbStore_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/MongoDbStore"));
class MongoDbTransactionMetadataStore extends MongoDbStore_1.default {
    constructor(serverUrl, databaseName) {
        super(serverUrl, MongoDbTransactionMetadataStore.collectionName, databaseName);
    }
    createIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.createIndex({ transactionNumber: 1 }, { unique: true });
        });
    }
    add(arrayOfTransactionMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const bulkOperations = this.collection.initializeOrderedBulkOp();
            arrayOfTransactionMetadata.sort((a, b) => a.transactionNumber - b.transactionNumber);
            for (const transactionMetadata of arrayOfTransactionMetadata) {
                bulkOperations.find({ height: transactionMetadata.transactionNumber }).upsert().replaceOne(transactionMetadata);
            }
            yield bulkOperations.execute();
        });
    }
    removeLaterThan(transactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (transactionNumber === undefined) {
                yield this.clearCollection();
                return;
            }
            yield this.collection.deleteMany({ transactionNumber: { $gt: transactionNumber } });
        });
    }
    get(fromInclusiveTransactionNumber, toExclusiveTransactionNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            let dbCursor;
            dbCursor = this.collection.find({
                $and: [
                    { transactionNumber: { $gte: fromInclusiveTransactionNumber } },
                    { transactionNumber: { $lt: toExclusiveTransactionNumber } }
                ]
            });
            dbCursor = dbCursor.sort({ transactionNumber: 1 });
            const blocks = yield dbCursor.toArray();
            return blocks;
        });
    }
    getLast() {
        return __awaiter(this, void 0, void 0, function* () {
            const txs = yield this.collection.find().sort({ transactionNumber: -1 }).limit(1).toArray();
            if (txs.length === 0) {
                return undefined;
            }
            const lastBlockMetadata = txs[0];
            return lastBlockMetadata;
        });
    }
}
exports.default = MongoDbTransactionMetadataStore;
MongoDbTransactionMetadataStore.collectionName = 'txmetadata';
//# sourceMappingURL=MongoDbTransactionMetadataStore.js.map