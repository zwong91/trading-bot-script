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
const const_1 = require("./const");
const ethers_1 = require("ethers");
const chains_1 = require("viem/chains");
// Create ethers provider from viem publicClient
const MODE = process.env.MODE || "dev";
const chain = MODE === "dev" ? chains_1.bscTestnet : chains_1.bsc;
const provider = new ethers_1.ethers.JsonRpcProvider(chain.rpcUrls.default.http[0]);
// Router addresses
const ROUTERS = {
    PANCAKESWAP: MODE === "dev"
        ? "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" // BSC测试网 V2
        : "0x10ED43C718714eb63d5aA57B78B54704E256024E", // BSC主网 V2
    PANCAKESWAP_INFINITY: MODE === "dev"
        ? "0x1b81D678ffb9C0263b24A97847620C99d213eB14" // BSC测试网 Infinity
        : "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", // BSC主网 Infinity
    TRADERJOE: MODE === "dev"
        ? "0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98" // BSC测试网 TraderJoe
        : "0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98" // BSC主网 TraderJoe
};
// Token addresses
const TOKENS = {
    USDT: MODE === "dev"
        ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC测试网USDT
        : "0x55d398326f99059fF775485246999027B3197955", // BSC主网USDT
    USDC: MODE === "dev"
        ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC测试网USDC
        : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC主网USDC
    WBNB: MODE === "dev"
        ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" // BSC测试网WBNB
        : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // BSC主网WBNB
    ETH: "0x8babbb98678facc7342735486c851abd7a0d17ca" // ETH token address
};
// ABI for basic contract checks
const ERC20_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];
const ROUTER_ABI = [
    "function factory() external pure returns (address)",
    "function WETH() external pure returns (address)"
];
// PancakeSwap Infinity ABI (V3-style)
const INFINITY_ROUTER_ABI = [
    "function factory() external view returns (address)",
    "function WETH9() external view returns (address)",
    "function positionManager() external view returns (address)"
];
// TraderJoe V2.2 ABI
const TRADERJOE_ROUTER_ABI = [
    "function getFactory() external view returns (address)",
    "function getWNATIVE() external view returns (address)",
    "function getIdFromPriceX128(uint256 priceX128) external pure returns (uint24)"
];
function testRouterSelection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧪 测试动态路由器选择...");
        console.log("=".repeat(50));
        try {
            const config = yield (0, const_1.initializeRouter)();
            console.log("\n📊 路由器选择结果:");
            console.log("   选择的路由器:", config.name);
            console.log("   路由器地址:", config.address);
            console.log("   路由器类型:", config.type);
            console.log("   是否有效:", config.isValid);
            console.log("   链ID:", const_1.CHAIN_ID);
            if (config.isValid) {
                console.log("\n✅ 动态路由器选择测试成功!");
                console.log("🚀 现在可以安全地运行交易机器人");
            }
            else {
                console.log("\n⚠️  路由器可能存在问题，请检查网络连接");
            }
        }
        catch (error) {
            console.error("\n❌ 动态路由器选择测试失败:", error);
            console.log("🔄 建议手动检查路由器配置或网络连接");
        }
    });
}
function testAllRouters() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n🔍 测试所有可用路由器...");
        console.log("=".repeat(50));
        const routerTests = [
            {
                name: "PancakeSwap V2",
                type: "pancakeswap",
                address: ROUTERS.PANCAKESWAP,
                abi: ROUTER_ABI,
                factoryMethod: "factory",
                wethMethod: "WETH"
            },
            {
                name: "PancakeSwap Infinity",
                type: "pancakeswap-infinity",
                address: ROUTERS.PANCAKESWAP_INFINITY,
                abi: INFINITY_ROUTER_ABI,
                factoryMethod: "factory",
                wethMethod: "WETH9"
            },
            {
                name: "TraderJoe V2.2",
                type: "traderjoe",
                address: ROUTERS.TRADERJOE,
                abi: TRADERJOE_ROUTER_ABI,
                factoryMethod: "getFactory",
                wethMethod: "getWNATIVE"
            }
        ];
        for (const router of routerTests) {
            console.log(`\n🧪 测试 ${router.name}...`);
            try {
                const routerContract = new ethers_1.Contract(router.address, router.abi, provider);
                // Test basic contract connectivity with appropriate methods
                let factory, weth;
                if (router.type === "traderjoe") {
                    factory = yield routerContract.getFactory();
                    weth = yield routerContract.getWNATIVE();
                }
                else if (router.type === "pancakeswap-infinity") {
                    factory = yield routerContract.factory();
                    weth = yield routerContract.WETH9();
                }
                else {
                    factory = yield routerContract.factory();
                    weth = yield routerContract.WETH();
                }
                console.log(`   ✅ ${router.name} 连接成功`);
                console.log(`      地址: ${router.address}`);
                console.log(`      工厂: ${factory}`);
                console.log(`      WETH: ${weth}`);
                // Test token contract connectivity
                console.log(`   🪙 测试代币连接...`);
                const usdtContract = new ethers_1.Contract(TOKENS.USDT, ERC20_ABI, provider);
                const usdcContract = new ethers_1.Contract(TOKENS.USDC, ERC20_ABI, provider);
                const usdtSymbol = yield usdtContract.symbol();
                const usdcSymbol = yield usdcContract.symbol();
                console.log(`      USDT: ${usdtSymbol} ✅`);
                console.log(`      USDC: ${usdcSymbol} ✅`);
                // Additional info for specific routers
                if (router.type === "pancakeswap-infinity") {
                    try {
                        const positionManager = yield routerContract.positionManager();
                        console.log(`      位置管理器: ${positionManager}`);
                    }
                    catch (e) {
                        console.log(`      位置管理器: 不可用`);
                    }
                }
                if (router.type === "traderjoe") {
                    try {
                        // Test TraderJoe specific function
                        const samplePriceX128 = "79228162514264337593543950336"; // price = 1
                        const id = yield routerContract.getIdFromPriceX128(samplePriceX128);
                        console.log(`      价格ID转换测试: ${id} ✅`);
                    }
                    catch (e) {
                        console.log(`      价格ID转换测试: 不可用`);
                    }
                }
            }
            catch (error) {
                console.log(`   ❌ ${router.name} 连接失败:`, error instanceof Error ? error.message : String(error));
                // Try basic contract existence check
                try {
                    const code = yield provider.getCode(router.address);
                    if (code === "0x") {
                        console.log(`      ⚠️  合约不存在或未部署在此地址`);
                    }
                    else {
                        console.log(`      ℹ️  合约存在但ABI不匹配 (代码长度: ${code.length} 字符)`);
                    }
                }
                catch (e) {
                    console.log(`      ❌ 无法检查合约状态`);
                }
            }
        }
    });
}
function testTokenConnectivity() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n🪙 测试代币连接性...");
        console.log("=".repeat(50));
        const tokens = [
            { name: "USDT", address: TOKENS.USDT },
            { name: "USDC", address: TOKENS.USDC },
            { name: "WBNB", address: TOKENS.WBNB },
            { name: "ETH", address: TOKENS.ETH }
        ];
        for (const token of tokens) {
            console.log(`\n🧪 测试 ${token.name}...`);
            try {
                const tokenContract = new ethers_1.Contract(token.address, ERC20_ABI, provider);
                const name = yield tokenContract.name();
                const symbol = yield tokenContract.symbol();
                const decimals = yield tokenContract.decimals();
                console.log(`   ✅ ${token.name} 连接成功`);
                console.log(`      名称: ${name}`);
                console.log(`      符号: ${symbol}`);
                console.log(`      精度: ${decimals}`);
                console.log(`      地址: ${token.address}`);
            }
            catch (error) {
                console.log(`   ❌ ${token.name} 连接失败:`, error instanceof Error ? error.message : String(error));
            }
        }
    });
}
function testNetworkConnectivity() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n🌐 测试网络连接性...");
        console.log("=".repeat(50));
        try {
            const network = yield provider.getNetwork();
            const blockNumber = yield provider.getBlockNumber();
            const feeData = yield provider.getFeeData();
            console.log("   ✅ 网络连接成功");
            console.log("      网络名称:", network.name);
            console.log("      链ID:", network.chainId.toString());
            console.log("      当前区块:", blockNumber);
            console.log("      Gas价格:", feeData.gasPrice ? ethers_1.ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A", "Gwei");
        }
        catch (error) {
            console.log("   ❌ 网络连接失败:", error instanceof Error ? error.message : String(error));
        }
    });
}
// 主函数
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🚀 开始综合路由器测试套件...");
        console.log("=".repeat(60));
        // 测试网络连接性
        yield testNetworkConnectivity();
        // 测试代币连接性
        yield testTokenConnectivity();
        // 测试所有路由器
        yield testAllRouters();
        // 测试动态路由器选择
        yield testRouterSelection();
        console.log("\n" + "=".repeat(60));
        console.log("🎯 测试总结:");
        console.log("   ✅ 网络连接性测试 - 检查BSC网络状态");
        console.log("   🪙 代币连接性测试 - 验证USDT、USDC、WBNB、ETH");
        console.log("   🔄 路由器可用性测试 - PancakeSwap、TraderJoe");
        console.log("   🎲 动态选择测试 - 自动选择最佳路由器");
        console.log("\n💡 使用提示:");
        console.log("   - 如果所有测试通过，可以运行: npm run init");
        console.log("   - 如果网络测试失败，请检查网络连接");
        console.log("   - 如果路由器测试失败，系统会自动选择可用的路由器");
        console.log("   - 系统支持PancakeSwap V2、PancakeSwap Infinity和TraderJoe V2.2");
        console.log("\n🔧 故障排除:");
        console.log("   - 网络错误: 检查RPC连接和网络状态");
        console.log("   - 代币错误: 验证代币合约地址是否正确");
        console.log("   - 路由器错误: 确认路由器合约部署状态");
    });
}
main().catch(console.error);
