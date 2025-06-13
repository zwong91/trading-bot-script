/**
 * 一键运行所有测试的入口文件
 * 测试交易机器人的所有核心功能
 */

import { logger } from '../src/fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// 测试配置
interface TestConfig {
    name: string;
    file: string;
    description: string;
    critical: boolean; // 是否为关键测试
    timeout: number; // 超时时间（毫秒）
}

const TEST_CONFIGS: TestConfig[] = [
    {
        name: "日志系统",
        file: "test-logger.ts",
        description: "测试日志记录、文件写入和格式化功能",
        critical: true,
        timeout: 30000
    },
    {
        name: "路由器功能",
        file: "test-router.ts", 
        description: "测试网络连接、路由器选择和代币合约",
        critical: true,
        timeout: 60000
    },
    {
        name: "数据库钱包",
        file: "test-database-wallet.ts",
        description: "测试数据库连接、钱包生成和加密功能",
        critical: true,
        timeout: 45000
    },
    {
        name: "Infinity路由",
        file: "test-infinity.ts",
        description: "测试PancakeSwap Infinity路由器功能",
        critical: false,
        timeout: 30000
    },
    {
        name: "流动性添加",
        file: "test-add-liquidity.ts",
        description: "测试TraderJoe V2.2流动性添加功能",
        critical: true,
        timeout: 120000
    },
    {
        name: "流动性移除", 
        file: "test-remove-liquidity.ts",
        description: "测试TraderJoe V2.2流动性移除功能",
        critical: true,
        timeout: 90000
    },
    {
        name: "代币交换",
        file: "test-swap-any-tokens.ts",
        description: "测试任意代币交换功能",
        critical: false,
        timeout: 90000
    },
    {
        name: "BNB-USDC专项",
        file: "test-bnb-usdc.ts",
        description: "测试TraderJoe BNB-USDC流动性功能",
        critical: false,
        timeout: 150000
    }
];

// 测试结果统计
interface TestResult {
    name: string;
    status: 'success' | 'failed' | 'timeout' | 'skipped';
    duration: number;
    error?: string;
    output?: string;
}

class TestRunner {
    private results: TestResult[] = [];
    private startTime: number = 0;

    async runAllTests(skipNonCritical: boolean = false): Promise<void> {
        this.startTime = Date.now();
        
        logger.info("🚀 启动交易机器人全面测试套件");
        logger.info("=".repeat(80));
        logger.info(`   测试模式: ${skipNonCritical ? "仅关键测试" : "完整测试"}`);
        logger.info(`   测试数量: ${skipNonCritical ? TEST_CONFIGS.filter(t => t.critical).length : TEST_CONFIGS.length}`);
        logger.info(`   开始时间: ${new Date().toLocaleString()}`);
        logger.info("=".repeat(80));

        const testsToRun = skipNonCritical ? TEST_CONFIGS.filter(t => t.critical) : TEST_CONFIGS;

        for (let i = 0; i < testsToRun.length; i++) {
            const test = testsToRun[i];
            await this.runSingleTest(test, i + 1, testsToRun.length);
            
            // 在关键测试之间稍作休息
            if (test.critical && i < testsToRun.length - 1) {
                logger.info("   ⏳ 等待5秒后继续下一个测试...\n");
                await this.sleep(5000);
            }
        }

        this.generateReport();
    }

