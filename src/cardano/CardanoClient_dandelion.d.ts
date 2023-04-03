import CardanoBlockModel from './models/CardanoBlockModel';
import CardanoInputModel from './models/CardanoInputModel';
import CardanoMetadataModel from './models/CardanoMetadataModel';
import CardanoSidetreeTransactionModel from './models/CardanoSidetreeTransactionModel';
import CardanoTransactionModel from './models/CardanoTransactionModel';
import ICardanoWallet from './interfaces/ICardanoWallet';
export default class CardanoClient {
    readonly cardanoWalletMnemonic: string;
    readonly blockfrostProjectId: string;
    readonly cardanoNetwork: 'mainnet' | 'testnet';
    readonly cardanoMetadataLabel: string;
    protected readonly cardanoWallet: ICardanoWallet;
    private readonly submitTxURL;
    private readonly graphQLURL;
    constructor(cardanoWalletMnemonic: string, blockfrostProjectId: string, cardanoNetwork: 'mainnet' | 'testnet', cardanoMetadataLabel: string);
    initialize(): Promise<void>;
    submitSidetreeTransaction(cardanoSidetreeTransaction: CardanoSidetreeTransactionModel): Promise<string>;
    createSidetreeTransaction(transactionData: string): Promise<CardanoSidetreeTransactionModel>;
    getUtxos(): Promise<CardanoInputModel[]>;
    getBalanceInLovelaces(): Promise<number>;
    getTransactionFeeInLovelaces(transactionHash: string): Promise<number>;
    getTransaction(transactionHash: string): Promise<CardanoTransactionModel>;
    getTxMetadataPage(page: number, batchSize: number): Promise<CardanoMetadataModel[]>;
    private getLatestProtocolParameters;
    getLedgerTip(): Promise<CardanoBlockModel>;
}
