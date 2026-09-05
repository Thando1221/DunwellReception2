// routes/appointments.js

import express from "express";
import sql from "mssql";
import getPool from "../db.js";

const router = express.Router();

/**
 * ===============================
 * POST /api/appointments
 * ===============================
 */
router.post("/", async (req, res) => {
  try {
    const {
      PatientID,
      StartTime,
      EndTime,
      UserID,
      ServiceName,
      PaymentMethod,
      IsStudent,
      Status,
      Booking_Type,
      MedicalAidNumber,
      MedicalAidName,
      MedicalAid_MainMember,
      MainMember__IDNo,
      MedicalAid_option,
      FinalPrice
    } = req.body;

    const pool = await getPool();

    let ServicePrice = null;
    let computedFinalPrice = FinalPrice ?? null;

    // Only look up catalogue price if ServiceName is provided
    if (ServiceName) {
      const priceResult = await pool
        .request()
        .input("ServiceName", sql.NVarChar, ServiceName)
        .query(`
          SELECT Price, discount
          FROM Catalogue
          WHERE Name = @ServiceName
        `);

      if (priceResult.recordset.length) {
        const { Price, discount } = priceResult.recordset[0];
        ServicePrice = Price;
        computedFinalPrice = FinalPrice ?? (IsStudent && discount > 0 ? discount : Price);
      }
    }

    const bookingTypeVal = Booking_Type || "Inclinic_Booking";

    // 📝 Insert appointment (with defensive fallback if database column is missing)
    try {
      await pool
        .request()
        .input("PatientID", sql.Int, PatientID)
        .input("MedicalAidNumber", sql.NVarChar, MedicalAidNumber ?? null)
        .input("StartTime", sql.DateTime, new Date(StartTime))
        .input("EndTime", sql.DateTime, EndTime ?? null)
        .input("UserID", sql.Int, UserID)
        .input("MedicalAidName", sql.NVarChar, MedicalAidName ?? null)
        .input("Status", sql.NVarChar, Status || "InPatient")
        .input("Booking_Type", sql.NVarChar, bookingTypeVal)
        .input("ServiceName", sql.NVarChar, ServiceName ?? null)
        .input("ServicePrice", sql.Decimal(10, 2), ServicePrice)
        .input("MedicalAid_MainMember", sql.NVarChar, MedicalAid_MainMember ?? null)
        .input("MainMember__IDNo", sql.NVarChar, MainMember__IDNo ?? null)
        .input("MedicalAid_option", sql.NVarChar, MedicalAid_option ?? null)
        .input("PaymentMethod", sql.NVarChar, PaymentMethod ?? null)
        .input("FinalPrice", sql.Decimal(10, 2), computedFinalPrice)
        .input("IsStudent", sql.Bit, IsStudent ? 1 : 0)
        .query(`
          INSERT INTO Appointments (
            PatientID,
            MedicalAidNumber,
            StartTime,
            EndTime,
            UserID,
            MedicalAidName,
            Status,
            Booking_Type,
            ServiceName,
            ServicePrice,
            MedicalAid_MainMember,
            MainMember__IDNo,
            MedicalAid_option,
            PaymentMethod,
            FinalPrice,
            IsStudent
          )
          VALUES (
            @PatientID,
            @MedicalAidNumber,
            @StartTime,
            @EndTime,
            @UserID,
            @MedicalAidName,
            @Status,
            @Booking_Type,
            @ServiceName,
            @ServicePrice,
            @MedicalAid_MainMember,
            @MainMember__IDNo,
            @MedicalAid_option,
            @PaymentMethod,
            @FinalPrice,
            @IsStudent
          )
        `);
    } catch (insertErr) {
      // Fallback if older MSSQL schema lacks Booking_Type column
      if (insertErr.message && insertErr.message.includes("Booking_Type")) {
        console.warn("⚠️ Booking_Type column not in SQL table; falling back to legacy insert query.");
        await pool
          .request()
          .input("PatientID", sql.Int, PatientID)
          .input("MedicalAidNumber", sql.NVarChar, MedicalAidNumber ?? null)
          .input("StartTime", sql.DateTime, new Date(StartTime))
          .input("EndTime", sql.DateTime, EndTime ?? null)
          .input("UserID", sql.Int, UserID)
          .input("MedicalAidName", sql.NVarChar, MedicalAidName ?? null)
          .input("Status", sql.NVarChar, Status || "InPatient")
          .input("ServiceName", sql.NVarChar, ServiceName ?? null)
          .input("ServicePrice", sql.Decimal(10, 2), ServicePrice)
          .input("MedicalAid_MainMember", sql.NVarChar, MedicalAid_MainMember ?? null)
          .input("MainMember__IDNo", sql.NVarChar, MainMember__IDNo ?? null)
          .input("MedicalAid_option", sql.NVarChar, MedicalAid_option ?? null)
          .input("PaymentMethod", sql.NVarChar, PaymentMethod ?? null)
          .input("FinalPrice", sql.Decimal(10, 2), computedFinalPrice)
          .input("IsStudent", sql.Bit, IsStudent ? 1 : 0)
          .query(`
            INSERT INTO Appointments (
              PatientID,
              MedicalAidNumber,
              StartTime,
              EndTime,
              UserID,
              MedicalAidName,
              Status,
              ServiceName,
              ServicePrice,
              MedicalAid_MainMember,
              MainMember__IDNo,
              MedicalAid_option,
              PaymentMethod,
              FinalPrice,
              IsStudent
            )
            VALUES (
              @PatientID,
              @MedicalAidNumber,
              @StartTime,
              @EndTime,
              @UserID,
              @MedicalAidName,
              @Status,
              @ServiceName,
              @ServicePrice,
              @MedicalAid_MainMember,
              @MainMember__IDNo,
              @MedicalAid_option,
              @PaymentMethod,
              @FinalPrice,
              @IsStudent
            )
          `);
      } else {
        throw insertErr;
      }
    }

    res.json({ message: "Appointment created successfully" });

  } catch (err) {
    console.error("❌ Appointment Create Error:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
});


/**
 * ===============================
 * GET latest medical aid
 * ===============================
 */
router.get("/latest-medical-aid/:patientId", async (req, res) => {
  try {
    const pool = await getPool(); // ✅ FIXED
    const patientId = parseInt(req.params.patientId, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid PatientID" });
    }

    const result = await pool
      .request()
      .input("PatientID", sql.Int, patientId)
      .query(`
        SELECT TOP 1
          ISNULL(MedicalAidNumber, '') AS MedicalAidNumber,
          ISNULL(MedicalAidName, '') AS MedicalAidName,
          ISNULL(MedicalAid_MainMember, '') AS MedicalAid_MainMember,
          ISNULL(MainMember__IDNo, '') AS MainMember__IDNo,
          ISNULL(MedicalAid_option, '') AS MedicalAid_option
        FROM Appointments
        WHERE PatientID = @PatientID
          AND LTRIM(RTRIM(MedicalAidName)) <> ''
        ORDER BY StartTime DESC
      `);

    if (!result.recordset.length) {
      return res.json(null);
    }

    res.json(result.recordset[0]);

  } catch (err) {
    console.error("❌ Fetch latest medical aid error:", err);
    res.status(500).json({ error: "Failed to fetch medical aid details" });
  }
});


/**
 * ===============================
 * GET appointment by ID
 * ===============================
 */
router.get("/:id", async (req, res) => {
  try {
    const pool = await getPool(); // ✅ FIXED
    const id = parseInt(req.params.id, 10);

    let result;
    try {
      result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT 
            a.AppointID AS id,
            a.PatientID,
            p.PatientName,
            p.PatientSurname,
            a.MedicalAidNumber,
            a.StartTime,
            a.EndTime,
            a.UserID,
            a.MedicalAidName,
            a.Status,
            ISNULL(a.Booking_Type, 'Inclinic_Booking') AS Booking_Type,
            a.ServiceName,
            a.ServicePrice,
            a.FinalPrice,
            a.MedicalAid_MainMember,
            a.MainMember__IDNo,
            a.MedicalAid_option,
            a.PaymentMethod,
            a.IsStudent,
            a.isFollow_Up,
            u.Name AS UserName,
            u.Surname AS UserSurname
          FROM Appointments a
          LEFT JOIN Patients p ON a.PatientID = p.PatientID
          LEFT JOIN Users u ON a.UserID = u.UserID
          WHERE a.AppointID = @id
        `);
    } catch (queryErr) {
      if (queryErr.message && queryErr.message.includes("Booking_Type")) {
        result = await pool
          .request()
          .input("id", sql.Int, id)
          .query(`
            SELECT 
              a.AppointID AS id,
              a.PatientID,
              p.PatientName,
              p.PatientSurname,
              a.MedicalAidNumber,
              a.StartTime,
              a.EndTime,
              a.UserID,
              a.MedicalAidName,
              a.Status,
              'Inclinic_Booking' AS Booking_Type,
              a.ServiceName,
              a.ServicePrice,
              a.FinalPrice,
              a.MedicalAid_MainMember,
              a.MainMember__IDNo,
              a.MedicalAid_option,
              a.PaymentMethod,
              a.IsStudent,
              a.isFollow_Up,
              u.Name AS UserName,
              u.Surname AS UserSurname
            FROM Appointments a
            LEFT JOIN Patients p ON a.PatientID = p.PatientID
            LEFT JOIN Users u ON a.UserID = u.UserID
            WHERE a.AppointID = @id
          `);
      } else {
        throw queryErr;
      }
    }

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(result.recordset[0]);

  } catch (err) {
    console.error("❌ Error fetching appointment by id:", err);
    res.status(500).json({
      message: "Server error fetching appointment",
      error: err.message
    });
  }
});


/**
 * ===============================
 * DELETE appointment
 * ===============================
 */
router.delete("/:id", async (req, res) => {
  try {
    const pool = await getPool(); // ✅ FIXED
    const id = parseInt(req.params.id, 10);

    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Appointments WHERE AppointID = @id");

    res.json({ message: "Appointment deleted successfully" });

  } catch (err) {
    console.error("❌ Delete appointment error:", err);
    res.status(500).json({
      message: "Failed to delete appointment",
      error: err.message
    });
  }
});

export default router;
