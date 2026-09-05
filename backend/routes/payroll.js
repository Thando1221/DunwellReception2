import express from "express";
import getPool, { sql } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

async function ensureTable() {
  try {
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Payroll')
      CREATE TABLE Payroll (
        PayrollID INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        Bank NVARCHAR(100) NOT NULL,
        Position NVARCHAR(150) NOT NULL,
        AccountNumber NVARCHAR(50) NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        Salary DECIMAL(12,2) NOT NULL,
        Month INT NOT NULL,
        Year INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
      )
    `);
  } catch (e) {
    // If mock database or table creation restricted, ignore
  }
}

// GET /api/payroll?month=3&year=2026
router.get("/", authenticateToken, async (req, res) => {
  try {
    await ensureTable();
    const { month, year } = req.query;
    const pool = await getPool();
    const request = pool.request();
    let queryStr = "SELECT * FROM Payroll";

    if (month && year) {
      queryStr += " WHERE Month = @month AND Year = @year";
      request.input("month", sql.Int, parseInt(month));
      request.input("year", sql.Int, parseInt(year));
    }
    queryStr += " ORDER BY PayrollID ASC";

    const result = await request.query(queryStr);
    res.json(result.recordset || []);
  } catch (err) {
    console.error("Payroll GET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/payroll
router.post("/", authenticateToken, async (req, res) => {
  try {
    await ensureTable();
    const { FullName, Bank, Position, AccountNumber, Status, Salary, Month, Year } = req.body;
    if (!FullName || !Bank || !Position || !AccountNumber || !Status || !Salary || !Month || !Year) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input("FullName", sql.NVarChar(100), FullName)
      .input("Bank", sql.NVarChar(100), Bank)
      .input("Position", sql.NVarChar(150), Position)
      .input("AccountNumber", sql.NVarChar(50), AccountNumber)
      .input("Status", sql.NVarChar(50), Status)
      .input("Salary", sql.Decimal(12, 2), parseFloat(Salary))
      .input("Month", sql.Int, parseInt(Month))
      .input("Year", sql.Int, parseInt(Year))
      .query(`
        INSERT INTO Payroll (FullName, Bank, Position, AccountNumber, Status, Salary, Month, Year)
        OUTPUT INSERTED.*
        VALUES (@FullName, @Bank, @Position, @AccountNumber, @Status, @Salary, @Month, @Year)
      `);

    res.status(201).json(result.recordset ? result.recordset[0] : { PayrollID: Date.now(), ...req.body });
  } catch (err) {
    console.error("Payroll POST error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/payroll/:id
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { FullName, Bank, Position, AccountNumber, Status, Salary } = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, parseInt(id))
      .input("FullName", sql.NVarChar(100), FullName)
      .input("Bank", sql.NVarChar(100), Bank)
      .input("Position", sql.NVarChar(150), Position)
      .input("AccountNumber", sql.NVarChar(50), AccountNumber)
      .input("Status", sql.NVarChar(50), Status)
      .input("Salary", sql.Decimal(12, 2), parseFloat(Salary))
      .query(`
        UPDATE Payroll
        SET FullName=@FullName, Bank=@Bank, Position=@Position,
            AccountNumber=@AccountNumber, Status=@Status, Salary=@Salary
        OUTPUT INSERTED.*
        WHERE PayrollID=@id
      `);

    if (!result.recordset || !result.recordset.length) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Payroll PUT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/payroll/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool
      .request()
      .input("id", sql.Int, parseInt(id))
      .query("DELETE FROM Payroll WHERE PayrollID=@id");

    res.json({ success: true });
  } catch (err) {
    console.error("Payroll DELETE error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
