USE trading_bot;

-- 创建交易员表（私钥字段长度）
CREATE TABLE IF NOT EXISTS traders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    private_key VARCHAR(66) NOT NULL,  -- 改为66以容纳0x前缀
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address)
);

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL,
    swap_from_token VARCHAR(10) NOT NULL,
    swap_to_token VARCHAR(10) NOT NULL,
    amount_from DECIMAL(30,18) NOT NULL,
    amount_to DECIMAL(30,18) NOT NULL,
    time INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_time (time),
    INDEX idx_hash (tx_hash)
);