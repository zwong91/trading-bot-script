import { WalletClient } from "viem";
import { BASES, assetParams, wallets_count, initializeRouter } from "./const";
import { createClient, keyGen, validateInputs } from "./utils";
import {
  gen_key,
  fund_account,
  defund_account,
  approve_router,
} from "./wallets";
import log from "./fs";
import { connectDB, closeDB, insertDB, traders_sql } from "./database";
import { writeFileSync } from "fs";

const [WBNB, USDC] = BASES;

async function run() {
  const CLIENTS: WalletClient[] = [];
  const PRIVATE_KEYS: string[] = [];
  validateInputs();
  try {
    // 首先初始化动态路由器
    console.log("🔧 初始化路由器配置...");
    await initializeRouter();
    
    await connectDB();

    for (let i = 0; i < wallets_count; i++) {
      // Generate new key and client, fund and add to array
      let privateKey = gen_key();
      PRIVATE_KEYS.push(privateKey);

      const client = createClient(privateKey);
      CLIENTS.push(client);

      let address = client.account.address;

      try {
        let trader_data = [privateKey, address];
        await insertDB(traders_sql, trader_data);
      } catch (error) {
        console.error("Couldn't add data to db");
        continue;
      }
      // 资金转账
      console.log("💰 开始资金转账资助新号...");
      try {
        await fund_account({
          tokenAddress: USDC.address as `0x${string}`,
          decimals: USDC.decimals,
          bnb_amount: assetParams[WBNB.symbol!].max.toString(),
          token_amount: assetParams[USDC.symbol!].max.toString(),
          recipientAddress: address,
        });
        console.log("✅ 资金转账资助新号成功");
      } catch (error) {
        console.error("❌ 资金转账资助新号失败:", error);
        throw error;
      }

      // 授权路由器
      console.log("🔐 开始路由器授权...");
      try {
        await approve_router(USDC.address as `0x${string}`, client);
        console.log("✅ 路由器授权成功");
      } catch (error) {
        console.error("❌ 路由器授权失败:", error);
        throw error;
      }
    }

    const arrayAsString = JSON.stringify(PRIVATE_KEYS);
    const keyCipher = keyGen(arrayAsString);

    // Write the cipher to a file
    writeFileSync("./secret/trading_keys.txt", keyCipher);

    log("Init Script completed successfully!");
  } catch (err) {
    try {
      for (let i = 0; i < CLIENTS.length; i++) {
        await defund_account(USDC.address as `0x${string}`, CLIENTS[i]);
      }

      log("Accounts defunded");
    } catch (e: any) {
      log(`Error in defund accounts: ${PRIVATE_KEYS}`, undefined, true);
    }

    log(err, undefined, true);
  } finally {
    await closeDB();
  }
}

run().catch((error) => {
  console.error("init error", error);
  process.exit(1);
});
