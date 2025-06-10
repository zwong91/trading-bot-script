const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB, closeDB, fetchDB } = require("../dist/database");
const { formatUnits } = require("viem");
const { privateKeyToAddress } = require("viem/accounts");
const { readFileSync } = require("fs");
const { getBalance, decryptKey } = require("../dist/utils");
const path = require("path");

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

app.get("/api", async (req, res) => {
  try {
    await connectDB();
    const results = await fetchDB();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await closeDB();
  }
});

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
// app.listen(5000, () => {
//   console.log(`🚀 Server listening on port 5000`);
//   console.log(`📊 Network: ${MODE === "dev" ? "BSC Testnet" : "BSC Mainnet"}`);
//   console.log(`💰 Tokens:`);
//   console.log(`   USDC: ${USDC_ADDRESS}`);
//   console.log(`   USDT: ${USDT_ADDRESS}`);
//   console.log(`   WBNB: ${WBNB_ADDRESS}`);
// });

// Vercel instance
module.exports = app;