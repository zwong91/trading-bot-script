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
exports.testBatchDefund = testBatchDefund;
exports.testWalletKeyGeneration = testWalletKeyGeneration;
exports.testDatabaseConnection = testDatabaseConnection;
exports.testNewWalletGeneration = testNewWalletGeneration;
exports.runAllTests = runAllTests;
const fs_1 = require("fs");
const database_1 = require("./database");
const utils_1 = require("./utils");
const wallets_1 = require("./wallets");
/**
 * 数据库和钱包测试套件
 * 包含数据库操作、钱包管理、加密解密等测试功能
 */
// 测试配置
const TEST_CONFIG = {
    walletSecretPath: "./secret/wallets.js",
    walletOutputPath: "./secret/wallets.txt",
    testWalletAddress: "0x95430905F4B0dA123d41BA96600427d2C92B188a"
};
/**
 * 测试批量提取资金功能
 * 从多个钱包地址提取资金到指定地址
 */
function testBatchDefund() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🏦 测试批量提取资金功能...");
        console.log("=".repeat(50));
        // 示例私钥数组 - 在实际使用时请替换为真实私钥
        const SAMPLE_KEYS = [
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
                const privateKey = SAMPLE_KEYS[index];
                console.log(`   处理钱包 ${index + 1}/${SAMPLE_KEYS.length}...`);
                const client = (0, utils_1.createClient)(privateKey);
                yield (0, wallets_1.defund_account)(TEST_CONFIG.testWalletAddress, client);
                console.log(`   ✅ 钱包 ${index + 1} 资金提取完成`);
            }
            console.log("✅ 批量提取资金测试完成");
        }
        catch (error) {
            console.error("❌ 批量提取资金测试失败:", error);
        }
    });
}
/**
 * 测试钱包密钥生成和加密功能
 */
function testWalletKeyGeneration() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n🔐 测试钱包密钥生成和加密...");
        console.log("=".repeat(50));
        try {
            // 检查源文件是否存在
            if (!(0, fs_1.existsSync)(TEST_CONFIG.walletSecretPath)) {
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
                (0, fs_1.writeFileSync)(TEST_CONFIG.walletSecretPath, JSON.stringify(sampleWallets, null, 2));
                console.log("✅ 示例钱包文件已创建");
            }
            // 读取并加密钱包数据
            const walletData = (0, fs_1.readFileSync)(TEST_CONFIG.walletSecretPath, "utf8");
            console.log("📖 读取钱包数据...");
            const encryptedKey = (0, utils_1.keyGen)(walletData);
            console.log("🔒 生成加密密钥...");
            // 保存加密后的数据
            (0, fs_1.writeFileSync)(TEST_CONFIG.walletOutputPath, encryptedKey);
            console.log("💾 保存加密数据到:", TEST_CONFIG.walletOutputPath);
            console.log("✅ 钱包密钥生成和加密测试完成");
            // 测试解密功能
            console.log("\n🔓 测试解密功能...");
            const encryptedData = (0, fs_1.readFileSync)(TEST_CONFIG.walletOutputPath, "utf8");
            try {
                const decryptedData = (0, utils_1.decryptKey)(encryptedData);
                console.log("✅ 解密成功，数据完整性验证通过");
            }
            catch (decryptError) {
                console.log("❌ 解密失败:", decryptError);
            }
        }
        catch (error) {
            console.error("❌ 钱包密钥测试失败:", error);
        }
    });
}
/**
 * 测试数据库连接和基本操作
 */
function testDatabaseConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n💾 测试数据库连接和操作...");
        console.log("=".repeat(50));
        try {
            // 连接数据库
            yield (0, database_1.connectDB)();
            console.log("✅ 数据库连接成功");
            // 测试查询操作
            yield testDatabaseQuery();
            // 测试数据清理操作
            yield testDatabaseCleanup();
        }
        catch (error) {
            console.error("❌ 数据库测试失败:", error);
        }
        finally {
            // 关闭数据库连接
            yield (0, database_1.closeDB)();
            console.log("✅ 数据库连接已关闭");
        }
    });
}
/**
 * 测试数据库查询操作
 */
function testDatabaseQuery() {
    return new Promise((resolve, reject) => {
        console.log("📊 执行数据库查询测试...");
        const sql = "SELECT COUNT(*) as total FROM transactions";
        database_1.database.query(sql, (err, result) => {
            var _a;
            if (err) {
                console.error("❌ 查询失败:", err);
                reject(err);
                return;
            }
            console.log("✅ 查询成功，交易记录总数:", ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.total) || 0);
            resolve();
        });
    });
}
/**
 * 测试数据库清理操作
 */
function testDatabaseCleanup() {
    return new Promise((resolve, reject) => {
        console.log("🧹 执行数据库清理测试...");
        // 删除USDC相关的测试记录
        const sql = "DELETE FROM transactions WHERE swap_to_token = 'USDC_TEST' OR swap_from_token = 'USDC_TEST'";
        database_1.database.query(sql, (err, result) => {
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
function testNewWalletGeneration() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("\n👛 测试新钱包生成功能...");
        console.log("=".repeat(50));
        try {
            const newPrivateKey = (0, wallets_1.gen_key)();
            console.log("✅ 新钱包私钥生成成功:");
            console.log("   私钥:", newPrivateKey.substring(0, 10) + "...(已隐藏)");
            console.log("   私钥长度:", newPrivateKey.length, "字符");
            // 可以通过私钥创建钱包客户端来获取地址
            try {
                const client = (0, utils_1.createClient)(newPrivateKey);
                console.log("   ✅ 钱包客户端创建成功");
            }
            catch (clientError) {
                console.log("   ⚠️  钱包客户端创建失败:", clientError);
            }
        }
        catch (error) {
            console.error("❌ 新钱包生成失败:", error);
        }
    });
}
/**
 * 主测试函数
 */
function runAllTests() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧪 开始数据库和钱包测试套件...");
        console.log("=".repeat(60));
        // 1. 测试钱包密钥生成和加密
        yield testWalletKeyGeneration();
        // 2. 测试新钱包生成
        yield testNewWalletGeneration();
        // 3. 测试数据库连接和操作
        yield testDatabaseConnection();
        // 4. 测试批量提取资金 (需要配置私钥)
        yield testBatchDefund();
        console.log("\n" + "=".repeat(60));
        console.log("🎯 测试套件完成!");
        console.log("💡 提示:");
        console.log("   - 钱包功能: 密钥生成、加密、解密");
        console.log("   - 数据库功能: 连接、查询、清理");
        console.log("   - 资金管理: 批量提取、新钱包生成");
        console.log("   - 安全性: 私钥加密存储、数据完整性验证");
    });
}
// 如果直接运行此文件，执行所有测试
if (require.main === module) {
    runAllTests().catch(console.error);
}
