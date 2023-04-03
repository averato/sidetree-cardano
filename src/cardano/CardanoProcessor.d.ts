import { ISidetreeEventEmitter, ISidetreeLogger } from '@k-solutions/sidetree/lib';
import ICardanoConfig from './ICardanoConfig';
import Monitor from './Monitor';
import ServiceVersionModel from '@k-solutions/sidetree/dist/lib/common/models/ServiceVersionModel';
import TransactionFeeModel from '@k-solutions/sidetree/dist/lib/common/models/TransactionFeeModel';
import TransactionModel from '@k-solutions/sidetree/dist/lib/common/models/TransactionModel';
import ValueTimeLockModel from '@k-solutions/sidetree/dist/lib/common/models/ValueTimeLockModel';
export interface IBlockchainTime {
    time: number;
    hash: string;
}
export default class CardanoProcessor {
    private config;
    monitor: Monitor;
    private readonly transactionStore;
    private pollTimeoutId;
    private serviceInfoProvider;
    private cardanoClient;
    private minConfirmations;
    private serviceStateStore;
    private transactionMetadataStore;
    constructor(config: ICardanoConfig);
    initialize(customLogger?: ISidetreeLogger, customEventEmitter?: ISidetreeEventEmitter): Promise<void>;
    private upgradeDatabaseIfNeeded;
    private processSidetreeTransaction;
    time(hash?: string): Promise<IBlockchainTime>;
    writeTransaction(anchorString: string): Promise<void>;
    getServiceVersion(): Promise<ServiceVersionModel>;
    private periodicPoll;
    private processTransactions;
    private validateTransaction;
    private getTransactionMetadatas;
    transactions(since?: number, hash?: string): Promise<{
        moreTransactions: boolean;
        transactions: TransactionModel[];
    }>;
    getNormalizedFee(_block: number | string): Promise<TransactionFeeModel>;
    getValueTimeLock(lockIdentifier: string): Promise<ValueTimeLockModel>;
    getActiveValueTimeLockForThisNode(): Promise<ValueTimeLockModel>;
}
