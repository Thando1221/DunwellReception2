import express from "express";
import getPool, { sql } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pool = await getPool();

    let query =
      "SELECT RegisterID, UserID, Date, TimeIn, TimeOut, OnLeave, remark_OnArrival, HoursWorked FROM Register";
    const request = pool.request();

    if (startDate && endDate) {
      query += " WHERE Date >= @startDate AND Date <= @endDate";
      request.input("startDate", sql.Date, new Date(startDate));
      request.input("endDate", sql.Date, new Date(endDate));
    }

    query += " ORDER BY Date DESC";
    const result = await request.query(query);

    function formatTime(val) {
      if (!val) return "";
      if (val instanceof Date) {
        return val.toTimeString().substring(0, 5);
      }
      const str = String(val);
      if (str.includes("T")) {
        return str.split("T")[1].substring(0, 5);
      }
      if (str.includes(" ")) {
        const parts = str.split(" ");
        const timeMatch = parts.find((p) => p.includes(":"));
        if (timeMatch) return timeMatch.substring(0, 5);
      }
      return str.substring(0, 5);
    }

    const mapped = (result.recordset || []).map((r) => ({
      ...r,
      OnLeave: r.OnLeave
        ? typeof r.OnLeave === "boolean"
          ? r.OnLeave
          : String(r.OnLeave).trim().toLowerCase() === "true" ||
            String(r.OnLeave).trim() === "1" ||
            String(r.OnLeave).trim().toLowerCase() === "yes"
        : false,
      TimeIn: formatTime(r.TimeIn),
      TimeOut: formatTime(r.TimeOut),
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
