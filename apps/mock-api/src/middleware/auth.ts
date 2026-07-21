import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@crm/types";

export const MOCK_JWT_SECRET = "super-secret-mock-jwt-key-autonex-crm";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

// Extend global Express namespace to automatically type req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const PUBLIC_ROUTES = [
  "/api/v1/auth/login",
  "/api/v1/auth/signup"
];

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow public routes
  const path = req.originalUrl || req.path;
  if (
    path.startsWith("/api/v1/auth/login") ||
    path.startsWith("/api/v1/auth/signup") ||
    req.path.startsWith("/auth/login") ||
    req.path.startsWith("/auth/signup")
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing or invalid token"
    });
  }

  const token = authHeader.split(" ")[1] || "";

  try {
    const decoded = jwt.verify(token, MOCK_JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid token session"
    });
  }
}
