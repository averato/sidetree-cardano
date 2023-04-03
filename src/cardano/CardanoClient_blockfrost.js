"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const blockfrost_js_1 = require("@blockfrost/blockfrost-js");
const CardanoWallet_1 = __importDefault(require("./CardanoWallet"));
const Logger_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/Logger"));
const TransactionNumber_1 = __importDefault(require("./TransactionNumber"));
class CardanoClientBF {
    constructor(cardanoWalletMnemonic, blockfrostProjectId, cardanoNetwork, cardanoMetadataLabel) {
        this.cardanoWalletMnemonic = cardanoWalletMnemonic;
        this.blockfrostProjectId = blockfrostProjectId;
        this.cardanoNetwork = cardanoNetwork;
        this.cardanoMetadataLabel = cardanoMetadataLabel;
        this.cardanoWallet = new CardanoWallet_1.default(cardanoWalletMnemonic, cardanoNetwork);
        this.blockfrostAPI = new blockfrost_js_1.BlockFrostAPI({ projectId: blockfrostProjectId });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Wallet Address: ${this.cardanoWallet.getAddress()}`);
        });
    }
    submitSidetreeTransaction(cardanoSidetreeTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const txId = yield this.blockfrostAPI.txSubmit(cardanoSidetreeTransaction.txCBOR);
            return txId;
        });
    }
    createSidetreeTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const protoParams = yield this.getLatestProtocolParameters();
            const ledgerTip = yield this.getLedgerTip();
            const utxos = yield this.getUtxos();
            const transaction = this.cardanoWallet.createAndSignTransaction(transactionData, this.cardanoMetadataLabel, protoParams, utxos, ledgerTip.slot);
            return transaction;
        });
    }
    createLockTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield this.createSidetreeTransaction(transactionData);
            return transaction;
        });
    }
    createReleaseLockTransaction(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield this.getTransaction(transactionHash);
            return transaction;
        });
    }
    getUtxos() {
        return __awaiter(this, void 0, void 0, function* () {
            const address = this.cardanoWallet.getAddress().toString();
            const addressUtxos = yield this.blockfrostAPI.addressesUtxos(address);
            const utxos = [];
            let totalValue = 0;
            for (const utxo of addressUtxos) {
                utxos.push({
                    address: address,
                    amount: +utxo.amount[0].quantity,
                    txHash: utxo.tx_hash,
                    index: utxo.tx_index
                });
                totalValue += +utxo.amount[0].quantity;
                if (totalValue >= 1500000) {
                    break;
                }
            }
            return utxos;
        });
    }
    getBalanceInLovelaces() {
        return __awaiter(this, void 0, void 0, function* () {
            const address = yield this.blockfrostAPI.addresses(this.cardanoWallet.getAddress().toString());
            Logger_1.default.info(address);
            return +address.amount[0].quantity;
        });
    }
    getTransactionFeeInLovelaces(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this.blockfrostAPI.txs(transactionHash);
            return +tx.fees;
        });
    }
    getTransaction(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this.blockfrostAPI.txs(transactionHash);
            const block = yield this.blockfrostAPI.blocks(tx.block);
            const metadata = yield this.blockfrostAPI.txsMetadata(transactionHash);
            const txUTXO = yield this.blockfrostAPI.txsUtxos(transactionHash);
            const inputs = [];
            for (const i of txUTXO.inputs) {
                inputs.push({
                    address: i.address,
                    amount: +i.amount[0].quantity,
                    txHash: i.tx_hash,
                    index: i.output_index
                });
            }
            const outputs = [];
            for (const o of txUTXO.outputs) {
                outputs.push({
                    address: o.address,
                    amount: +o.amount[0].quantity
                });
            }
            let txmeta = '';
            try {
                const jmeta = metadata[0].json_metadata.toString();
                txmeta = Buffer.from(jmeta.replace('0x', 'hex')).toString();
            }
            catch (error) {
                Logger_1.default.error(`Current transaction metadata error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
                txmeta = '';
            }
            return {
                outputs: outputs,
                inputs: inputs,
                hash: tx.hash,
                fees: +tx.fees,
                blockHash: tx.block,
                blockHeight: tx.block_height,
                index: tx.index,
                metadata: txmeta,
                blockConfirmations: block.confirmations,
                transactionNumber: TransactionNumber_1.default.construct(tx.block_height, tx.index)
            };
        });
    }
    getTxMetadataPage(page, batchSize) {
        return __awaiter(this, void 0, void 0, function* () {
            const txMetadatas = [];
            try {
                const blockFrostMetadatas = yield this.blockfrostAPI.metadataTxsLabel(this.cardanoMetadataLabel, { page: page, order: 'desc', count: batchSize });
                for (const meta of blockFrostMetadatas) {
                    txMetadatas.push({
                        txHash: meta.tx_hash,
                        jsonMetadata: meta.json_metadata,
                        cborMetadata: null
                    });
                }
                return txMetadatas;
            }
            catch (error) {
                return txMetadatas;
            }
        });
    }
    getLatestProtocolParameters() {
        return __awaiter(this, void 0, void 0, function* () {
            const latestEpoch = yield this.blockfrostAPI.epochsLatest();
            const protocolParams = yield this.blockfrostAPI.epochsParameters(latestEpoch.epoch);
            return {
                epoch: protocolParams.epoch,
                minFeeA: protocolParams.min_fee_a,
                minFeeB: protocolParams.min_fee_b,
                maxTxSize: protocolParams.max_tx_size,
                keyDeposit: +protocolParams.key_deposit,
                poolDeposit: +protocolParams.pool_deposit,
                minUtxo: +protocolParams.min_utxo,
                maxValSize: +protocolParams.max_val_size
            };
        });
    }
    getLedgerTip() {
        return __awaiter(this, void 0, void 0, function* () {
            const latestBlock = yield this.blockfrostAPI.blocksLatest();
            return {
                time: latestBlock.time,
                height: latestBlock.height,
                hash: latestBlock.hash,
                slot: latestBlock.slot,
                epoch: latestBlock.epoch,
                size: latestBlock.size,
                confirmations: latestBlock.confirmations
            };
        });
    }
}
exports.default = CardanoClientBF;
//# sourceMappingURL=CardanoClient_blockfrost.js.map