import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password required" });
  }

  try {
    const users = await query(
      "SELECT * FROM Users WHERE LOWER(UserName) = LOWER(@p0)",
      [username.trim()]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let validPassword = user.Password === password;
    if (!validPassword && user.Password && (user.Password.startsWith("$2a$") || user.Password.startsWith("$2b$") || user.Password.startsWith("$2y$"))) {
      try {
        validPassword = await bcrypt.compare(password, user.Password);
      } catch (err) {
        validPassword = false;
      }
    }

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const rawRole = (user.UserRole || "").trim().toUpperCase();
    const allowedRoles = ["R", "A", "RECEPTIONIST", "ADMIN", "E", "IT"];
    if (!allowedRoles.includes(rawRole)) {
      return res
        .status(403)
        .json({ message: "Access denied: role not authorized" });
    }

    const normalizedRole = rawRole === "A" || rawRole === "ADMIN" || rawRole === "IT" ? "Admin" : "Receptionist";

    const token = jwt.sign(
      {
        id: user.UserID,
        role: normalizedRole,
        name: user.Name,
      },
      process.env.JWT_SECRET || "dunwell-reception-jwt-secret-key-2025",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        surname: user.Surname,
        email: user.Email,
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(503).json({
      message: "Database unavailable",
    });
  }
});

export default router;
