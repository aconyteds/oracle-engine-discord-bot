import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";

const LOGIN_TOKENS = new Set<string>();

// Function to generate a secure token
const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Function to hash a token
const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

// Function to verify a token
const verifyToken = async (
  token: string,
  hashedToken: string
): Promise<boolean> => {
  return bcrypt.compare(token, hashedToken);
};

// Middleware function to check for a valid token
const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const storedHashedToken = process.env.HASHED_SECRET_TOKEN;
    if (!storedHashedToken) {
      throw new Error("No stored hashed token found");
    }

    // Combine the provided token with the stored hashed token
    const combinedToken = `${token}.${storedHashedToken}`;

    // Check if any stored hashed combined token matches
    let isValid = false;
    for (const hashedCombinedToken of LOGIN_TOKENS) {
      isValid = await verifyToken(combinedToken, hashedCombinedToken);
      if (isValid) break;
    }

    if (!isValid) {
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { generateToken, hashToken, verifyToken, authenticateToken };
