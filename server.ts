import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

import authRouter from "./backend/routes/auth.js";
import dashboardRouter from "./backend/routes/dashboard.js";
import patientsRouter from "./backend/routes/patients.js";
import addPatientsRoute from "./backend/routes/addpatients.js";
import catalogueRoutes from "./backend/routes/catalogue.js";
import nurseRoutes from "./backend/routes/nurses.js";
import appointmentRoutes from "./backend/routes/appointments.js";
import bookingsRoute from "./backend/routes/bookings.js";
import usersRoutes from "./backend/routes/users.js";
import attendanceRoutes from "./backend/routes/attendance.js";
import financialRouter from "./backend/routes/financial.js";
import payrollRouter from "./backend/routes/payroll.js";
import registerRouter from "./backend/routes/register.js";
import { getPool } from "./backend/db.js";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes mounted on /api
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

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Dunwell Clinic server running on http://0.0.0.0:${PORT}`);
    try {
      await getPool();
    } catch (err: any) {
      console.warn("Initial DB connection warning:", err.message);
    }
  });
}

startServer();
