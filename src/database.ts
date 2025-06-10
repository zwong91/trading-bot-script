import mysql from "mysql";
import { config } from "dotenv";

config();

const { DB_HOST, DB_USER, DB_NAME, DB_PASSWORD } = process.env;

const database = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

function connectDB() {
  return new Promise((resolve, reject) => {
    database.connect((err) => {
      if (err) {
        console.error("Database connection error:", err);
        reject(new Error("Error connecting to Db: " + err.message));
      } else {
        console.log("Connection established");
        resolve("Connection established");
      }
    });
  });
}

function closeDB() {
  return new Promise((resolve, reject) => {
    database.end((err) => {
      if (err) {
        console.error("Database close error:", err);
        reject(new Error("Error closing Db: " + err.message));
      } else {
        console.log("Connection closed");
        resolve("Connection closed");
      }
    });
  });
}

var sql = "SELECT * FROM transactions";
function fetchDB() {
  return new Promise((resolve, reject) => {
    database.query(sql, (err, result) => {
      if (err) {
        console.error("Database fetch error:", err);
        reject(new Error("Error fetching from DB: " + err.message));
      } else {
        resolve(result);
      }
    });
  });
}

function insertDB(sql: string, values: any[]) {
  return new Promise((resolve, reject) => {
    database.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting into DB:", err);
        reject(new Error("Error inserting into DB: " + err.message));
      } else {
        console.log("Data inserted successfully");
        resolve(result);
      }
    });
  });
}

var traders_sql =
  "INSERT INTO traders (private_key, wallet_address) VALUES (?,?)";
var txn_sql =
  "INSERT INTO transactions (tx_hash, wallet_address, swap_from_token, swap_to_token, amount_from, amount_to, time) VALUES (?,?,?,?,?,?,?)";

export {
  connectDB,
  closeDB,
  insertDB,
  traders_sql,
  txn_sql,
  database,
  fetchDB,
};