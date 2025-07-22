import { Client, QueryResult } from "pg";
import { config } from "dotenv";

config();

const { DB_HOST, DB_USER, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

const database = new Client({
  host: DB_HOST || "localhost",
  user: DB_USER || "trading_user",
  password: DB_PASSWORD || "trading_pass_2025",
  database: DB_NAME || "trading_bot",
  port: parseInt(DB_PORT || "5432"),
});

async function connectDB(): Promise<string> {
  try {
    await database.connect();
    console.log("Connection established");
    return "Connection established";
  } catch (err: any) {
    console.error("Database connection error:", err);
    throw new Error("Error connecting to Db: " + err.message);
  }
}

async function closeDB(): Promise<string> {
  try {
    await database.end();
    console.log("Connection closed");
    return "Connection closed";
  } catch (err: any) {
    console.error("Database close error:", err);
    throw new Error("Error closing Db: " + err.message);
  }
}

const sql = "SELECT * FROM transactions";
async function fetchDB(): Promise<any[]> {
  try {
    const result: QueryResult = await database.query(sql);
    return result.rows;
  } catch (err: any) {
    console.error("Database fetch error:", err);
    throw new Error("Error fetching from DB: " + err.message);
  }
}

async function insertDB(sql: string, values: any[]): Promise<QueryResult> {
  try {
    const result: QueryResult = await database.query(sql, values);
    console.log("Data inserted successfully");
    return result;
  } catch (err: any) {
    console.error("Error inserting into DB:", err);
    throw new Error("Error inserting into DB: " + err.message);
  }
}

const traders_sql =
  "INSERT INTO traders (private_key, wallet_address) VALUES ($1, $2)";
const txn_sql =
  "INSERT INTO transactions (tx_hash, wallet_address, swap_from_token, swap_to_token, amount_from, amount_to, time) VALUES ($1, $2, $3, $4, $5, $6, $7)";

export {
  connectDB,
  closeDB,
  insertDB,
  traders_sql,
  txn_sql,
  database,
  fetchDB,
};