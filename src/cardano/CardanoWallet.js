"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cardanoWasm = __importStar(require("@emurgo/cardano-serialization-lib-nodejs"));
const ErrorCode_1 = __importDefault(require("./ErrorCode"));
const SidetreeError_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/SidetreeError"));
const bip39 = require('bip39-light');
class CardanoWallet {
    constructor(cardanoWalletMnemonic, cardanoNetwork) {
        if (!bip39.validateMnemonic(cardanoWalletMnemonic)) {
            throw SidetreeError_1.default.createFromError(ErrorCode_1.default.CardanoWalletIncorrectImportString, new Error('Invalid mnemonic'));
        }
        const entropy2 = bip39.mnemonicToEntropy(cardanoWalletMnemonic);
        const rootKey = cardanoWasm.Bip32PrivateKey.from_bip39_entropy(Buffer.from(entropy2, 'hex'), Buffer.from(''));
        const cip1852Account = rootKey
            .derive(1852 | 0x80000000)
            .derive(1815 | 0x80000000)
            .derive(0 | 0x80000000);
        const utxoPrivateKey = cip1852Account
            .derive(0)
            .derive(0);
        const utxoPubKey = utxoPrivateKey.to_public();
        const stakeKey = cip1852Account
            .derive(2)
            .derive(0)
            .to_public();
        const netid = cardanoNetwork === 'mainnet' ? cardanoWasm.NetworkInfo.mainnet().network_id() : cardanoWasm.NetworkInfo.testnet().network_id();
        this.baseAddress = cardanoWasm.BaseAddress.new(netid, cardanoWasm.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()), cardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash()));
        this.walletAddress = this.baseAddress.to_address().to_bech32();
        this.privateKey = utxoPrivateKey.to_raw_key();
    }
    getAddress() {
        return this.walletAddress;
    }
    generateMnmonic() {
        return bip39.generateMnemonic((32 * 15) / 3);
    }
    createAndSignTransaction(anchorString, metadataLabel, protocolParameters, utxos, ledgerTip) {
        var _a;
        const txBuilder = cardanoWasm.TransactionBuilder.new(cardanoWasm.LinearFee.new(cardanoWasm.BigNum.from_str(protocolParameters.minFeeA.toString()), cardanoWasm.BigNum.from_str(protocolParameters.minFeeB.toString())), cardanoWasm.BigNum.from_str(protocolParameters.minUtxo.toString()), cardanoWasm.BigNum.from_str(protocolParameters.poolDeposit.toString()), cardanoWasm.BigNum.from_str(protocolParameters.keyDeposit.toString()), protocolParameters.maxValSize, protocolParameters.maxTxSize);
        for (const utxo of utxos) {
            txBuilder.add_input(this.baseAddress.to_address(), cardanoWasm.TransactionInput.new(cardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.txHash, 'hex')), utxo.index), cardanoWasm.Value.new(cardanoWasm.BigNum.from_str(utxo.amount.toString())));
        }
        txBuilder.add_output(cardanoWasm.TransactionOutput.new(this.baseAddress.to_address(), cardanoWasm.Value.new(cardanoWasm.BigNum.from_str('1000000'))));
        const auxData = cardanoWasm.AuxiliaryData.new();
        var uint8array = new TextEncoder().encode(anchorString.toString());
        const metadata = cardanoWasm.encode_arbitrary_bytes_as_metadatum(uint8array);
        const transactionMetadata = cardanoWasm.GeneralTransactionMetadata.new();
        transactionMetadata.insert(cardanoWasm.BigNum.from_str(metadataLabel.toString()), metadata);
        auxData.set_metadata(transactionMetadata);
        txBuilder.set_auxiliary_data(auxData);
        txBuilder.set_ttl(ledgerTip + 600);
        txBuilder.add_change_if_needed(this.baseAddress.to_address());
        const txBody = txBuilder.build();
        const txHash = cardanoWasm.hash_transaction(txBody);
        const witnesses = cardanoWasm.TransactionWitnessSet.new();
        const vkeyWitnesses = cardanoWasm.Vkeywitnesses.new();
        const vkeyWitness = cardanoWasm.make_vkey_witness(txHash, this.privateKey);
        vkeyWitnesses.add(vkeyWitness);
        witnesses.set_vkeys(vkeyWitnesses);
        const transaction = cardanoWasm.Transaction.new(txBody, witnesses, auxData);
        return {
            txCBOR: this.toHexString(transaction.to_bytes()),
            txBytes: transaction.to_bytes(),
            txHash: this.toHexString(txHash.to_bytes()),
            fees: +(((_a = txBuilder.get_fee_if_set()) === null || _a === void 0 ? void 0 : _a.to_str()) || 0)
        };
    }
    toHexString(byteArray) {
        return Array.from(byteArray, (byte) => {
            return (`0${(byte & 0xFF).toString(16)}`).slice(-2);
        }).join('');
    }
}
exports.default = CardanoWallet;
//# sourceMappingURL=CardanoWallet.js.map