import express from "express";
import getPool, { sql } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT
        AppointID,
        PatientID,
        StartTime,
        EndTime,
        UserID,
        ServiceName,
        ServicePrice,
        FinalPrice,
        PaymentMethod,
        MedicalAidName,
        MedicalAidNumber,
        MedicalAid_MainMember,
        MainMember__IDNo,
        MedicalAid_option,
        Status
      FROM Appointments
      WHERE StartTime IS NOT NULL
    `;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query += ` AND StartTime BETWEEN @startDate AND @endDate`;
      request.input("startDate", sql.DateTime, start);
      request.input("endDate", sql.DateTime, end);
    }

    query += ` ORDER BY StartTime DESC`;

    const result = await request.query(query);
    const records = result.recordset || [];

    let totalRevenue = 0;
    let cashCount = 0;
    let cardCount = 0;
    let medAidCount = 0;

    const revenueByService = {};
    const revenueByPayment = {};
    const medicalAidCounts = {};

    records.forEach((r) => {
      const price = parseFloat(r.FinalPrice ?? r.ServicePrice) || 0;
      totalRevenue += price;

      const service = r.ServiceName || "Unknown";
      revenueByService[service] = (revenueByService[service] || 0) + price;

      const payment = (r.PaymentMethod || "UNKNOWN").toUpperCase();
      revenueByPayment[payment] = (revenueByPayment[payment] || 0) + price;

      if (payment === "CASH") {
        cashCount++;
      } else if (payment === "CARD") {
        cardCount++;
      } else if (payment === "MEDICAL-AID" || payment === "MEDICAL AID") {
        medAidCount++;
        if (r.MedicalAidName) {
          medicalAidCounts[r.MedicalAidName] = (medicalAidCounts[r.MedicalAidName] || 0) + 1;
        }
      }
    });

    const revenueByServiceArray = Object.entries(revenueByService)
      .map(([name, revenue]) => ({
        name,
        revenue: Number(revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByPaymentArray = Object.entries(revenueByPayment).map(
      ([name, revenue]) => ({
        name,
        revenue: Number(revenue.toFixed(2)),
      })
    );

    const medicalAidArray = Object.entries(medicalAidCounts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      records,
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalAppointments: records.length,
        cashCount,
        cardCount,
        medAidCount,
        revenueByService: revenueByServiceArray,
        revenueByPayment: revenueByPaymentArray,
        medicalAidCounts: medicalAidArray,
      },
    });
  } catch (err) {
    console.error("Finance API error:", err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;
