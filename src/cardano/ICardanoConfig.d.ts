export default interface ICardanoConfig {
    cardanoWalletMnemonic: string;
    cardanoNetwork: 'mainnet' | 'testnet';
    minimunConfirmationToValidateTransaction: number;
    blockfrostProjectId: string;
    databaseName: string;
    mongoDbConnectionString: string;
    sidetreeTransactionFeeMarkupPercentage: number;
    cardanoFeeSpendingCutoffInLovelaces: number;
    sidetreeTransactionPrefix: string;
    cardanoMetadataLabel: string;
    transactionPollPeriodInSeconds: number;
    port: number;
}
