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
const router_selector_1 = require("./router-selector");
const const_1 = require("./const");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function testPancakeInfinity() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧪 测试 PancakeSwap Infinity 路由器选择");
        console.log("=".repeat(60));
        const MODE = process.env.MODE || "dev";
        try {
            // 测试路由器选择
            const routerConfig = yield (0, router_selector_1.selectBestRouter)(const_1.CHAIN_ID, MODE, const_1.publicClient);
            console.log("\n📊 路由器测试结果:");
            console.log(`   类型: ${routerConfig.type}`);
            console.log(`   名称: ${routerConfig.name}`);
            console.log(`   地址: ${routerConfig.address}`);
            console.log(`   有效: ${routerConfig.isValid ? '✅' : '❌'}`);
            // 显示 PancakeSwap Infinity 配置
            const config_network = MODE === "dev" ? router_selector_1.PANCAKE_INFINITY_CONFIG.testnet : router_selector_1.PANCAKE_INFINITY_CONFIG.mainnet;
            console.log("\n🚀 PancakeSwap Infinity 配置:");
            console.log(`   环境: ${MODE === "dev" ? "BSC测试网" : "BSC主网"}`);
            console.log(`   路由器: ${config_network.router}`);
            console.log(`   工厂: ${config_network.factory}`);
            console.log(`   WETH: ${config_network.weth}`);
            console.log(`   报价器: ${config_network.quoter}`);
            if (routerConfig.type === "pancakeswap-infinity") {
                console.log("\n🎉 成功! PancakeSwap Infinity 路由器已启用");
                console.log("   ✅ 支持智能路由");
                console.log("   ✅ 支持最佳价格发现");
                console.log("   ✅ 支持多跳交易");
                console.log("   ✅ 支持V3风格接口");
            }
            else {
                console.log("\n⚠️ 当前使用:", routerConfig.name);
                console.log("   PancakeSwap Infinity 不可用，使用备用路由器");
            }
        }
        catch (error) {
            console.error("❌ 测试失败:", error);
        }
        console.log("\n" + "=".repeat(60));
    });
}
testPancakeInfinity();
