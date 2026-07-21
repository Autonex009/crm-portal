import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { profiles } from "../store";
import { SEED_USERS } from "../store/seed";
import { MOCK_JWT_SECRET } from "../middleware/auth";
import { UserRole } from "@crm/types";

const router = Router();

// POST /api/v1/auth/login
router.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required"
    });
  }

  // Find user in SEED_USERS
  const userMatch = Object.values(SEED_USERS).find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  // If not found in seed, check if dynamically created in profiles (use password as 'password' for simplicity)
  let foundUser: { id: string; email: string; full_name: string; role: UserRole; password?: string } | undefined = userMatch;
  if (!foundUser) {
    const profileMatch = Array.from(profiles.values()).find(
      (p) => p.id === email // Dynamic signup uses email as ID for simpler lookup if password matches
    );
    if (profileMatch && password === "password") {
      foundUser = {
        id: profileMatch.id,
        email: profileMatch.id, // Email was used as ID
        full_name: profileMatch.full_name,
        role: (profileMatch.role as UserRole) || "sales",
        password: "password"
      };
    }
  }

  if (!foundUser) {
    return res.status(400).json({
      success: false,
      error: "Invalid email or password"
    });
  }

  // Generate mock JWT token
  const tokenPayload = {
    id: foundUser.id,
    email: foundUser.email,
    role: foundUser.role,
    full_name: foundUser.full_name
  };

  const token = jwt.sign(tokenPayload, MOCK_JWT_SECRET, { expiresIn: "24h" });

  // Standard Supabase GoTrue Auth response shape
  return res.json({
    success: true,
    data: {
      user: {
        id: foundUser.id,
        email: foundUser.email,
        user_metadata: {
          full_name: foundUser.full_name
        },
        role: "authenticated"
      },
      session: {
        access_token: token,
        refresh_token: `mock-refresh-${foundUser.id}`,
        expires_in: 86400,
        token_type: "bearer"
      }
    }
  });
});

// POST /api/v1/auth/signup
router.post("/signup", (req: Request, res: Response) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      error: "Email, password, and full name are required"
    });
  }

  const existingProfile = Array.from(profiles.values()).find(
    (p) => p.id === email
  );

  if (existingProfile) {
    return res.status(400).json({
      success: false,
      error: "User already exists"
    });
  }

  const newId = crypto.randomUUID();
  const assignedRole: UserRole = (role && ["admin", "sales", "account_manager"].includes(role))
    ? role as UserRole
    : "sales";

  const newProfile = {
    id: newId,
    full_name,
    role: assignedRole,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  profiles.set(newId, newProfile);

  const tokenPayload = {
    id: newId,
    email,
    role: assignedRole,
    full_name
  };

  const token = jwt.sign(tokenPayload, MOCK_JWT_SECRET, { expiresIn: "24h" });

  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: newId,
        email,
        user_metadata: {
          full_name
        },
        role: "authenticated"
      },
      session: {
        access_token: token,
        refresh_token: `mock-refresh-${newId}`,
        expires_in: 86400,
        token_type: "bearer"
      }
    }
  });
});

// GET /api/v1/auth/me
router.get("/me", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const profile = profiles.get(req.user.id);

  return res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: "authenticated"
      },
      profile: profile || {
        id: req.user.id,
        full_name: req.user.full_name,
        role: req.user.role,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  });
});

export default router;
