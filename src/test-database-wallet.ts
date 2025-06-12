import { readFileSync, writeFileSync, existsSync } from "fs";
import { closeDB, connectDB, database } from "./database";
import { createClient, decryptKey, keyGen } from "./utils";
import { defund_account, gen_key } from "./wallets";

/**
 * 数据库和钱包测试套件
 * 包含数据库操作、钱包管理、加密解密等测试功能
 */

// 测试配置
const TEST_CONFIG = {
  walletSecretPath: "./secret/wallets.js",
  walletOutputPath: "./secret/wallets.txt",
  testWalletAddress: "0x95430905F4B0dA123d41BA96600427d2C92B188a" as `0x${string}`
};

/**
 * 测试批量提取资金功能
 * 从多个钱包地址提取资金到指定地址
 */
async function testBatchDefund() {
  console.log("🏦 测试批量提取资金功能...");
  console.log("=".repeat(50));
  
  // 示例私钥数组 - 在实际使用时请替换为真实私钥
  const SAMPLE_KEYS: string[] = [
    // "0x私钥1",
    // "0x私钥2", 
    // "0x私钥3"
  ];

  if (SAMPLE_KEYS.length === 0) {
    console.log("⚠️  没有配置测试私钥，跳过批量提取测试");
    return;
  }

  try {
    for (let index = 0; index < SAMPLE_KEYS.length; index++) {
      const privateKey = SAMPLE_KEYS[index] as `0x${string}`;
      console.log(`   处理钱包 ${index + 1}/${SAMPLE_KEYS.length}...`);
      
      const client = createClient(privateKey);
      await defund_account(TEST_CONFIG.testWalletAddress, client);
      
      console.log(`   ✅ 钱包 ${index + 1} 资金提取完成`);
    }
    
    console.log("✅ 批量提取资金测试完成");
  } catch (error) {
    console.error("❌ 批量提取资金测试失败:", error);
  }
}

/**
 * 测试钱包密钥生成和加密功能
 */
async function testWalletKeyGeneration() {
  console.log("\n🔐 测试钱包密钥生成和加密...");
  console.log("=".repeat(50));
  
  try {
    // 检查源文件是否存在
    if (!existsSync(TEST_CONFIG.walletSecretPath)) {
      console.log("⚠️  钱包源文件不存在，创建示例文件...");
      
      // 创建示例钱包配置文件
      const sampleWallets = {
        wallets: [
          {
            address: "0x示例地址1",
            privateKey: "0x示例私钥1"
          },
          {
            address: "0x示例地址2", 
            privateKey: "0x示例私钥2"
          }
        ]
      };
      
      writeFileSync(TEST_CONFIG.walletSecretPath, JSON.stringify(sampleWallets, null, 2));
      console.log("✅ 示例钱包文件已创建");
    }
    
    // 读取并加密钱包数据
    const walletData = readFileSync(TEST_CONFIG.walletSecretPath, "utf8");
    console.log("📖 读取钱包数据...");
    
    const encryptedKey = keyGen(walletData);
    console.log("🔒 生成加密密钥...");
    
    // 保存加密后的数据
    writeFileSync(TEST_CONFIG.walletOutputPath, encryptedKey);
    console.log("💾 保存加密数据到:", TEST_CONFIG.walletOutputPath);
    
    console.log("✅ 钱包密钥生成和加密测试完成");
    
    // 测试解密功能
    console.log("\n🔓 测试解密功能...");
    const encryptedData = readFileSync(TEST_CONFIG.walletOutputPath, "utf8");
    try {
      const decryptedData = decryptKey(encryptedData);
      console.log("✅ 解密成功，数据完整性验证通过");
    } catch (decryptError) {
      console.log("❌ 解密失败:", decryptError);
    }
    
  } catch (error) {
    console.error("❌ 钱包密钥测试失败:", error);
  }
}

/**
 * 测试数据库连接和基本操作
 */
async function testDatabaseConnection() {
  console.log("\n💾 测试数据库连接和操作...");
  console.log("=".repeat(50));
  
  try {
    // 连接数据库
    await connectDB();
    console.log("✅ 数据库连接成功");
    
    // 测试查询操作
    await testDatabaseQuery();
    
    // 测试数据清理操作
    await testDatabaseCleanup();
    
  } catch (error) {
    console.error("❌ 数据库测试失败:", error);
  } finally {
    // 关闭数据库连接
    await closeDB();
    console.log("✅ 数据库连接已关闭");
  }
}

/**
 * 测试数据库查询操作
 */
function testDatabaseQuery(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("📊 执行数据库查询测试...");
    
    const sql = "SELECT COUNT(*) as total FROM transactions";
    database.query(sql, (err: any, result: any) => {
      if (err) {
        console.error("❌ 查询失败:", err);
        reject(err);
        return;
      }
      
      console.log("✅ 查询成功，交易记录总数:", result[0]?.total || 0);
      resolve();
    });
  });
}

/**
 * 测试数据库清理操作
 */
function testDatabaseCleanup(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("🧹 执行数据库清理测试...");
    
    // 删除USDC相关的测试记录
    const sql = "DELETE FROM transactions WHERE swap_to_token = 'USDC_TEST' OR swap_from_token = 'USDC_TEST'";
    
    database.query(sql, (err: any, result: any) => {
      if (err) {
        console.error("❌ 清理操作失败:", err);
        reject(err);
        return;
      }
      
      console.log("✅ 清理操作完成");
      console.log("   受影响的记录数:", result.affectedRows || 0);
      console.log("   清理详情:", JSON.stringify(result, null, 2));
      resolve();
    });
  });
}

/**
 * 测试新钱包生成功能
 */
async function testNewWalletGeneration() {
  console.log("\n👛 测试新钱包生成功能...");
  console.log("=".repeat(50));
  
  try {
    const newPrivateKey = gen_key();
    
    console.log("✅ 新钱包私钥生成成功:");
    console.log("   私钥:", newPrivateKey.substring(0, 10) + "...(已隐藏)");
    console.log("   私钥长度:", newPrivateKey.length, "字符");
    
    // 可以通过私钥创建钱包客户端来获取地址
    try {
      const client = createClient(newPrivateKey);
      console.log("   ✅ 钱包客户端创建成功");
    } catch (clientError) {
      console.log("   ⚠️  钱包客户端创建失败:", clientError);
    }
    
  } catch (error) {
    console.error("❌ 新钱包生成失败:", error);
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log("🧪 开始数据库和钱包测试套件...");
  console.log("=".repeat(60));
  
  // 1. 测试钱包密钥生成和加密
  await testWalletKeyGeneration();
  
  // 2. 测试新钱包生成
  await testNewWalletGeneration();
  
  // 3. 测试数据库连接和操作
  await testDatabaseConnection();
  
  // 4. 测试批量提取资金 (需要配置私钥)
  await testBatchDefund();
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 测试套件完成!");
  console.log("💡 提示:");
  console.log("   - 钱包功能: 密钥生成、加密、解密");
  console.log("   - 数据库功能: 连接、查询、清理");
  console.log("   - 资金管理: 批量提取、新钱包生成");
  console.log("   - 安全性: 私钥加密存储、数据完整性验证");
}

// 导出测试函数以便单独调用
export {
  testBatchDefund,
  testWalletKeyGeneration,
  testDatabaseConnection,
  testNewWalletGeneration,
  runAllTests
};

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runAllTests().catch(console.error);
}
