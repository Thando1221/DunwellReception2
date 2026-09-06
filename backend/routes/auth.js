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
    return res.status(400).json({
      message: "Username and password required",
    });
  }

  try {
    console.log(`🔐 Login attempt for user: ${username}`);

    const users = await query(
      "SELECT * FROM Users WHERE UserName = @p0",
      [username]
    );

    const user = users[0];

    if (!user) {
      console.log(`❌ User not found: ${username}`);

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // ---------------------------------------------
    // PASSWORD CHECK
    // ---------------------------------------------

    let validPassword = false;

    if (user.Password) {
      // Plain-text password
      if (user.Password === password) {
        validPassword = true;
      }

      // BCrypt password
      if (
        !validPassword &&
        (
          user.Password.startsWith("$2a$") ||
          user.Password.startsWith("$2b$") ||
          user.Password.startsWith("$2y$")
        )
      ) {
        try {
          validPassword = await bcrypt.compare(
            password,
            user.Password
          );
        } catch (bcryptError) {
          console.error("❌ BCrypt error:", bcryptError.message);
          validPassword = false;
        }
      }
    }

    if (!validPassword) {
      console.log(`❌ Incorrect password for: ${username}`);

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // ---------------------------------------------
    // ROLE CHECK
    // ---------------------------------------------

    const role = user.UserRole?.trim();

    if (role !== "R") {
      console.log(
        `❌ User ${username} has unauthorized role: ${role}`
      );

      return res.status(403).json({
        message: "Access denied: not authorized",
      });
    }

    // ---------------------------------------------
    // JWT
    // ---------------------------------------------

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("❌ JWT_SECRET is missing");

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: user.UserID,
        role: role,
        name: user.Name,
      },
      jwtSecret,
      {
        expiresIn: "8h",
      }
    );

    console.log(`✅ Login successful: ${username}`);

    return res.json({
      message: "Login successful",

      token,

      user: {
        id: user.UserID,
        name: user.Name,
        surname: user.Surname,
        email: user.Email,
        role: role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);

    return res.status(503).json({
      message: "Database unavailable",
    });
  }
});

export default router;
