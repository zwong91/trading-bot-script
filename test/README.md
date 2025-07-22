# 🧪 交易机器人测试套件

这是一个完整的测试套件，用于验证交易机器人的所有核心功能。

## 🚀 快速开始

### 1. 快速健康检查（推荐新用户）
```bash
npm run test:quick
```
- ⚡ 只测试最关键的功能
- 🕐 耗时约1-2分钟
- 💡 适合首次使用或快速验证

### 2. 完整测试套件
```bash
npm run test
```
- 🔍 测试所有功能模块
- 🕐 耗时约10-15分钟
- 📊 包含实际区块链交易

### 3. 仅关键功能测试
```bash
npm run test:critical
```
- 🔴 只测试关键核心功能
- 🕐 耗时约5-8分钟
- ⚡ 跳过可选功能测试

### 4. 查看帮助
```bash
npm run test:help
```

## 📋 测试模块说明

### 🔴 关键测试（必须通过）

| 模块 | 文件 | 功能 | 重要性 |
|------|------|------|--------|
| 日志系统 | `test-logger.ts` | 日志记录、文件写入 | 🔴 关键 |
| 路由器功能 | `test-router.ts` | 网络连接、路由器选择 | 🔴 关键 |
| 数据库钱包 | `test-database-wallet.ts` | 数据库连接、钱包管理 | 🔴 关键 |
| 流动性添加 | `test-add-liquidity.ts` | DLMM流动性添加 | 🔴 关键 |
| 流动性移除 | `test-remove-liquidity.ts` | DLMM流动性移除 | 🔴 关键 |

### 🟡 可选测试（可以跳过）

| 模块 | 文件 | 功能 | 重要性 |
|------|------|------|--------|
| Infinity路由 | `test-infinity.ts` | PancakeSwap Infinity | 🟡 可选 |
| 代币交换 | `test-swap-any-tokens.ts` | 任意代币交换 | 🟡 可选 |
| BNB-USDC专项 | `test-bnb-usdc.ts` | BNB-USDC流动性 | 🟡 可选 |

## 🎯 测试结果解读

### ✅ 全部通过（100%健康度）
```
✅ 系统健康度: 100% - 可以放心使用
🚀 推荐命令: npm run start
```
- 所有功能正常工作
- 可以投入生产使用

### 🟡 关键功能通过（85%+健康度）
```
✅ 系统健康度: 85%+ - 核心功能正常
🚀 可以使用，注意监控非关键功能
```
- 核心交易功能正常
- 部分扩展功能可能有问题
- 可以谨慎使用

### ❌ 关键功能失败（<85%健康度）
```
⚠️ 系统健康度: <85% - 需要修复关键问题
🔧 建议先修复关键测试失败的问题
```
- 核心功能存在问题
- 不建议投入使用
- 需要修复后重新测试

## 🛠️ 故障排除

### 常见问题

#### 1. 网络连接失败
```bash
❌ 路由器功能 测试失败
```
**解决方案:**
- 检查网络连接
- 确认BSC RPC节点可用
- 检查防火墙设置

#### 2. 数据库连接失败
```bash
❌ 数据库钱包 测试失败
```
**解决方案:**
```bash
npm run db:up    # 启动数据库
npm run db:reset # 重置数据库
```

#### 3. 余额不足
```bash
❌ BEP40: transfer amount exceeds balance
```
**解决方案:**
- 检查钱包代币余额
- 在BSC测试网获取测试代币
- 减少测试交易金额

#### 4. 流动性不足
```bash
❌ No valid trade found
```
**解决方案:**
- 测试网络流动性有限，属正常现象
- 在主网测试或等待流动性恢复
- 选择流动性更好的交易对

### 环境检查

#### 必需文件检查
```bash
ls -la .env                    # 环境变量文件
ls -la secret/                 # 私钥文件夹
ls -la logs/                   # 日志文件夹
```

#### 依赖检查
```bash
npm list ethers viem           # 检查关键依赖
docker ps                      # 检查数据库状态
```

## 📊 测试数据说明

### 测试网络
- **网络**: BSC 测试网
- **RPC**: BSC官方测试网节点
- **区块浏览器**: https://testnet.bscscan.com

### 测试代币地址
```javascript
USDT: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
USDC: 0x64544969ed7EBf5f083679233325356EbE738930  
WBNB: 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd
```

### 路由器地址
```javascript
DLMM V2.2: 0xe98efCE22A8Ec0dd5dDF6C1A81B6ADD740176E98
PancakeSwap V2: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
```

## 🔧 高级用法

### 单独运行特定测试
```bash
npx ts-node test/test-logger.ts           # 仅测试日志
npx ts-node test/test-router.ts           # 仅测试路由器
npx ts-node test/test-add-liquidity.ts    # 仅测试流动性添加
```

### 自定义测试配置
编辑 `test/run-all-tests.ts` 中的 `TEST_CONFIGS` 数组来自定义测试配置。

### 测试输出
- **终端输出**: 实时显示测试进度
- **日志文件**: `logs/` 文件夹中的详细日志
- **测试报告**: 最终生成完整的测试报告

## 📝 注意事项

1. **首次运行**: 建议先运行 `npm run test:quick` 快速验证
2. **网络要求**: 需要稳定的网络连接访问BSC测试网
3. **资金要求**: 测试账户需要少量BNB和测试代币
4. **时间安排**: 完整测试需要10-15分钟，建议安排充足时间
5. **环境准备**: 确保 `.env` 文件和数据库正确配置

## 🎉 测试通过后

测试全部通过后，可以：
1. 运行 `npm run start` 启动交易机器人
2. 访问 `http://localhost:5000` 查看控制面板
3. 查看 `logs/` 文件夹中的运行日志
4. 根据需要调整交易参数

---

💡 **提示**: 如有问题，请先查看日志文件 `logs/app.log` 获取详细错误信息。
