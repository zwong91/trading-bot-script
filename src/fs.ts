import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

// 日志级别枚举
enum LogLevel {
  INFO = "INFO",
  WARN = "WARN", 
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
  DEBUG = "DEBUG"
}

// 颜色配置
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

/**
 * 生成友好的时间戳
 */
function now(): string {
  const time = new Date();
  
  // 使用更友好的中文时间格式
  const year = time.getFullYear();
  const month = (time.getMonth() + 1).toString().padStart(2, "0");
  const day = time.getDate().toString().padStart(2, "0");
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取日志级别对应的颜色和图标
 */
function getLogStyle(level: LogLevel): { color: string; icon: string } {
  switch (level) {
    case LogLevel.SUCCESS:
      return { color: colors.green, icon: "✅" };
    case LogLevel.ERROR:
      return { color: colors.red, icon: "❌" };
    case LogLevel.WARN:
      return { color: colors.yellow, icon: "⚠️" };
    case LogLevel.DEBUG:
      return { color: colors.cyan, icon: "🔍" };
    default:
      return { color: colors.blue, icon: "ℹ️" };
  }
}

/**
 * 确保日志目录存在
 */
function ensureLogDirectory(filePath: string): void {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

/**
 * 友善的日志记录函数（向后兼容版本）
 * @param data 要记录的数据
 * @param filePath 日志文件路径，默认为 ./logs/app.log
 * @param isErrorOrLevel 旧版本的isError布尔值或新版本的LogLevel
 * @param showConsole 是否在控制台显示
 */
function log(
  data: any,
  filePath: string = "./logs/app.log",
  isErrorOrLevel: boolean | LogLevel = LogLevel.INFO,
  showConsole: boolean = true
): void {
  try {
    // 处理向后兼容性
    let level: LogLevel;
    let throwError = false;
    
    if (typeof isErrorOrLevel === 'boolean') {
      // 旧版本API：第三个参数是isError
      level = isErrorOrLevel ? LogLevel.ERROR : LogLevel.INFO;
      throwError = isErrorOrLevel;
    } else {
      // 新版本API：第三个参数是LogLevel
      level = isErrorOrLevel;
    }
    
    // 确保日志目录存在
    ensureLogDirectory(filePath);
    
    // 格式化数据
    const formattedData = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    
    // 生成日志内容
    const timestamp = now();
    const logLine = `[${timestamp}] [${level}] ${formattedData}\n`;
    
    // 写入文件
    fs.appendFile(filePath, logLine, (err) => {
      if (err) {
        console.error(`${colors.red}❌ 日志写入失败:${colors.reset}`, err.message);
      }
    });

    // 控制台输出
    if (showConsole) {
      const { color, icon } = getLogStyle(level);
      const isTest = process.env.MODE === "dev";
      
      if (isTest || level !== LogLevel.DEBUG) {
        console.log(`${color}${icon} [${timestamp}] ${formattedData}${colors.reset}`);
      }
    }

    // 如果是错误且需要抛出异常
    if (throwError) {
      throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes(String(data))) {
      // 重新抛出我们创建的错误
      throw error;
    }
    console.error(`${colors.red}❌ 日志处理出错:${colors.reset}`, error);
  }
}

/**
 * 便捷的日志方法
 */
const logger = {
  /**
   * 信息日志
   */
  info: (data: any, filePath?: string) => {
    log(data, filePath, LogLevel.INFO);
  },

  /**
   * 成功日志
   */
  success: (data: any, filePath?: string) => {
    log(data, filePath, LogLevel.SUCCESS);
  },

  /**
   * 警告日志
   */
  warn: (data: any, filePath?: string) => {
    log(data, filePath, LogLevel.WARN);
  },

  /**
   * 错误日志
   */
  error: (data: any, filePath?: string, throwError: boolean = false) => {
    log(data, filePath, LogLevel.ERROR);
    if (throwError) {
      throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
    }
  },

  /**
   * 调试日志
   */
  debug: (data: any, filePath?: string) => {
    log(data, filePath, LogLevel.DEBUG);
  },

  /**
   * 交易日志 - 专门用于交易记录
   */
  trade: (data: any) => {
    log(data, "./logs/trading.log", LogLevel.INFO);
  },

  /**
   * 钱包日志 - 专门用于钱包操作
   */
  wallet: (data: any) => {
    log(data, "./logs/wallet.log", LogLevel.INFO);
  },

  /**
   * 数据库日志 - 专门用于数据库操作
   */
  database: (data: any) => {
    log(data, "./logs/database.log", LogLevel.INFO);
  }
};

// 导出默认的log函数以保持向后兼容
export default log;

// 导出新的logger对象和类型
export { logger, LogLevel };
