const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { connectDB, closeDB, fetchDB } = require("../dist/database");
const { formatUnits } = require("viem");
const { privateKeyToAddress } = require("viem/accounts");
const { readFileSync } = require("fs");
const { getBalance, decryptKey } = require("../dist/utils");
const path = require("path");

// Import your local functions
// Note: We'll use require for now to avoid ES module issues
const { swapAnyTokens } = require("../dist/swapAnyTokens.js");
const { addLiquidityUSDCUSDT, addLiquidityBNBUSDC } = require("../dist/addLiquidity.js");
const { removeLiquidityUSDCUSDT, removeLiquidityBNBUSDC, getLiquidityInfo, removeLiquidityTraderJoeUSDCUSDT } = require("../dist/removeLiquidity.js");

dotenv.config();

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

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/analysis", async (req, res) => {
  try {
    let results = [];
    try {
      await connectDB();
      results = await fetchDB();
    } catch (dbError) {
      console.warn("Database connection failed:", dbError.message);
    } finally {
      try {
        await closeDB();
      } catch (closeError) {
        console.warn("Database close error (non-critical):", closeError.message);
      }
    }
    res.json(results);
  } catch (error) {
    console.error("API endpoint error:", error);
    res.json([]); // Return empty array instead of error
  }
});

// Trading dashboard endpoint
app.get("/dashboard", async (req, res) => {
  try {
    let trades = [];
    let stats = {
      totalTrades: 0,
      totalVolume: "0.00",
      uniqueWallets: 0,
      averageTradeSize: "0.00",
      tokenBreakdown: {},
      firstTrade: null,
      lastTrade: null
    };

    try {
      await connectDB();
      trades = await fetchDB();
      stats = calculateTradingStats(trades);
    } catch (dbError) {
      console.warn("Database connection failed, using default values:", dbError.message);
      // Continue with default empty values instead of throwing error
    } finally {
      try {
        await closeDB();
      } catch (closeError) {
        console.warn("Database close error (non-critical):", closeError.message);
      }
    }
    
    res.json({
      trades,
      stats,
      network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
      status: trades.length > 0 ? "connected" : "no_data"
    });
  } catch (error) {
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
        firstTrade: null,
        lastTrade: null
      },
      network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet",
      status: "error",
      error: error.message
    });
  }
});

