#!/usr/bin/env node
/**
 * 快速测试脚本 - 仅测试关键功能
 * 适合快速验证系统状态
 */

import { logger } from '../src/fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 快速测试配置（仅关键功能）
const QUICK_TESTS = [
    {
        name: "日志系统",
        command: "npx ts-node test/test-logger.ts",
        timeout: 15000
    },
    {
        name: "网络连接",
        command: "npx ts-node test/test-router.ts",
        timeout: 30000
    },
    {
        name: "数据库连接",
        command: "npx ts-node test/test-database-wallet.ts", 
        timeout: 20000
    }
];

async function runQuickTest(): Promise<boolean> {
    logger.info("⚡ 快速系统健康检查");
    logger.info("=".repeat(50));
    
    let allPassed = true;
    
    for (let i = 0; i < QUICK_TESTS.length; i++) {
        const test = QUICK_TESTS[i];
        const startTime = Date.now();
        
        logger.info(`🔍 [${i + 1}/${QUICK_TESTS.length}] 检查${test.name}...`);
        
        try {
            await execAsync(test.command, { timeout: test.timeout });
            const duration = Date.now() - startTime;
            logger.success(`   ✅ ${test.name} 正常 (${(duration/1000).toFixed(1)}s)`);
        } catch (error) {
            allPassed = false;
            logger.error(`   ❌ ${test.name} 异常`);
        }
    }
    
    logger.info("=".repeat(50));
    
    if (allPassed) {
        logger.success("🎉 系统健康检查通过！");
        logger.info("💡 运行完整测试: npx ts-node test/run-all-tests.ts");
        logger.info("🚀 启动机器人: npm run start");
    } else {
        logger.error("❌ 系统存在问题，建议运行完整测试诊断");
        logger.info("🔧 完整测试: npx ts-node test/run-all-tests.ts");
    }
    
    return allPassed;
}

if (require.main === module) {
    runQuickTest().catch(console.error);
}

export default runQuickTest;
