import MongoDbStore from '@k-solutions/sidetree/dist/lib/common/MongoDbStore';
import SavedLockModel from './../models/SavedLockedModel';
export default class MongoDbLockTransactionStore extends MongoDbStore {
    static readonly lockCollectionName = "locks";
    constructor(serverUrl: string, databaseName: string);
    addLock(transactionLock: SavedLockModel): Promise<void>;
    getLastLock(): Promise<SavedLockModel | undefined>;
    createIndex(): Promise<void>;
}
