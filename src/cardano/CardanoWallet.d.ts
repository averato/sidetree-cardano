import CardanoInputModel from './models/CardanoInputModel';
import CardanoProtocolParameters from './models/CardanoProtocolParameters';
import CardanoSidetreeTransactionModel from './models/CardanoSidetreeTransactionModel';
import ICardanoWallet from './interfaces/ICardanoWallet';
export default class CardanoWallet implements ICardanoWallet {
    private readonly baseAddress;
    private readonly walletAddress;
    private readonly privateKey;
    constructor(cardanoWalletMnemonic: string, cardanoNetwork: string);
    getAddress(): String;
    generateMnmonic(): String;
    createAndSignTransaction(anchorString: String, metadataLabel: String, protocolParameters: CardanoProtocolParameters, utxos: CardanoInputModel[], ledgerTip: number | null): CardanoSidetreeTransactionModel;
    private toHexString;
}
