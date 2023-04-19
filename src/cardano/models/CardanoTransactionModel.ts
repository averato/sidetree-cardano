import CardanoInputModel from './CardanoInputModel.ts';
import CardanoOutputModel from './CardanoOutputModel.ts';

/**
 * Encapsulates data for a Cardano transaction.
 */
export default interface CardanoTransactionModel {
  outputs: CardanoOutputModel[];
  inputs: CardanoInputModel[];
  hash: string;
  fees: number;
  blockHash: string;
  blockHeight: number;
  index: number;
  metadata: string | null;
  blockConfirmations: number;
  transactionNumber: number;
}
