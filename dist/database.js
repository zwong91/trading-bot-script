"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.txn_sql = exports.traders_sql = void 0;
exports.connectDB = connectDB;
exports.closeDB = closeDB;
exports.insertDB = insertDB;
exports.fetchDB = fetchDB;
const mysql_1 = __importDefault(require("mysql"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const { DB_HOST, DB_USER, DB_NAME, DB_PASSWORD } = process.env;
const database = mysql_1.default.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
});
exports.database = database;
function connectDB() {
    return new Promise((resolve, reject) => {
        database.connect((err) => {
            if (err) {
                console.error("Database connection error:", err);
                reject(new Error("Error connecting to Db: " + err.message));
            }
            else {
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
            }
            else {
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
            }
            else {
                resolve(result);
            }
        });
    });
}
function insertDB(sql, values) {
    return new Promise((resolve, reject) => {
        database.query(sql, values, (err, result) => {
            if (err) {
                console.error("Error inserting into DB:", err);
                reject(new Error("Error inserting into DB: " + err.message));
            }
            else {
                console.log("Data inserted successfully");
                resolve(result);
            }
        });
    });
}
var traders_sql = "INSERT INTO traders (private_key, wallet_address) VALUES (?,?)";
exports.traders_sql = traders_sql;
var txn_sql = "INSERT INTO transactions (tx_hash, wallet_address, swap_from_token, swap_to_token, amount_from, amount_to, time) VALUES (?,?,?,?,?,?,?)";
exports.txn_sql = txn_sql;
