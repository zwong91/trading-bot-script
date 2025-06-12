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
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
// Import your local functions
const swapAnyTokens_1 = require("./swapAnyTokens");
const addLiquidity_1 = require("./addLiquidity");
const removeLiquidity_1 = require("./removeLiquidity");
dotenv_1.default.config();
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MODE = process.env.MODE;
// BSC 代币地址
const USDC_ADDRESS = MODE === "dev"
    ? "0x64544969ed7EBf5f083679233325356EbE738930" // BSC测试网USDC
    : "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // BSC主网USDC
const USDT_ADDRESS = MODE === "dev"
    ? "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" // BSC测试网USDT
    : "0x55d398326f99059fF775485246999027B3197955"; // BSC主网USDT
const WBNB_ADDRESS = MODE === "dev"
    ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" // BSC测试网WBNB
    : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // BSC主网WBNB
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.get("/analysis", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let results = [];
        try {
            yield (0, database_1.connectDB)();
            results = (yield (0, database_1.fetchDB)());
        }
        catch (dbError) {
            console.warn("Database connection failed:", dbError.message);
        }
        finally {
            try {
                yield (0, database_1.closeDB)();
            }
            catch (closeError) {
                console.warn("Database close error (non-critical):", closeError.message);
            }
        }
        res.json(results);
    }
    catch (error) {
        console.error("API endpoint error:", error);
        res.json([]); // Return empty array instead of error
    }
}));
// Trading dashboard endpoint
app.get("/dashboard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let trades = [];
        let stats = {
            totalTrades: 0,
            totalVolume: "0.00",
            uniqueWallets: 0,
            averageTradeSize: "0.00",
            tokenBreakdown: {},
            firstTrade: undefined,
            lastTrade: undefined
        };
        try {
            yield (0, database_1.connectDB)();
            trades = (yield (0, database_1.fetchDB)());
            stats = calculateTradingStats(trades);
        }
        catch (dbError) {
            console.warn("Database connection failed, using default values:", dbError.message);
            // Continue with default empty values instead of throwing error
        }
        finally {
            try {
                yield (0, database_1.closeDB)();
            }
            catch (closeError) {
                console.warn("Database close error (non-critical):", closeError.message);
            }
        }
        res.json({
            trades,
            stats,
            network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
            status: trades.length > 0 ? "connected" : "no_data"
        });
    }
    catch (error) {
        console.error("Dashboard endpoint error:", error);
        // Return default data instead of error
        res.json({
            trades: [],
            stats: {
                totalTrades: 0,
                totalVolume: "0.00",
                uniqueWallets: 0,
                averageTradeSize: "0.00",
                tokenBreakdown: {},
                firstTrade: undefined,
                lastTrade: undefined
            },
            network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
            status: "error",
            error: error.message
        });
    }
}));
// Swap endpoint
app.post("/swap", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { symbolIn, symbolOut, amountIn } = req.body;
        console.log("Received swap request:", { symbolIn, symbolOut, amountIn });
        if (!symbolIn || !symbolOut || !amountIn) {
            console.log("Missing required parameters");
            return res
                .status(400)
                .json({ error: "Please provide symbolIn, symbolOut, and amountIn" });
        }
        console.log("Calling swapAnyTokens with:", { symbolIn, symbolOut, amountIn });
        const txHash = yield (0, swapAnyTokens_1.swapAnyTokens)(symbolIn, symbolOut, amountIn);
        console.log("Swap successful, txHash:", txHash);
        return res.json({ message: "Swap completed", txHash });
    }
    catch (err) {
        console.error("Swap error:", err);
        return res.status(500).json({ error: err.message });
    }
}));
// Add Liquidity endpoints
app.post("/add-liquidity", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, amount1, amount2, binStep = "1", slippage = 0.5 } = req.body;
        console.log("Received add liquidity request:", { type, amount1, amount2, binStep, slippage });
        if (!type || !amount1 || !amount2) {
            console.log("Missing required parameters");
            return res
                .status(400)
                .json({ error: "Please provide type, amount1, and amount2" });
        }
        let txHash;
        if (type === "usdc-usdt") {
            console.log("Adding USDC-USDT liquidity:", { amount1, amount2, slippage });
            txHash = yield (0, addLiquidity_1.addLiquidityUSDCUSDT)(amount1, amount2, slippage.toString());
        }
        else if (type === "bnb-usdc") {
            console.log("Adding BNB-USDC liquidity:", { amount1, amount2, slippage });
            txHash = yield (0, addLiquidity_1.addLiquidityBNBUSDC)(amount1, amount2, slippage.toString());
        }
        else {
            return res.status(400).json({ error: "Invalid liquidity type. Use 'usdc-usdt' or 'bnb-usdc'" });
        }
        console.log("Add liquidity successful, txHash:", txHash);
        return res.json({ message: "Liquidity added successfully", txHash, type });
    }
    catch (err) {
        console.error("Add liquidity error:", err);
        return res.status(500).json({ error: err.message });
    }
}));
// Remove liquidity endpoint
app.post("/remove-liquidity", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, percentage = "100", slippage = 0.5, protocol = "pancakeswap" } = req.body;
        console.log("Received remove liquidity request:", { type, percentage, slippage, protocol });
        if (!type) {
            console.log("Missing required parameters");
            return res
                .status(400)
                .json({ error: "Please provide type" });
        }
        // Validate percentage
        const liquidityPercentage = parseFloat(percentage);
        if (isNaN(liquidityPercentage) || liquidityPercentage <= 0 || liquidityPercentage > 100) {
            return res.status(400).json({ error: "Percentage must be between 0 and 100" });
        }
        let txHash;
        if (protocol === "traderjoe") {
            // TraderJoe V2.2 liquidity removal
            if (type === "usdc-usdt") {
                console.log("Removing TraderJoe USDC-USDT liquidity:", { percentage, slippage });
                txHash = yield (0, removeLiquidity_1.removeLiquidityTraderJoeUSDCUSDT)(percentage.toString(), slippage);
            }
            else {
                return res.status(400).json({ error: "TraderJoe only supports 'usdc-usdt' for now" });
            }
        }
        else {
            // PancakeSwap V2 liquidity removal (default)
            if (type === "usdc-usdt") {
                console.log("Removing PancakeSwap USDC-USDT liquidity:", { percentage, slippage });
                txHash = yield (0, removeLiquidity_1.removeLiquidityUSDCUSDT)(percentage.toString(), slippage);
            }
            else if (type === "bnb-usdc") {
                console.log("Removing PancakeSwap BNB-USDC liquidity:", { percentage, slippage });
                txHash = yield (0, removeLiquidity_1.removeLiquidityBNBUSDC)(percentage.toString(), slippage);
            }
            else {
                return res.status(400).json({ error: "Invalid liquidity type. Use 'usdc-usdt' or 'bnb-usdc'" });
            }
        }
        console.log("Remove liquidity successful, txHash:", txHash);
        return res.json({
            message: "Liquidity removed successfully",
            txHash,
            type,
            percentage: `${percentage}%`,
            protocol: protocol || "pancakeswap"
        });
    }
    catch (err) {
        console.error("Remove liquidity error:", err);
        return res.status(500).json({ error: err.message });
    }
}));
// Get liquidity info endpoint
app.get("/liquidity-info/:type", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        console.log("Received liquidity info request for type:", type);
        if (!type || (type !== "usdc-usdt" && type !== "bnb-usdc")) {
            return res.status(400).json({ error: "Invalid liquidity type. Use 'usdc-usdt' or 'bnb-usdc'" });
        }
        const liquidityInfo = yield (0, removeLiquidity_1.getLiquidityInfo)(type);
        console.log("Liquidity info retrieved:", liquidityInfo);
        return res.json({
            type,
            liquidityInfo,
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
        console.error("Get liquidity info error:", err);
        return res.status(500).json({ error: err.message });
    }
}));
// Trading visualization data endpoint
app.get("/trading-chart", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.connectDB)();
        const trades = yield (0, database_1.fetchDB)();
        // Prepare data for charts
        const chartData = prepareChartData(trades);
        res.json(chartData);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
    finally {
        yield (0, database_1.closeDB)();
    }
}));
// Portfolio endpoint for DEX frontend
app.get("/portfolio", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { walletAddress } = req.query;
        // Initialize response structure
        let portfolioData = {
            portfolio: {
                totalBalances: { BNB: "0.0000", USDC: "0.00", USDT: "0.00" },
                wallets: [],
                walletCount: 0
            },
            trading: {
                recentTrades: [],
                stats: {
                    totalTrades: 0,
                    totalVolume: "0.00",
                    uniqueWallets: 0,
                    averageTradeSize: "0.00"
                }
            },
            network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
            status: 'success'
        };
        // If specific wallet requested, return that wallet's data
        if (walletAddress && typeof walletAddress === 'string') {
            try {
                const balance = yield (0, utils_1.getBalance)(walletAddress);
                return res.json({
                    walletAddress,
                    balance,
                    status: 'success'
                });
            }
            catch (error) {
                console.error(`Error fetching balance for ${walletAddress}:`, error);
                return res.json({
                    walletAddress,
                    balance: { BNB: '0.0000', USDC: '0.0000', USDT: '0.0000' },
                    status: 'error',
                    error: error.message
                });
            }
        }
        // Get wallet data using the same logic as the working /wallets endpoint
        try {
            const secretFilePath = path_1.default.join(__dirname, "../secret/trading_keys.txt");
            let PRIVATE_KEYS = [];
            try {
                const data = (0, fs_1.readFileSync)(secretFilePath, "utf8");
                const arrayString = (0, utils_1.decryptKey)(data);
                PRIVATE_KEYS = JSON.parse(arrayString);
            }
            catch (error) {
                console.warn("Error reading trading keys file:", error.message);
            }
            // Get accounts
            let main_account = (0, accounts_1.privateKeyToAddress)(`0x${PRIVATE_KEY}`);
            let trading_accounts = PRIVATE_KEYS.map((key) => (0, accounts_1.privateKeyToAddress)(key));
            const allAccounts = [main_account, ...trading_accounts];
            // Get balances
            const balances = yield Promise.all(allAccounts.map(getWalletBalance));
            // Format wallet data for portfolio
            const walletsWithType = balances.map((balance, index) => ({
                address: balance.address,
                balance: {
                    BNB: balance.bnb || "0.0000",
                    USDC: balance.usdc || "0.00",
                    USDT: balance.usdt || "0.00"
                },
                type: index === 0 ? "main" : "trading",
                id: index === 0 ? "main" : `trading_${index}`,
                alias: index === 0 ? "main" : `trading_${index}`
            }));
            // Calculate totals
            const totals = walletsWithType.reduce((acc, wallet) => {
                acc.totalBnb += parseFloat(wallet.balance.BNB || "0");
                acc.totalUsdc += parseFloat(wallet.balance.USDC || "0");
                acc.totalUsdt += parseFloat(wallet.balance.USDT || "0");
                return acc;
            }, { totalBnb: 0, totalUsdc: 0, totalUsdt: 0 });
            portfolioData.portfolio = {
                totalBalances: {
                    BNB: totals.totalBnb.toFixed(4),
                    USDC: totals.totalUsdc.toFixed(2),
                    USDT: totals.totalUsdt.toFixed(2)
                },
                wallets: walletsWithType,
                walletCount: walletsWithType.length
            };
        }
        catch (walletError) {
            console.warn("Failed to process wallets for portfolio:", walletError.message);
        }
        // Get trading data
        try {
            yield (0, database_1.connectDB)();
            const trades = yield (0, database_1.fetchDB)();
            const stats = calculateTradingStats(trades);
            portfolioData.trading = {
                recentTrades: trades.slice(-10),
                stats
            };
        }
        catch (dbError) {
            console.warn("Database connection failed for portfolio:", dbError.message);
        }
        finally {
            try {
                yield (0, database_1.closeDB)();
            }
            catch (closeError) {
                console.warn("Database close error (non-critical):", closeError.message);
            }
        }
        res.json(portfolioData);
    }
    catch (error) {
        console.error("Portfolio endpoint error:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error.message,
            status: 'error'
        });
    }
}));
function calculateTradingStats(trades) {
    var _a, _b;
    if (!trades || trades.length === 0) {
        return {
            totalTrades: 0,
            totalVolume: "0",
            uniqueWallets: 0,
            averageTradeSize: "0",
            tokenBreakdown: {}
        };
    }
    const totalTrades = trades.length;
    const uniqueWallets = [...new Set(trades.map(t => t.wallet_address))].length;
    // Calculate volumes
    let totalVolumeUSD = 0;
    const tokenBreakdown = {};
    trades.forEach(trade => {
        // Estimate USD value (simplified - using rough BNB price)
        const bnbPrice = 300; // Approximate BNB price in USD
        let usdValue = 0;
        if (trade.swap_from_token === 'WBNB') {
            usdValue = trade.amount_from * bnbPrice;
        }
        else if (trade.swap_from_token === 'USDC' || trade.swap_from_token === 'USDT') {
            usdValue = trade.amount_from;
        }
        totalVolumeUSD += usdValue;
        // Token breakdown
        const fromToken = trade.swap_from_token;
        const toToken = trade.swap_to_token;
        if (!tokenBreakdown[fromToken])
            tokenBreakdown[fromToken] = { volume: 0, count: 0 };
        if (!tokenBreakdown[toToken])
            tokenBreakdown[toToken] = { volume: 0, count: 0 };
        tokenBreakdown[fromToken].volume += trade.amount_from;
        tokenBreakdown[fromToken].count += 1;
    });
    return {
        totalTrades,
        totalVolume: totalVolumeUSD.toFixed(2),
        uniqueWallets,
        averageTradeSize: (totalVolumeUSD / totalTrades).toFixed(2),
        tokenBreakdown,
        firstTrade: (_a = trades[0]) === null || _a === void 0 ? void 0 : _a.created_at,
        lastTrade: (_b = trades[trades.length - 1]) === null || _b === void 0 ? void 0 : _b.created_at
    };
}
function prepareChartData(trades) {
    if (!trades || trades.length === 0) {
        return { timeSeriesData: [], tokenDistribution: [], volumeData: [] };
    }
    // Time series data for trading activity
    const timeSeriesData = trades.map((trade, index) => ({
        id: trade.id,
        timestamp: new Date(trade.created_at).getTime(),
        date: new Date(trade.created_at).toLocaleDateString(),
        time: new Date(trade.created_at).toLocaleTimeString(),
        fromToken: trade.swap_from_token,
        toToken: trade.swap_to_token,
        amountFrom: trade.amount_from,
        amountTo: trade.amount_to,
        txHash: trade.tx_hash,
        wallet: trade.wallet_address.slice(0, 10) + "...",
        tradeNumber: index + 1
    }));
    // Token distribution
    const tokenCounts = {};
    trades.forEach(trade => {
        tokenCounts[trade.swap_from_token] = (tokenCounts[trade.swap_from_token] || 0) + 1;
        tokenCounts[trade.swap_to_token] = (tokenCounts[trade.swap_to_token] || 0) + 1;
    });
    const tokenDistribution = Object.entries(tokenCounts).map(([token, count]) => ({
        token,
        count,
        percentage: ((count / (trades.length * 2)) * 100).toFixed(1)
    }));
    // Volume data by hour
    const hourlyVolume = {};
    trades.forEach(trade => {
        const hour = new Date(trade.created_at).getHours();
        const key = `${hour}:00`;
        if (!hourlyVolume[key])
            hourlyVolume[key] = { hour: key, volume: 0, trades: 0 };
        hourlyVolume[key].volume += trade.amount_from;
        hourlyVolume[key].trades += 1;
    });
    const volumeData = Object.values(hourlyVolume).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    return {
        timeSeriesData,
        tokenDistribution,
        volumeData,
        totalTrades: trades.length
    };
}
function getWalletBalance(address) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 获取BNB余额 (原生代币)
            const bnbBalance = yield (0, utils_1.getBalance)(address, undefined);
            // 获取USDC余额
            const usdcBalance = yield (0, utils_1.getBalance)(address, USDC_ADDRESS);
            // 获取USDT余额
            const usdtBalance = yield (0, utils_1.getBalance)(address, USDT_ADDRESS);
            // 获取WBNB余额
            const wbnbBalance = yield (0, utils_1.getBalance)(address, WBNB_ADDRESS);
            // 格式化余额 (所有代币都是18位小数)
            let bnb = (0, viem_1.formatUnits)(bnbBalance, 18);
            let usdc = (0, viem_1.formatUnits)(usdcBalance, 18);
            let usdt = (0, viem_1.formatUnits)(usdtBalance, 18);
            let wbnb = (0, viem_1.formatUnits)(wbnbBalance, 18);
            // 转换为数字并保留合适的小数位数
            const bnbFormatted = Number(bnb).toFixed(4); // BNB显示4位小数
            const usdcFormatted = Number(usdc).toFixed(2); // USDC显示2位小数
            const usdtFormatted = Number(usdt).toFixed(2); // USDT显示2位小数
            const wbnbFormatted = Number(wbnb).toFixed(4); // WBNB显示4位小数
            return {
                bnb: bnbFormatted,
                usdc: usdcFormatted,
                usdt: usdtFormatted,
                wbnb: wbnbFormatted,
                address,
                network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet"
            };
        }
        catch (error) {
            console.error(`Error getting balance for ${address}:`, error);
            return {
                bnb: "0.0000",
                usdc: "0.00",
                usdt: "0.00",
                wbnb: "0.0000",
                address,
                network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
                error: error.message
            };
        }
    });
}
app.get("/wallets", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rootDir = path_1.default.resolve(__dirname, "../");
        const secretFilePath = path_1.default.join(rootDir, "secret", "trading_keys.txt");
        let PRIVATE_KEYS = [];
        try {
            const data = (0, fs_1.readFileSync)(secretFilePath, "utf8");
            const arrayString = (0, utils_1.decryptKey)(data);
            PRIVATE_KEYS = JSON.parse(arrayString);
        }
        catch (error) {
            console.error("Error reading trading keys file:", error);
            // 如果读取失败，返回只有主账户的信息
        }
        // 主账户
        let main_account = (0, accounts_1.privateKeyToAddress)(`0x${PRIVATE_KEY}`);
        // 交易账户
        let trading_accounts = PRIVATE_KEYS.map((key) => (0, accounts_1.privateKeyToAddress)(key));
        // 所有账户
        const allAccounts = [main_account, ...trading_accounts];
        // 获取所有账户余额
        const balances = yield Promise.all(allAccounts.map(getWalletBalance));
        // 添加账户类型标识
        const walletsWithType = balances.map((balance, index) => (Object.assign(Object.assign({}, balance), { type: index === 0 ? "main" : "trading", id: index === 0 ? "main" : `trading_${index}` })));
        // 计算总计
        const totals = walletsWithType.reduce((acc, wallet) => {
            if (!wallet.error) {
                acc.totalBnb += parseFloat(wallet.bnb);
                acc.totalUsdc += parseFloat(wallet.usdc);
                acc.totalUsdt += parseFloat(wallet.usdt);
                acc.totalWbnb += parseFloat(wallet.wbnb);
            }
            return acc;
        }, { totalBnb: 0, totalUsdc: 0, totalUsdt: 0, totalWbnb: 0 });
        res.json({
            wallets: walletsWithType,
            totals: {
                totalBnb: totals.totalBnb.toFixed(4),
                totalUsdc: totals.totalUsdc.toFixed(2),
                totalUsdt: totals.totalUsdt.toFixed(2),
                totalWbnb: totals.totalWbnb.toFixed(4)
            },
            config: {
                network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
                usdcAddress: USDC_ADDRESS,
                usdtAddress: USDT_ADDRESS,
                wbnbAddress: WBNB_ADDRESS
            }
        });
    }
    catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message });
    }
}));
// 获取单个钱包详细信息
app.get("/wallet/:address", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { address } = req.params;
        const balance = yield getWalletBalance(address);
        res.json(balance);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// 健康检查端点
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
        timestamp: new Date().toISOString(),
        tokens: {
            usdc: USDC_ADDRESS,
            usdt: USDT_ADDRESS,
            wbnb: WBNB_ADDRESS
        }
    });
});
// Server startup function
function startServer(port = 5000) {
    app.listen(port, () => {
        console.log(`🚀 Server listening on port ${port}`);
        console.log(`📊 Network: ${MODE === "dev" ? "BSC Testnet" : "BSC Mainnet"}`);
        console.log(`💰 Tokens:`);
        console.log(`   USDC: ${USDC_ADDRESS}`);
        console.log(`   USDT: ${USDT_ADDRESS}`);
        console.log(`   WBNB: ${WBNB_ADDRESS}`);
        console.log(`🌐 Dashboard: http://localhost:${port}/`);
    });
}
// For direct execution
if (require.main === module) {
    startServer();
}
// Export for Vercel
exports.default = app;
