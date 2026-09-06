import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import patientsRouter from "./routes/patients.js";
import addPatientsRoute from "./routes/addpatients.js";
import catalogueRoutes from "./routes/catalogue.js";
import nurseRoutes from "./routes/nurses.js";
import appointmentRoutes from "./routes/appointments.js";
import bookingsRoute from "./routes/bookings.js";
import usersRoutes from "./routes/users.js";
import attendanceRoutes from "./routes/attendance.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/patients/add", addPatientsRoute);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingsRoute);
app.use("/api/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);

// Frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "../dist");

app.use(express.static(frontendPath));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Dunwell Clinic API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// React SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// IMPORTANT:
// Render provides PORT automatically.
// Do NOT use 1433 here.
// 1433 belongs to Azure SQL.
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
