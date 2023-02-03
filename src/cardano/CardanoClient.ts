// Select CardanoClient library implemetation Dandelion API | Blockfrost
import CardanoClientBF from './CardanoClient_blockfrost';
// import CardanoClient from './CardanoClient_dandelion';

class CardanoClient extends CardanoClientBF {
  /**
   * Accessor for Cardano client Wallet Address.
   */
  public async getAddress (): Promise<String> {
    return this.cardanoWallet.getAddress();
  }
}

export default CardanoClient;
