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
Object.defineProperty(exports, "__esModule", { value: true });
const pancakeswap_trade_1 = require("./pancakeswap-trade");
const const_1 = require("./const");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const sdk_core_1 = require("@lb-xyz/sdk-core");
// 创建钱包客户端
const walletClient = (0, viem_1.createWalletClient)({
    account: const_1.account,
    chain: chains_1.bscTestnet,
    transport: (0, viem_1.http)(),
});
// 定义代币
const USDT = new sdk_core_1.Token(97, // BSC 测试网
"0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", 18, "USDT", "Tether USD");
const ETH = new sdk_core_1.Token(97, // BSC 测试网
"0x8babbb98678facc7342735486c851abd7a0d17ca", 18, "ETH", "Ethereum Token");
function buyETHWithUSDT() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔄 准备用 USDT 购买 ETH 代币...");
            console.log("=".repeat(50));
            // 准备交易参数
            const amount = "1"; // 1 USDT
            console.log("交易详情:");
            console.log(`   输入: ${amount} USDT`);
            console.log(`   输出: ETH`);
            console.log(`   路径: ${USDT.symbol} -> ${ETH.symbol}`);
            console.log(`   USDT地址: ${USDT.address}`);
            console.log(`   ETH地址: ${ETH.address}`);
            // 使用 PancakeSwap V2 路由器
            const router = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
            // 获取正确格式的路由信息
            const pancakeRoute = (0, pancakeswap_trade_1.getPancakeSwapRoute)({
                amount: amount,
                inputToken: USDT,
                outputToken: ETH,
                isNativeIn: false,
                isNativeOut: false,
            });
            console.log("\n🚀 开始执行交易...");
            yield (0, pancakeswap_trade_1.tradePancakeSwap)(walletClient, pancakeRoute, router);
            console.log("✅ USDT -> ETH 交易完成!");
            console.log("🔍 请运行余额检查脚本验证 ETH 余额变化");
        }
        catch (error) {
            console.error("❌ 交易失败:", error);
        }
    });
}
buyETHWithUSDT();
