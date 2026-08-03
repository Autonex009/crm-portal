import { Router, Request, Response } from "express";
import { profiles } from "../store";
import { UserRole } from "@crm/types";

const router = Router();

// GET /api/v1/profiles
router.get("/", (req: Request, res: Response) => {
  const profileList = Array.from(profiles.values());
  return res.json({
    success: true,
    data: profileList
  });
});

// GET /api/v1/profiles/:id
router.get("/:id", (req: Request, res: Response) => {
  const profileId = req.params.id;
  if (!profileId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const profile = profiles.get(profileId);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: "Profile not found"
    });
  }
  return res.json({
    success: true,
    data: profile
  });
});

// PATCH /api/v1/profiles/me
router.patch("/me", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const profile = profiles.get(req.user.id);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: "Profile not found"
    });
  }

  const { full_name, avatar_url } = req.body;

  if (full_name !== undefined) {
    profile.full_name = full_name;
  }
  if (avatar_url !== undefined) {
    profile.avatar_url = avatar_url;
  }
  profile.updated_at = new Date().toISOString();

  profiles.set(req.user.id, profile);

  return res.json({
    success: true,
    data: profile
  });
});

// PATCH /api/v1/profiles/:id/role (Admin only)
router.patch("/:id/role", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admins only"
    });
  }

  const profileId = req.params.id;
  if (!profileId) {
    return res.status(400).json({ success: false, error: "ID param is required" });
  }

  const profile = profiles.get(profileId);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: "Profile not found"
    });
  }

  const { role } = req.body;
  if (!role || !["admin", "sales", "account_manager", "client"].includes(role)) {
    return res.status(400).json({
      success: false,
      error: "Invalid role"
    });
  }

  profile.role = role as UserRole;
  profile.updated_at = new Date().toISOString();
  profiles.set(profileId, profile);

  return res.json({
    success: true,
    data: profile
  });
});

export default router;
