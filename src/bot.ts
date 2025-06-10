import { WalletClient, formatUnits } from "viem";
import { BASES, assetParams } from "./const";
import { trade, getRoute } from "./trade";
import {
  createClient,
  decryptKey,
  getBalance,
  validateInputs,
  validateWalletsFile,
} from "./utils";
import { fund_account } from "./wallets";
import { Token } from "@traderjoe-xyz/sdk-core";
import log from "./fs";
import { connectDB, closeDB } from "./database";
import { readFileSync } from "fs";

//在 WBNB 和 USDC 之间不断切换交易
const [WBNB, USDC] = BASES;

async function run() {
  const CLIENTS: WalletClient[] = [];
  var PRIVATE_KEYS: `0x${string}`[] = [];
  validateInputs();
  validateWalletsFile();
  try {
    await connectDB();

    const InToken: { [key: `0x${string}`]: number } = {};
    const MaxedOut: { [key: string]: Set<string> } = {};

    const data = readFileSync("./secret/trading_keys.txt", "utf8");
    PRIVATE_KEYS = JSON.parse(decryptKey(data));

    PRIVATE_KEYS.forEach((key) => {
      const client = createClient(key);
      CLIENTS.push(client);
      let address = client.account.address;
      let index = getRandomIndex();// 随机选择代币 (0=WBNB, 1=USDC)
      InToken[address] = index;
      MaxedOut[address] = new Set<string>();
    });

    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < CLIENTS.length; j++) {
        let currentClient = CLIENTS[j];
        let currentAddress = currentClient.account?.address as `0x${string}`;

        let tokenIndex = InToken[currentAddress];
        let inputToken = BASES[tokenIndex];// 当前持有的代币
        let outputToken = BASES[(tokenIndex + 1) % 2];// 要交换的目标代币
        InToken[currentAddress] = tokenIndex === 0 ? 1 : 0;// 下次交易时反向
        let [isNativeIn, isNativeOut] = [tokenIndex === 0, tokenIndex === 1];

        const [min, max] = [
          assetParams[inputToken.symbol!].min,
          assetParams[inputToken.symbol!].max,
        ];

        const newMax = await getMax(currentAddress, inputToken, max);

        if (newMax <= 0.01) {
          MaxedOut[currentAddress].add(inputToken.symbol!);
          if (MaxedOut[currentAddress].size === 2) {
            // 如果两种代币都用完了，重新注资
            await fund_account({
              tokenAddress: USDC.address as `0x${string}`,
              decimals: USDC.decimals,
              bnb_amount: assetParams[WBNB.symbol!].max.toString(),
              token_amount: assetParams[USDC.symbol!].max.toString(),
              recipientAddress: currentAddress,
            });
            MaxedOut[currentAddress].clear();
          }
          continue;
        }

        let amount = getRandomNumber(min, newMax).toFixed(2).toString();

        let routeParams = {
          amount,
          inputToken,
          outputToken,
          isNativeIn,
          isNativeOut,
        };
        let route = getRoute(routeParams);
        await trade(currentClient, route);
      }
    }
    log("Bot Script completed successfully!");
  } catch (err) {
    log(`An error occurred: ${err}`, "error.txt");
  } finally {
    await closeDB();
  }
}

function getRandomNumber(min: number, max: number) {
  let newMin = min > max ? 0.01 : min;
  return Math.random() * (max - newMin) + newMin;
}
function getRandomIndex() {
  return Math.floor(Math.random() * 2);
}

async function getMax(
  currentAddress: `0x${string}`,
  inputToken: Token,
  max: number,
) {
  let balance: bigint | string | number = await getBalance(
    currentAddress,
    inputToken.address as `0x${string}`,
  );
  balance = formatUnits(balance, inputToken.decimals);
  balance = Number(balance);

  return max >= balance
    ? inputToken.symbol === WBNB.symbol!
      ? balance - 0.01 // BNB保留gas费
      : balance
    : max;
}

run().catch((error) => {
  console.error("bot error", error);
  process.exit(1);
});
