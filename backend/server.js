import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";
import addPatientsRoute from "./routes/addpatients.js";
import patientsRouter from "./routes/patients.js";
import catalogueRoutes from "./routes/catalogue.js";
import nurseRoutes from "./routes/nurses.js";
import appointmentRoutes from "./routes/appointments.js";
import bookingsRoute from "./routes/bookings.js";
import usersRoutes from "./routes/users.js";
import attendanceRoutes from "./routes/attendance.js";
import financialRouter from "./routes/financial.js";
import payrollRouter from "./routes/payroll.js";
import registerRouter from "./routes/register.js";
import { getPool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded whether executed from repo root or backend folder
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// Middleware
app.use(cors()); // allow requests from frontend
app.use(express.json());

// Routes mounted under /api
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/patients/add", addPatientsRoute);
app.use("/api/patients", patientsRouter);
app.use("/api/catalogue", catalogueRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingsRoute);
app.use("/api/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/financial", financialRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/register", registerRouter);

// Health check endpoint (for Render / monitoring)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Dunwell Clinic Backend" });
});

// ----------------------------------------------------
// Serve the frontend (React/Vite build) in production
// ----------------------------------------------------
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

// For React Router: send index.html for any unknown non-API route
// Using app.use middleware avoids Express 5 path-to-regexp wildcard PathError
app.use((req, res) => {
  // If requesting an unmatched /api route, return 404 JSON instead of index.html
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint not found" });
  }

  const indexPath = path.join(frontendPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("Dunwell Clinic Backend API is running.");
  }
});

// ----------------------------------------------------
// Server start: Render sets process.env.PORT (e.g. 10000)
// ----------------------------------------------------
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize Azure SQL pool eagerly
  try {
    await getPool();
  } catch (err) {
    console.warn("Initial DB connection warning:", err.message);
  }
});
