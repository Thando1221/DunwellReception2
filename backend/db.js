import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,

  // Azure SQL uses 1433
  port: parseInt(process.env.DB_PORT || "1433", 10),

  options: {
    encrypt: process.env.DB_ENCRYPT !== "false",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  // Increased from 2 seconds
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool = null;

let useMock =
  !process.env.DB_SERVER ||
  !process.env.DB_SERVER.trim() ||
  process.env.DB_SERVER.toLowerCase().includes("example") ||
  process.env.DB_SERVER.toLowerCase().includes("your_server");

// ----------------------------------------------------
// DATABASE CONNECTION
// ----------------------------------------------------

export async function getPool() {
  // Mock database is allowed ONLY outside production
  if (useMock && !isProduction) {
    console.log("⚠️ Development mode: using in-memory mock database.");
    return mockPool;
  }

  if (useMock && isProduction) {
    throw new Error(
      "Production database configuration is missing. Check Render environment variables."
    );
  }

  if (pool) {
    return pool;
  }

  try {
    console.log("🔄 Connecting to Azure SQL...");
    console.log(`Database server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`Database port: ${config.port}`);

    pool = await sql.connect(config);

    console.log("✅ Azure SQL connected successfully");

    return pool;
  } catch (err) {
    console.error("❌ Azure SQL connection failed:");
    console.error(err.message);

    pool = null;

    // NEVER silently use fake data in production
    if (isProduction) {
      throw new Error(
        `Production database connection failed: ${err.message}`
      );
    }

    console.warn("⚠️ Development mode: activating mock database.");

    useMock = true;

    return mockPool;
  }
}

// ----------------------------------------------------
// QUERY
// ----------------------------------------------------

export async function query(q, params = []) {
  const paramMap = {};

  params.forEach((value, index) => {
    paramMap[`p${index}`] = value;
  });

  // Development mock database
  if (useMock && !isProduction) {
    return executeMockQuery(q, paramMap);
  }

  try {
    const p = await getPool();

    // If getPool returned mock in development
    if (useMock && !isProduction) {
      return executeMockQuery(q, paramMap);
    }

    const request = p.request();

    params.forEach((value, index) => {
      request.input(`p${index}`, value);
    });

    const result = await request.query(q);

    return result.recordset;
  } catch (err) {
    console.error("❌ SQL query failed:");
    console.error(err.message);

    // NEVER fall back to fake data in production
    if (isProduction) {
      throw err;
    }

    console.warn("⚠️ Development mode: using mock database.");

    useMock = true;

    return executeMockQuery(q, paramMap);
  }
}