// Swap endpoint
app.post("/swap", async (req, res) => {
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
    const txHash = await swapAnyTokens(symbolIn, symbolOut, amountIn);
    console.log("Swap successful, txHash:", txHash);
    return res.json({ message: "Swap completed", txHash });
  } catch (err) {
    console.error("Swap error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Add Liquidity endpoints
app.post("/add-liquidity", async (req, res) => {
  try {
    const { type, amount1, amount2, binStep = "1", slippage = 0.5 } = req.body;// Default binStep to "1"
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
      txHash = await addLiquidityUSDCUSDT(amount1, amount2, slippage);
    } else if (type === "bnb-usdc") {
      console.log("Adding BNB-USDC liquidity:", { amount1, amount2, slippage });
      txHash = await addLiquidityBNBUSDC(amount1, amount2, slippage);
    } else {
      return res.status(400).json({ error: "Invalid liquidity type. Use 'usdc-usdt' or 'bnb-usdc'" });
    }

    console.log("Add liquidity successful, txHash:", txHash);
    return res.json({ message: "Liquidity added successfully", txHash, type });
  } catch (err) {
    console.error("Add liquidity error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Remove liquidity endpoint
app.post("/remove-liquidity", async (req, res) => {
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
        txHash = await removeLiquidityTraderJoeUSDCUSDT(percentage.toString(), slippage);
      } else {
        return res.status(400).json({ error: "TraderJoe only supports 'usdc-usdt' for now" });
      }
    } else {
      // PancakeSwap V2 liquidity removal (default)
      if (type === "usdc-usdt") {
        console.log("Removing PancakeSwap USDC-USDT liquidity:", { percentage, slippage });
        txHash = await removeLiquidityUSDCUSDT(percentage.toString(), slippage);
      } else if (type === "bnb-usdc") {
        console.log("Removing PancakeSwap BNB-USDC liquidity:", { percentage, slippage });
        txHash = await removeLiquidityBNBUSDC(percentage.toString(), slippage);
      } else {
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
  } catch (err) {
    console.error("Remove liquidity error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get liquidity info endpoint
app.get("/liquidity-info/:type", async (req, res) => {
  try {
    const { type } = req.params;
    console.log("Received liquidity info request for type:", type);

    if (!type || (type !== "usdc-usdt" && type !== "bnb-usdc")) {
      return res.status(400).json({ error: "Invalid liquidity type. Use 'usdc-usdt' or 'bnb-usdc'" });
    }

    const liquidityInfo = await getLiquidityInfo(type);
    console.log("Liquidity info retrieved:", liquidityInfo);

    return res.json({
      type,
      liquidityInfo,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Get liquidity info error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Trading visualization data endpoint
app.get("/trading-chart", async (req, res) => {
  try {
    await connectDB();
    const trades = await fetchDB();
    
    // Prepare data for charts
    const chartData = prepareChartData(trades);
    
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await closeDB();
  }
});

function calculateTradingStats(trades) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      totalVolume: 0,
      uniqueWallets: 0,
      averageTradeSize: 0,
      tokenBreakdown: {},
      profitLoss: 0
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
    } else if (trade.swap_from_token === 'USDC' || trade.swap_from_token === 'USDT') {
      usdValue = trade.amount_from;
    }
    
    totalVolumeUSD += usdValue;
    
    // Token breakdown
    const fromToken = trade.swap_from_token;
    const toToken = trade.swap_to_token;
    
    if (!tokenBreakdown[fromToken]) tokenBreakdown[fromToken] = { volume: 0, count: 0 };
    if (!tokenBreakdown[toToken]) tokenBreakdown[toToken] = { volume: 0, count: 0 };
    
    tokenBreakdown[fromToken].volume += trade.amount_from;
    tokenBreakdown[fromToken].count += 1;
  });

  return {
    totalTrades,
    totalVolume: totalVolumeUSD.toFixed(2),
    uniqueWallets,
    averageTradeSize: (totalVolumeUSD / totalTrades).toFixed(2),
    tokenBreakdown,
    firstTrade: trades[0]?.created_at,
    lastTrade: trades[trades.length - 1]?.created_at
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
    if (!hourlyVolume[key]) hourlyVolume[key] = { hour: key, volume: 0, trades: 0 };
    hourlyVolume[key].volume += trade.amount_from;
    hourlyVolume[key].trades += 1;
  });

  const volumeData = Object.values(hourlyVolume).sort((a, b) => 
    parseInt(a.hour) - parseInt(b.hour)
  );

  return {
    timeSeriesData,
    tokenDistribution,
    volumeData,
    totalTrades: trades.length
  };
}

async function getWalletBalance(address) {
  try {
    // 获取BNB余额 (原生代币)
    const bnbBalance = await getBalance(address, undefined);
    
    // 获取USDC余额
    const usdcBalance = await getBalance(address, USDC_ADDRESS);
    
    // 获取USDT余额
    const usdtBalance = await getBalance(address, USDT_ADDRESS);
    
    // 获取WBNB余额
    const wbnbBalance = await getBalance(address, WBNB_ADDRESS);
    
    // 格式化余额 (所有代币都是18位小数)
    let bnb = formatUnits(bnbBalance, 18);
    let usdc = formatUnits(usdcBalance, 18);
    let usdt = formatUnits(usdtBalance, 18);
    let wbnb = formatUnits(wbnbBalance, 18);
    
    // 转换为数字并保留合适的小数位数
    bnb = Number(bnb).toFixed(4);   // BNB显示4位小数
    usdc = Number(usdc).toFixed(2); // USDC显示2位小数
    usdt = Number(usdt).toFixed(2); // USDT显示2位小数
    wbnb = Number(wbnb).toFixed(4); // WBNB显示4位小数
    
    return { 
      bnb, 
      usdc,
      usdt, 
      wbnb, 
      address,
      network: MODE === "dev" ? "BSC Testnet" : "BSC Mainnet"
    };
  } catch (error) {
    console.error(`Error getting balance for ${address}:`, error);
    return { 
      bnb: "0.0000", 
      usdc: "0.00",
      usdt: "0.00", 
      wbnb: "0.0000", 
      address,
      error: error.message 
    };
  }
}

app.get("/wallets", async (req, res) => {
  try {
    const rootDir = path.resolve(__dirname, "../");
    const secretFilePath = path.join(rootDir, "secret", "trading_keys.txt");
    let PRIVATE_KEYS = [];
    
    try {
      const data = readFileSync(secretFilePath, "utf8");
      const arrayString = decryptKey(data);
      PRIVATE_KEYS = JSON.parse(arrayString);
    } catch (error) {
      console.error("Error reading trading keys file:", error);
      // 如果读取失败，返回只有主账户的信息
    }
    
    // 主账户
    let main_account = privateKeyToAddress(`0x${PRIVATE_KEY}`);
    
    // 交易账户
    let trading_accounts = PRIVATE_KEYS.map((key) => privateKeyToAddress(key));
    
    // 所有账户
    const allAccounts = [main_account, ...trading_accounts];

    // 获取所有账户余额
    const balances = await Promise.all(allAccounts.map(getWalletBalance));
    
    // 添加账户类型标识
    const walletsWithType = balances.map((balance, index) => ({
      ...balance,
      type: index === 0 ? "main" : "trading",
      id: index === 0 ? "main" : `trading_${index}`
    }));

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
    
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 获取单个钱包详细信息
app.get("/wallet/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await getWalletBalance(address);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// Local instance
app.listen(5000, () => {
  console.log(`🚀 Server listening on port 5000`);
  console.log(`📊 Network: ${MODE === "dev" ? "BSC Testnet" : "BSC Mainnet"}`);
  console.log(`💰 Tokens:`);
  console.log(`   USDC: ${USDC_ADDRESS}`);
  console.log(`   USDT: ${USDT_ADDRESS}`);
  console.log(`   WBNB: ${WBNB_ADDRESS}`);
  console.log(`🌐 Dashboard: http://localhost:5000/`);
});

// Serve dashboard HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

// Serve trading dashboard
app.get("/trading", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/trading.html"));
});

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Vercel instance
module.exports = app;