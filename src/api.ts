import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { connectDB, closeDB, fetchDB } from "./database";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
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

const app = new Hono();

// CORS middleware
app.use("*", cors());

// Types
interface Trade {
  id: number;
  tx_hash: string;
  wallet_address: string;
  swap_from_token: string;
  swap_to_token: string;
  amount_from: number;
  amount_to: number;
  time: number;
  created_at: string;
}

app.get("/analysis", async (c) => {
  try {
    let results: Trade[] = [];
    try {
      await connectDB();
      results = await fetchDB() as Trade[];
    } catch (dbError: any) {
      console.warn("Database connection failed:", dbError.message);
    } finally {
      try {
        await closeDB();
      } catch (closeError: any) {
        console.warn("Database close error (non-critical):", closeError.message);
      }
    }
    return c.json(results);
  } catch (error: any) {
    console.error("API endpoint error:", error);
    return c.json([]);
  }
});

// 健康检查端点
app.get("/health", (c) => {
  return c.json({ 
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
export function startServer(port: number = 5000) {
  serve({
    fetch: app.fetch,
    port,
  });
  
  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📊 Network: ${MODE === "dev" ? "BSC Testnet" : "BSC Mainnet"}`);
  console.log(`💰 Tokens:`);
  console.log(`   USDC: ${USDC_ADDRESS}`);
  console.log(`   USDT: ${USDT_ADDRESS}`);
  console.log(`   WBNB: ${WBNB_ADDRESS}`);
  console.log(`🌐 Dashboard: http://localhost:${port}/`);
}

// For direct execution
if (require.main === module) {
  startServer();
}

// Export for Vercel
export default app;