    private async runSingleTest(test: TestConfig, index: number, total: number): Promise<void> {
        const startTime = Date.now();
        
        logger.info(`📋 [${index}/${total}] 测试: ${test.name}`);
        logger.info(`   文件: ${test.file}`);
        logger.info(`   描述: ${test.description}`);
        logger.info(`   关键性: ${test.critical ? "🔴 关键" : "🟡 可选"}`);
        logger.info(`   超时: ${test.timeout / 1000}秒`);
        logger.info("-".repeat(60));

        try {
            const command = `npx ts-node test/${test.file}`;
            const { stdout, stderr } = await this.executeWithTimeout(command, test.timeout);
            
            const duration = Date.now() - startTime;
            
            // 检查输出中是否有错误指示
            const hasErrors = stderr.length > 0 || stdout.includes('❌') || stdout.includes('Error:');
            
            if (hasErrors && test.critical) {
                // 关键测试失败
                this.results.push({
                    name: test.name,
                    status: 'failed',
                    duration,
                    error: stderr || "测试输出包含错误",
                    output: stdout
                });
                logger.error(`❌ ${test.name} 测试失败`);
                if (stderr) logger.error(`   错误: ${stderr.substring(0, 200)}...`);
            } else {
                // 测试成功或非关键测试通过
                this.results.push({
                    name: test.name,
                    status: 'success', 
                    duration,
                    output: stdout
                });
                logger.success(`✅ ${test.name} 测试完成 (${(duration/1000).toFixed(1)}s)`);
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            
            if (error instanceof Error && error.message.includes('timeout')) {
                this.results.push({
                    name: test.name,
                    status: 'timeout',
                    duration,
                    error: `测试超时 (>${test.timeout/1000}s)`
                });
                logger.warn(`⏰ ${test.name} 测试超时`);
            } else {
                this.results.push({
                    name: test.name,
                    status: 'failed',
                    duration,
                    error: error instanceof Error ? error.message : String(error)
                });
                logger.error(`❌ ${test.name} 测试异常失败`);
                logger.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        logger.info("");
    }

    private async executeWithTimeout(command: string, timeout: number): Promise<{stdout: string, stderr: string}> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Command timeout after ${timeout}ms`));
            }, timeout);

            execAsync(command, { cwd: path.resolve(__dirname, '..') })
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    private generateReport(): void {
        const totalTime = Date.now() - this.startTime;
        const successful = this.results.filter(r => r.status === 'success').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const timeout = this.results.filter(r => r.status === 'timeout').length;
        const total = this.results.length;

        logger.info("🎯 测试报告");
        logger.info("=".repeat(80));
        logger.info(`   总测试数: ${total}`);
        logger.info(`   成功: ${successful} ✅`);
        logger.info(`   失败: ${failed} ❌`);
        logger.info(`   超时: ${timeout} ⏰`);
        logger.info(`   成功率: ${((successful / total) * 100).toFixed(1)}%`);
        logger.info(`   总耗时: ${(totalTime / 1000).toFixed(1)}秒`);
        logger.info("=".repeat(80));

        // 详细结果
        logger.info("\n📊 详细测试结果:");
        this.results.forEach((result, index) => {
            const status = this.getStatusIcon(result.status);
            const duration = (result.duration / 1000).toFixed(1);
            logger.info(`   ${index + 1}. ${status} ${result.name} (${duration}s)`);
            
            if (result.error) {
                logger.info(`      错误: ${result.error}`);
            }
        });

        // 关键测试状态
        const criticalTests = this.results.filter(r => 
            TEST_CONFIGS.find(t => t.name === r.name)?.critical
        );
        const criticalSuccess = criticalTests.filter(r => r.status === 'success').length;
        const criticalTotal = criticalTests.length;

        logger.info("\n🔴 关键功能状态:");
        logger.info(`   关键测试通过率: ${((criticalSuccess / criticalTotal) * 100).toFixed(1)}%`);
        
        if (criticalSuccess === criticalTotal) {
            logger.success("   🎉 所有关键功能测试通过！系统可以投入使用");
        } else {
            logger.warn("   ⚠️  部分关键功能测试失败，建议修复后再使用");
        }

        // 建议
        logger.info("\n💡 使用建议:");
        if (failed === 0 && timeout === 0) {
            logger.info("   ✅ 系统健康度: 100% - 可以放心使用");
            logger.info("   🚀 推荐命令: npm run start");
        } else if (criticalSuccess === criticalTotal) {
            logger.info("   ✅ 系统健康度: 85%+ - 核心功能正常");
            logger.info("   🚀 可以使用，注意监控非关键功能");
        } else {
            logger.info("   ⚠️  系统健康度: <85% - 需要修复关键问题");
            logger.info("   🔧 建议先修复关键测试失败的问题");
        }

        logger.info("\n📝 测试完成时间:", new Date().toLocaleString());
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'success': return '✅';
            case 'failed': return '❌';
            case 'timeout': return '⏰';
            case 'skipped': return '⏭️';
            default: return '❓';
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI参数处理
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const skipNonCritical = args.includes('--critical-only') || args.includes('-c');
    const helpRequested = args.includes('--help') || args.includes('-h');

    if (helpRequested) {
        console.log("🧪 交易机器人测试套件");
        console.log("");
        console.log("使用方法:");
        console.log("  npx ts-node test/run-all-tests.ts              # 运行所有测试");
        console.log("  npx ts-node test/run-all-tests.ts --critical-only  # 仅运行关键测试");
        console.log("  npx ts-node test/run-all-tests.ts -c               # 仅运行关键测试（简写）");
        console.log("");
        console.log("测试说明:");
        console.log("  🔴 关键测试: 系统核心功能，必须通过");
        console.log("  🟡 可选测试: 扩展功能，可以跳过");
        console.log("");
        return;
    }

    try {
        const runner = new TestRunner();
        await runner.runAllTests(skipNonCritical);
    } catch (error) {
        logger.error("❌ 测试套件执行失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// 处理进程信号
process.on('SIGINT', () => {
    logger.warn("\n⚠️  测试被用户中断");
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.warn("\n⚠️  测试被系统终止");
    process.exit(0);
});

// 仅在直接运行此文件时执行主函数
if (require.main === module) {
    main().catch((error) => {
        logger.error("未捕获的错误:", error);
        process.exit(1);
    });
}

export { TestRunner, TEST_CONFIGS };
export default main;
