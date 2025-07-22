-- PostgreSQL 初始化脚本
-- 此脚本在 trading_bot 数据库中执行（由 POSTGRES_DB 环境变量自动创建）

-- 确保我们在正确的数据库中
\c trading_bot;

-- 创建交易员表（私钥字段长度）
CREATE TABLE IF NOT EXISTS traders (
    id SERIAL PRIMARY KEY,
    private_key VARCHAR(66) NOT NULL,  -- 改为66以容纳0x前缀
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_traders_wallet ON traders(wallet_address);

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    swap_from_token VARCHAR(10) NOT NULL,
    swap_to_token VARCHAR(10) NOT NULL,
    amount_from DECIMAL(30,18) NOT NULL,
    amount_to DECIMAL(30,18) NOT NULL,
    time INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions(time);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);