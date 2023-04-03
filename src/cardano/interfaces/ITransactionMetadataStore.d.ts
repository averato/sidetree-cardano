import CardanoTransactionModel from '../models/CardanoTransactionModel';
export default interface ITransactionMetadataStore {
    add(transactionMetadata: CardanoTransactionModel[]): Promise<void>;
    removeLaterThan(transactionNumber?: number): Promise<void>;
    get(fromInclusiveTransactionNumber: number, toExclusiveTransactionNumbert: number): Promise<CardanoTransactionModel[]>;
    getLast(): Promise<CardanoTransactionModel | undefined>;
}
