import CardanoInputModel from '../models/CardanoInputModel';
import CardanoProtocolParameters from '../models/CardanoProtocolParameters';
import CardanoSidetreeTransactionModel from '../models/CardanoSidetreeTransactionModel';
export default interface ICardanoWallet {
    getAddress(): String;
    createAndSignTransaction(anchorString: String, metadataLabel: String, protocolParameters: CardanoProtocolParameters, utxos: CardanoInputModel[], ledgerTip: number | null): CardanoSidetreeTransactionModel;
    generateMnmonic(): String;
}
