import CardanoTransactionModel from './models/CardanoTransactionModel';
import ITransactionMetadataStore from './interfaces/ITransactionMetadataStore';
import MongoDbStore from '@k-solutions/sidetree/dist/lib/common/MongoDbStore';
export default class MongoDbTransactionMetadataStore extends MongoDbStore implements ITransactionMetadataStore {
    static readonly collectionName = "txmetadata";
    constructor(serverUrl: string, databaseName: string);
    createIndex(): Promise<void>;
    add(arrayOfTransactionMetadata: CardanoTransactionModel[]): Promise<void>;
    removeLaterThan(transactionNumber?: number): Promise<void>;
    get(fromInclusiveTransactionNumber: number, toExclusiveTransactionNumber: number): Promise<CardanoTransactionModel[]>;
    getLast(): Promise<CardanoTransactionModel | undefined>;
}
