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
exports.keyGen = keyGen;
exports.decryptKey = decryptKey;
exports.getApproval = getApproval;
exports.getNonce = getNonce;
exports.createClient = createClient;
exports.getGas = getGas;
exports.getBalance = getBalance;
exports.getGasPrice = getGasPrice;
exports.getUnixTime = getUnixTime;
exports.validateInputs = validateInputs;
exports.validateWalletsFile = validateWalletsFile;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const sdk_1 = require("@lb-xyz/sdk");
const const_1 = require("./const");
const fs_1 = require("fs");
const crypto_js_1 = __importDefault(require("crypto-js"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function createClient(privateKey) {
    const newAccount = (0, accounts_1.privateKeyToAccount)(privateKey);
    return (0, viem_1.createWalletClient)({
        account: newAccount,
        chain: const_1.chain,
        transport: (0, viem_1.http)(),
    });
}
function getGas(account, to, value) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield const_1.publicClient.estimateGas({
            account,
            to,
            value,
        });
    });
}
function getGasPrice() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield const_1.publicClient.getGasPrice();
    });
}
function getNonce(address) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield const_1.publicClient.getTransactionCount({
            address,
        });
    });
}
function getApproval(route, account, tokenAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield const_1.publicClient.readContract({
            address: tokenAddress,
            abi: sdk_1.ERC20ABI,
            functionName: "allowance",
            args: [account, route],
        });
    });
}
function getBalance(walletAddress, tokenAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        let balance = BigInt(0);
        if (tokenAddress !== undefined &&
            tokenAddress.toLowerCase() !== const_1.BASES[0].address.toLowerCase()) {
            balance = (yield const_1.publicClient.readContract({
                address: tokenAddress,
                abi: sdk_1.ERC20ABI,
                functionName: "balanceOf",
                args: [walletAddress],
            }));
        }
        else {
            balance = yield const_1.publicClient.getBalance({
                address: walletAddress,
            });
        }
        return balance;
    });
}
function getUnixTime() {
    return Math.floor(new Date().getTime() / 1000);
}
function validateInputs() {
    for (const symbol in const_1.assetParams) {
        const { min, max } = const_1.assetParams[symbol];
        if (min < 0.01 || max <= min) {
            throw new Error("Invalid min or max values");
        }
    }
}
// Encrypt function
function keyGen(text) {
    return crypto_js_1.default.AES.encrypt(text, process.env.SECRET_KEY).toString();
}
// Decrypt function
function decryptKey(ciphertext) {
    const bytes = crypto_js_1.default.AES.decrypt(ciphertext, process.env.SECRET_KEY);
    return bytes.toString(crypto_js_1.default.enc.Utf8);
}
function validateWalletsFile() {
    if (!(0, fs_1.existsSync)("./secret/trading_keys.txt")) {
        throw new Error("Trading Keys file not found");
    }
}
