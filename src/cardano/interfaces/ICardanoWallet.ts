import CardanoInputModel from '../models/CardanoInputModel.ts';
import CardanoProtocolParameters from '../models/CardanoProtocolParameters.ts';
import CardanoSidetreeTransactionModel from '../models/CardanoSidetreeTransactionModel.ts';

/**
 * Represents a simple cardano wallet.
 */
export default interface ICardanoWallet {

  /**
   * Gets the address object associated with this wallet.
   */
  getAddress (): string;

  /**
   * Create and sign a transaction.
   *
   * @param transaction The transaction.
   *
   * @returns The signed transaction.
   */
   createAndSignTransaction (
     anchorString: string,
     metadataLabel: string,
     protocolParameters: CardanoProtocolParameters,
     utxos: CardanoInputModel[],
     ledgerTip: number | null
     ): CardanoSidetreeTransactionModel;

    /**
   * Generate a random mnemonic.
   *
   * @returns The generated mnemonic.
   */
  generateMnmonic (): string;

 }
