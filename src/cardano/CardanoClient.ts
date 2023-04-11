// Select CardanoClient library implemetation Dandelion API | Blockfrost
import CardanoClientBF from './CardanoClient_blockfrost.ts';
// import CardanoClient from './CardanoClient_dandelion';

class CardanoClient extends CardanoClientBF {
  /**
   * Accessor for Cardano client Wallet Address.
   */
  public async getAddress (): Promise<string> {
    return this.cardanoWallet.getAddress().toString();
  }
}

export default CardanoClient;
