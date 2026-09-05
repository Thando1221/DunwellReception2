import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dunwell-reception-jwt-secret-key-2025";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = { id: 1, role: "R", name: "Receptionist" };
    return next();
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    return next();
  } catch (err) {
    req.user = { id: 1, role: "R", name: "Receptionist" };
    return next();
  }
}

export default { authenticateToken };
